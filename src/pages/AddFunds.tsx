import { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Smartphone,
  Building,
  CheckCircle,
  Wallet,
  Loader2,
  Upload,
  Camera,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";

const paymentMethods = [
  {
    id: "ecocash-manual",
    name: "EcoCash",
    description: "Pay via EcoCash & upload proof",
    icon: Smartphone,
    color: "bg-green-500",
  },
  {
    id: "bank",
    name: "Bank Transfer",
    description: "Direct bank transfer",
    icon: Building,
    color: "bg-orange-500",
  },
];

const presetAmounts = [5, 10, 20, 50, 100, 200];

const ECOCASH_NUMBER = "0771234567"; // Replace with actual EcoCash merchant number
const ECOCASH_NAME = "ZimBoost SMM"; // Replace with actual name

const AddFunds = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState("");
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Check for return from PayNow
  useEffect(() => {
    const status = searchParams.get("status");
    if (status === "success") {
      toast({
        title: "Payment Processing",
        description: "Your payment is being processed. Balance will update shortly.",
      });
      refreshProfile();
    }
  }, [searchParams, toast, refreshProfile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 5MB.",
          variant: "destructive",
        });
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }

      setScreenshot(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMethod) {
      toast({
        title: "Select payment method",
        description: "Please select a payment method to continue.",
        variant: "destructive",
      });
      return;
    }

    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount < 1) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount (minimum $1).",
        variant: "destructive",
      });
      return;
    }

    // Manual EcoCash payment
    if (selectedMethod === "ecocash-manual") {
      if (!phoneNumber) {
        toast({
          title: "Phone number required",
          description: "Please enter the phone number you paid from.",
          variant: "destructive",
        });
        return;
      }

      if (!screenshot) {
        toast({
          title: "Screenshot required",
          description: "Please upload a screenshot of your EcoCash payment.",
          variant: "destructive",
        });
        return;
      }

      setIsSubmitting(true);
      try {
        // Create pending transaction
        const reference = `ECO-${Date.now()}-${user!.id.slice(0, 8)}`;
        const { data: transaction, error: txError } = await supabase
          .from("wallet_transactions")
          .insert({
            user_id: user!.id,
            type: "deposit",
            amount: numAmount,
            payment_method: "ecocash-manual",
            reference: reference,
            status: "pending",
          })
          .select()
          .single();

        if (txError) throw txError;

        // Upload screenshot
        const fileExt = screenshot.name.split(".").pop();
        const fileName = `${user!.id}/${transaction.id}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("payment-proofs")
          .upload(fileName, screenshot);

        if (uploadError) throw uploadError;

        // Get signed URL (bucket is private)
        const { data: urlData, error: urlError } = await supabase.storage
          .from("payment-proofs")
          .createSignedUrl(fileName, 86400); // 24 hour expiry

        if (urlError || !urlData?.signedUrl) throw new Error("Failed to get file URL");

        // Create payment proof record
        const { error: proofError } = await supabase
          .from("payment_proofs")
          .insert({
            user_id: user!.id,
            transaction_id: transaction.id,
            screenshot_url: urlData.signedUrl,
            phone_number: phoneNumber,
            status: "pending",
          });

        if (proofError) throw proofError;

        toast({
          title: "Payment Proof Submitted",
          description: "Your payment is being reviewed. Funds will be credited once approved.",
        });

        setAmount("");
        setPhoneNumber("");
        setSelectedMethod("");
        setScreenshot(null);
        setScreenshotPreview(null);
      } catch (error: any) {
        console.error("Payment error:", error);
        toast({
          title: "Failed to submit payment",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Bank transfer - create manual pending transaction
    if (selectedMethod === "bank") {
      setIsSubmitting(true);
      try {
        const reference = `BANK-${Date.now()}-${user!.email}`;
        const { error } = await supabase.from("wallet_transactions").insert({
          user_id: user!.id,
          type: "deposit",
          amount: numAmount,
          payment_method: "bank",
          reference: reference,
          status: "pending",
        });

        if (error) throw error;

        toast({
          title: "Bank Transfer Request Submitted",
          description: "Please make your bank transfer. Your funds will be credited once the admin confirms receipt.",
        });

        setAmount("");
        setSelectedMethod("");
      } catch (error: any) {
        toast({
          title: "Failed to submit request",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }
  };

  const selectedPaymentMethod = paymentMethods.find((m) => m.id === selectedMethod);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Add Funds - ZimBoost SMM Panel</title>
        <meta
          name="description"
          content="Top up your wallet using EcoCash or Bank Transfer."
        />
      </Helmet>

      <DashboardLayout title="Add Funds">
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Current Balance Card */}
            <div className="bg-gradient-to-r from-primary to-accent rounded-2xl p-6 text-primary-foreground">
              <p className="text-sm opacity-80">Current Balance</p>
              <p className="text-4xl font-bold mt-1">
                ${profile?.balance?.toFixed(2) || "0.00"}
              </p>
              <p className="text-sm opacity-80 mt-2">Top up your wallet to place orders</p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="bg-card rounded-2xl border border-border p-6 space-y-6"
            >
              {/* Amount Selection */}
              <div className="space-y-3">
                <Label className="text-primary font-semibold">Select Amount (USD)</Label>
                <div className="grid grid-cols-3 gap-3">
                  {presetAmounts.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(preset.toString())}
                      className={`h-12 rounded-lg border-2 font-semibold transition-all ${
                        amount === preset.toString()
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-foreground hover:border-primary/50"
                      }`}
                    >
                      ${preset}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                    $
                  </span>
                  <Input
                    type="number"
                    placeholder="Enter custom amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-12 pl-8 bg-background border-border"
                    min={1}
                    step={0.01}
                  />
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-3">
                <Label className="text-primary font-semibold">Payment Method</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setSelectedMethod(method.id)}
                        className={`relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                          selectedMethod === method.id
                            ? "border-primary bg-primary/5"
                            : "border-border bg-background hover:border-primary/50"
                        }`}
                      >
                        {selectedMethod === method.id && (
                          <CheckCircle className="absolute top-2 right-2 w-5 h-5 text-primary" />
                        )}
                        <div
                          className={`w-12 h-12 rounded-xl ${method.color} flex items-center justify-center flex-shrink-0`}
                        >
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{method.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {method.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* EcoCash Manual Payment Instructions */}
              {selectedMethod === "ecocash-manual" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  {/* Payment Instructions */}
                  <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 space-y-3">
                    <p className="font-semibold text-foreground flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-green-500" />
                      EcoCash Payment Instructions
                    </p>
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>
                        1. Open your EcoCash menu and select <strong>Send Money</strong>
                      </p>
                      <p>
                        2. Enter number: <strong className="text-foreground">{ECOCASH_NUMBER}</strong>
                      </p>
                      <p>
                        3. Enter amount: <strong className="text-foreground">${amount || "0.00"} USD</strong>
                      </p>
                      <p>
                        4. Confirm: <strong className="text-foreground">{ECOCASH_NAME}</strong>
                      </p>
                      <p>5. Take a screenshot of the confirmation message</p>
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-2">
                    <Label className="text-primary font-semibold">
                      Your EcoCash Phone Number
                    </Label>
                    <Input
                      type="tel"
                      placeholder="e.g. 0771234567"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="h-12 bg-background border-border"
                    />
                    <p className="text-sm text-muted-foreground">
                      The phone number you used to send the payment
                    </p>
                  </div>

                  {/* Screenshot Upload */}
                  <div className="space-y-2">
                    <Label className="text-primary font-semibold">
                      Upload Payment Screenshot
                    </Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    {screenshotPreview ? (
                      <div className="relative">
                        <img
                          src={screenshotPreview}
                          alt="Payment proof"
                          className="w-full max-h-64 object-contain rounded-xl border border-border"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setScreenshot(null);
                            setScreenshotPreview(null);
                          }}
                          className="absolute top-2 right-2 p-2 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-colors"
                      >
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Camera className="w-6 h-6 text-primary" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Click to upload screenshot
                        </p>
                      </button>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Upload a clear screenshot showing the EcoCash confirmation message
                    </p>
                  </div>
                </div>
              )}

              {/* Bank Transfer Instructions */}
              {selectedMethod === "bank" && (
                <div className="p-4 rounded-xl bg-secondary/50 border border-border space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <p className="font-semibold text-foreground">Bank Transfer Details</p>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>
                      <span className="font-medium text-foreground">Bank:</span> FBC Bank
                    </p>
                    <p>
                      <span className="font-medium text-foreground">Account Name:</span>{" "}
                      ZimBoost (Pvt) Ltd
                    </p>
                    <p>
                      <span className="font-medium text-foreground">Account Number:</span>{" "}
                      1234567890
                    </p>
                    <p>
                      <span className="font-medium text-foreground">Branch:</span> Harare
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Include your email as reference. Funds will be credited within 24 hours.
                  </p>
                </div>
              )}

              {/* Summary */}
              {amount && parseFloat(amount) > 0 && (
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="text-foreground font-medium">
                      ${parseFloat(amount).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Fee</span>
                    <span className="text-green-500 font-medium">$0.00</span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="font-bold text-primary text-lg">
                      ${parseFloat(amount).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 text-lg font-semibold"
                disabled={isSubmitting || !selectedMethod || !amount}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Wallet className="w-5 h-5 mr-2" />
                    {selectedMethod === "ecocash-manual"
                      ? "Submit Payment Proof"
                      : "Submit Request"}
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
};

export default AddFunds;
