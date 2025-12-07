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
  CreditCard,
  Wallet,
  Loader2,
  ExternalLink,
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
  const [searchParams] = useSearchParams();
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState("");
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<{
    id: string;
    instructions?: string;
    redirectUrl?: string;
  } | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const pollTransactionStatus = async (transactionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("paynow-poll", {
        body: { transactionId },
      });

      if (error) {
        console.error("Poll error:", error);
        return;
      }

      if (data.completed) {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        setPendingTransaction(null);
        await refreshProfile();
        toast({
          title: "Payment Successful!",
          description: "Your wallet has been topped up.",
        });
        setAmount("");
        setPhoneNumber("");
        setSelectedMethod("");
      } else if (data.status === "failed") {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        setPendingTransaction(null);
        toast({
          title: "Payment Failed",
          description: "Your payment was not successful. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Poll error:", err);
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

    if ((selectedMethod === "ecocash" || selectedMethod === "onemoney") && !phoneNumber) {
      toast({
        title: "Phone number required",
        description: "Please enter your mobile money phone number.",
        variant: "destructive",
      });
      return;
    }

    // Bank transfer - create manual pending transaction
    if (selectedMethod === "bank") {
      setIsSubmitting(true);
      try {
        // Create pending transaction for admin to approve
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

    setIsSubmitting(true);

    try {
      // Call the PayNow initiate edge function
      const { data, error } = await supabase.functions.invoke("paynow-initiate", {
        body: {
          amount: numAmount,
          paymentMethod: selectedMethod,
          phoneNumber: phoneNumber || undefined,
          email: user!.email,
          userId: user!.id,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || "Payment failed");

      // Handle mobile money (EcoCash/OneMoney) - show instructions
      if (selectedMethod === "ecocash" || selectedMethod === "onemoney") {
        setPendingTransaction({
          id: data.transactionId,
          instructions: data.instructions || `A payment prompt has been sent to ${phoneNumber}. Please enter your PIN on your phone to complete the payment.`,
        });

        // Start polling for status
        pollIntervalRef.current = setInterval(() => {
          pollTransactionStatus(data.transactionId);
        }, 5000);

        toast({
          title: "Payment Initiated",
          description: "Check your phone for the payment prompt.",
        });
      } else {
        // Web payment - redirect to PayNow
        if (data.redirectUrl) {
          setPendingTransaction({
            id: data.transactionId,
            redirectUrl: data.redirectUrl,
          });

          // Start polling in case they complete payment
          pollIntervalRef.current = setInterval(() => {
            pollTransactionStatus(data.transactionId);
          }, 5000);

          toast({
            title: "Redirecting to PayNow",
            description: "You will be redirected to complete your payment.",
          });
        }
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast({
        title: "Payment failed",
        description: error.message || "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelPendingPayment = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setPendingTransaction(null);
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

            {/* Pending Transaction UI */}
            {pendingTransaction && (
              <div className="bg-card rounded-2xl border-2 border-primary p-6 space-y-4 animate-in fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Payment In Progress</h3>
                    <p className="text-sm text-muted-foreground">Waiting for payment confirmation...</p>
                  </div>
                </div>

                {pendingTransaction.instructions && (
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                    <p className="text-sm text-foreground">{pendingTransaction.instructions}</p>
                  </div>
                )}

                {pendingTransaction.redirectUrl && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Click the button below to complete your payment on PayNow:
                    </p>
                    <a
                      href={pendingTransaction.redirectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Complete Payment on PayNow
                    </a>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={cancelPendingPayment}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => pollTransactionStatus(pendingTransaction.id)}
                    className="flex-1"
                  >
                    Check Status
                  </Button>
                </div>
              </div>
            )}

            {!pendingTransaction && (
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
            )}
          </div>
        </div>
      </DashboardLayout>
    </>
  );
};

export default AddFunds;
