import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Smartphone,
  Building,
  CheckCircle,
  CreditCard,
  Wallet,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";

const paymentMethods = [
  {
    id: "paynow",
    name: "PayNow",
    description: "Pay with PayNow Zimbabwe",
    icon: CreditCard,
    color: "bg-blue-500",
  },
  {
    id: "ecocash",
    name: "EcoCash",
    description: "Pay with EcoCash mobile money",
    icon: Smartphone,
    color: "bg-green-500",
  },
  {
    id: "onemoney",
    name: "OneMoney",
    description: "Pay with OneMoney mobile money",
    icon: Smartphone,
    color: "bg-purple-500",
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

const AddFunds = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState("");
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

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

    if ((selectedMethod === "ecocash" || selectedMethod === "onemoney") && !phoneNumber) {
      toast({
        title: "Phone number required",
        description: "Please enter your mobile money phone number.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create transaction record
      const { error: txError } = await supabase.from("wallet_transactions").insert({
        user_id: user!.id,
        type: "deposit",
        amount: numAmount,
        payment_method: selectedMethod,
        reference: phoneNumber || "Bank Transfer",
        status: "pending",
      });

      if (txError) throw txError;

      // For demo purposes, we'll simulate instant approval
      // In production, this would be handled by a payment webhook
      const newBalance = (profile?.balance || 0) + numAmount;
      const { error: balanceError } = await supabase
        .from("profiles")
        .update({ balance: newBalance })
        .eq("id", user!.id);

      if (balanceError) throw balanceError;

      await refreshProfile();

      toast({
        title: "Payment initiated!",
        description: `$${numAmount.toFixed(2)} has been added to your wallet via ${paymentMethods.find(m => m.id === selectedMethod)?.name}.`,
      });

      // Reset form
      setAmount("");
      setPhoneNumber("");
      setSelectedMethod("");
    } catch (error: any) {
      toast({
        title: "Payment failed",
        description: error.message || "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPaymentMethod = paymentMethods.find(m => m.id === selectedMethod);

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
        <meta name="description" content="Top up your wallet using PayNow, EcoCash, OneMoney, or Bank Transfer." />
      </Helmet>

      <DashboardLayout title="Add Funds">
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Current Balance Card */}
            <div className="bg-gradient-to-r from-primary to-accent rounded-2xl p-6 text-primary-foreground">
              <p className="text-sm opacity-80">Current Balance</p>
              <p className="text-4xl font-bold mt-1">${profile?.balance?.toFixed(2) || "0.00"}</p>
              <p className="text-sm opacity-80 mt-2">Top up your wallet to place orders</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border p-6 space-y-6">
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
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">$</span>
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
                        <div className={`w-12 h-12 rounded-xl ${method.color} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{method.name}</p>
                          <p className="text-sm text-muted-foreground">{method.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Phone Number for Mobile Money */}
              {(selectedMethod === "ecocash" || selectedMethod === "onemoney") && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <Label className="text-primary font-semibold">Phone Number</Label>
                  <Input
                    type="tel"
                    placeholder="e.g. 0771234567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="h-12 bg-background border-border"
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter the phone number linked to your {selectedPaymentMethod?.name} account
                  </p>
                </div>
              )}

              {/* Bank Transfer Instructions */}
              {selectedMethod === "bank" && (
                <div className="p-4 rounded-xl bg-secondary/50 border border-border space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <p className="font-semibold text-foreground">Bank Transfer Details</p>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><span className="font-medium text-foreground">Bank:</span> FBC Bank</p>
                    <p><span className="font-medium text-foreground">Account Name:</span> ZimBoost (Pvt) Ltd</p>
                    <p><span className="font-medium text-foreground">Account Number:</span> 1234567890</p>
                    <p><span className="font-medium text-foreground">Branch:</span> Harare</p>
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
                    <span className="text-foreground font-medium">${parseFloat(amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Fee</span>
                    <span className="text-green-500 font-medium">$0.00</span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="font-bold text-primary">${parseFloat(amount).toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Submit */}
              <Button type="submit" variant="hero" className="w-full h-12" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Wallet className="w-5 h-5 mr-2" />
                    Add Funds
                  </>
                )}
              </Button>

              {/* Security Note */}
              <p className="text-center text-xs text-muted-foreground">
                🔒 Your payment is secured with 256-bit SSL encryption
              </p>
            </form>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
};

export default AddFunds;
