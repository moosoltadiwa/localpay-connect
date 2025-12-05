import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Zap,
  Menu,
  Home,
  ShoppingCart,
  History,
  Wallet,
  HelpCircle,
  LogOut,
  User,
  Plus,
  Smartphone,
  Building,
  CheckCircle,
  CreditCard,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState("");
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
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

    toast({
      title: "Payment initiated!",
      description: `Processing $${numAmount.toFixed(2)} via ${paymentMethods.find(m => m.id === selectedMethod)?.name}. You will receive payment instructions shortly.`,
    });
  };

  const selectedPaymentMethod = paymentMethods.find(m => m.id === selectedMethod);

  return (
    <>
      <Helmet>
        <title>Add Funds - ZimBoost SMM Panel</title>
        <meta name="description" content="Top up your wallet using PayNow, EcoCash, OneMoney, or Bank Transfer." />
      </Helmet>

      <div className="min-h-screen bg-background flex">
        {/* Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-foreground/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-4 border-b border-border">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-display font-bold text-xl text-foreground">ZimBoost</span>
              </Link>
            </div>

            {/* User Info */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">John Doe</p>
                  <p className="text-xs text-muted-foreground">Balance: $25.00</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
              <Link
                to="/dashboard"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <Plus className="w-5 h-5" />
                New Order
              </Link>
              <Link
                to="/dashboard/orders"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <History className="w-5 h-5" />
                Order History
              </Link>
              <Link
                to="/dashboard/add-funds"
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 text-primary font-medium"
              >
                <Wallet className="w-5 h-5" />
                Add Funds
              </Link>
              <Link
                to="/dashboard/services"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                Services
              </Link>
              <Link
                to="/dashboard/support"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <HelpCircle className="w-5 h-5" />
                Support
              </Link>
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-border">
              <Link
                to="/"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </Link>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-h-screen">
          {/* Header */}
          <header className="sticky top-0 z-30 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-secondary"
              >
                <Menu className="w-6 h-6 text-foreground" />
              </button>
              <h1 className="font-display font-bold text-xl text-foreground">Add Funds</h1>
            </div>
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <Home className="w-5 h-5" />
              <span className="hidden sm:inline">Home</span>
            </Link>
          </header>

          {/* Add Funds Form */}
          <div className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Current Balance Card */}
              <div className="bg-gradient-to-r from-primary to-accent rounded-2xl p-6 text-primary-foreground">
                <p className="text-sm opacity-80">Current Balance</p>
                <p className="text-4xl font-bold mt-1">$25.00</p>
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
                <Button type="submit" variant="hero" className="w-full h-12">
                  <Wallet className="w-5 h-5 mr-2" />
                  Add Funds
                </Button>

                {/* Security Note */}
                <p className="text-center text-xs text-muted-foreground">
                  🔒 Your payment is secured with 256-bit SSL encryption
                </p>
              </form>
            </div>
          </div>
        </main>

        {/* WhatsApp Floating Button */}
        <a
          href="https://wa.me/263771234567"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 hover:scale-110 transition-all z-50"
        >
          <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </a>
      </div>
    </>
  );
};

export default AddFunds;
