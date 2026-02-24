import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Loader2, AlertCircle, Instagram, Youtube, Facebook } from "lucide-react";

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.18 8.18 0 0 0 4.76 1.52V6.84a4.84 4.84 0 0 1-1-.15z" />
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";

interface Service {
  id: string;
  name: string;
  category: string;
  description: string | null;
  price_per_1000: number;
  min_quantity: number;
  max_quantity: number;
  is_active: boolean;
}

const Dashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState("");
  const [charge, setCharge] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch services from database
  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ["active-services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("is_active", true)
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      return data as Service[];
    },
  });

  const platforms = [
    { name: "Instagram", icon: Instagram, keywords: ["instagram", "ig"] },
    { name: "TikTok", icon: TikTokIcon, keywords: ["tiktok", "tik tok"] },
    { name: "YouTube", icon: Youtube, keywords: ["youtube", "yt"] },
    { name: "Facebook", icon: Facebook, keywords: ["facebook", "fb"] },
    { name: "Twitter / X", icon: XIcon, keywords: ["twitter", "x ", " x", "tweet"] },
  ];

  // Get unique categories
  const categories = services
    ? [...new Set(services.map((s) => s.category))]
    : [];

  // Filter categories by selected platform
  const platformFilteredCategories = selectedPlatform
    ? categories.filter((cat) => {
        const platform = platforms.find((p) => p.name === selectedPlatform);
        return platform?.keywords.some((kw) => cat.toLowerCase().includes(kw));
      })
    : categories;

  // Get services for selected category
  const categoryServices = services?.filter(
    (s) => s.category === selectedCategory
  );

  // Get selected service
  const selectedService = services?.find((s) => s.id === selectedServiceId);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Calculate charge when quantity or service changes
  useEffect(() => {
    if (selectedService && quantity) {
      const qty = parseInt(quantity);
      if (!isNaN(qty) && qty >= selectedService.min_quantity && qty <= selectedService.max_quantity) {
        setCharge((qty / 1000) * selectedService.price_per_1000);
      } else {
        setCharge(0);
      }
    } else {
      setCharge(0);
    }
  }, [quantity, selectedService]);

  // Reset category when platform changes
  useEffect(() => {
    setSelectedCategory("");
    setSelectedServiceId("");
    setQuantity("");
    setCharge(0);
  }, [selectedPlatform]);

  // Reset service when category changes
  useEffect(() => {
    setSelectedServiceId("");
    setQuantity("");
    setCharge(0);
  }, [selectedCategory]);

  // Filter categories by search
  const filteredCategories = platformFilteredCategories.filter((cat) => {
    const catServices = services?.filter((s) => s.category === cat) || [];
    return (
      cat.toLowerCase().includes(searchQuery.toLowerCase()) ||
      catServices.some((s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  });

  const validateLink = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCategory || !selectedServiceId || !link || !quantity) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!validateLink(link)) {
      toast({
        title: "Invalid link",
        description: "Please enter a valid URL.",
        variant: "destructive",
      });
      return;
    }

    if (selectedService) {
      const qty = parseInt(quantity);
      if (qty < selectedService.min_quantity || qty > selectedService.max_quantity) {
        toast({
          title: "Invalid quantity",
          description: `Quantity must be between ${selectedService.min_quantity.toLocaleString()} and ${selectedService.max_quantity.toLocaleString()}.`,
          variant: "destructive",
        });
        return;
      }

      // Check balance
      if (profile && charge > profile.balance) {
        toast({
          title: "Insufficient balance",
          description: "Please add funds to your wallet to place this order.",
          variant: "destructive",
        });
        navigate("/dashboard/add-funds");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Create order (order_number is generated by trigger)
      const { error: orderError } = await supabase.from("orders").insert({
        user_id: user!.id,
        order_number: "TEMP", // Will be overwritten by trigger
        service_id: selectedServiceId,
        service_name: selectedService!.name,
        link: link.trim(),
        quantity: parseInt(quantity),
        charge,
        remains: parseInt(quantity),
        status: "pending",
      });

      if (orderError) throw orderError;

      // Deduct balance atomically
      const { error: balanceError } = await supabase.rpc("adjust_balance", {
        p_user_id: user!.id,
        p_amount: -charge,
      });

      if (balanceError) throw balanceError;

      // Create transaction record
      await supabase.from("wallet_transactions").insert({
        user_id: user!.id,
        type: "order",
        amount: -charge,
        reference: `Order: ${selectedService!.name}`,
        status: "completed",
      });

      await refreshProfile();

      toast({
        title: "Order submitted!",
        description: `Your order for ${parseInt(quantity).toLocaleString()} ${selectedService!.name} has been placed. Total: $${charge.toFixed(2)}`,
      });

      // Reset form
      setLink("");
      setQuantity("");
      setSelectedCategory("");
      setSelectedServiceId("");
    } catch (error: any) {
      console.error("Order submission error:", error);
      toast({
        title: "Order failed",
        description: error.message || "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <title>Dashboard - scrVll SMM Panel</title>
        <meta name="description" content="Place orders and manage your social media growth with scrVll dashboard." />
      </Helmet>

      <DashboardLayout title="New Order">
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-2xl mx-auto">
            {/* Balance Warning */}
            {profile && profile.balance < 1 && (
              <div className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-500">Low Balance</p>
                  <p className="text-sm text-muted-foreground">
                    Your balance is ${profile.balance.toFixed(2)}. Add funds to place orders.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => navigate("/dashboard/add-funds")}
                  >
                    Add Funds
                  </Button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border p-6 space-y-6">
              {/* Search */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search services..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12 bg-background border-border"
                  />
                </div>
              </div>

              {/* Platform Filter */}
              <div className="space-y-2">
                <Label className="text-primary font-semibold">Platform</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={selectedPlatform === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedPlatform(null)}
                    className="h-10"
                  >
                    All
                  </Button>
                  {platforms.map((platform) => (
                    <Button
                      key={platform.name}
                      type="button"
                      variant={selectedPlatform === platform.name ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedPlatform(platform.name)}
                      className="h-10 gap-2"
                    >
                      <platform.icon className="w-4 h-4" />
                      {platform.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label className="text-primary font-semibold">Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-12 bg-background border-border">
                    <SelectValue placeholder={servicesLoading ? "Loading..." : "Select a category"} />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {filteredCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Service */}
              <div className="space-y-2">
                <Label className="text-primary font-semibold">Service</Label>
                <Select
                  value={selectedServiceId}
                  onValueChange={setSelectedServiceId}
                  disabled={!selectedCategory}
                >
                  <SelectTrigger className="h-12 bg-background border-border">
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border max-h-60">
                    {categoryServices?.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{service.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ${service.price_per_1000.toFixed(2)}/1k • Min: {service.min_quantity.toLocaleString()}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedService?.description && (
                  <p className="text-sm text-muted-foreground">{selectedService.description}</p>
                )}
              </div>

              {/* Link */}
              <div className="space-y-2">
                <Label className="text-primary font-semibold">Link</Label>
                <Input
                  type="url"
                  placeholder="https://instagram.com/username"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="h-12 bg-background border-border"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the full URL to your profile or post
                </p>
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <Label className="text-primary font-semibold">Quantity</Label>
                <Input
                  type="number"
                  placeholder="Enter quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="h-12 bg-background border-border"
                  min={selectedService?.min_quantity}
                  max={selectedService?.max_quantity}
                />
                {selectedService && (
                  <p className="text-sm text-muted-foreground">
                    Min: {selectedService.min_quantity.toLocaleString()} - Max: {selectedService.max_quantity.toLocaleString()}
                  </p>
                )}
              </div>

              {/* Charge */}
              <div className="space-y-2">
                <Label className="text-primary font-semibold">Charge</Label>
                <div className="h-12 px-4 flex items-center justify-between bg-secondary/50 rounded-lg border border-border">
                  <span className="text-lg font-bold text-foreground">
                    ${charge.toFixed(2)}
                  </span>
                  {profile && (
                    <span className={`text-sm ${charge > profile.balance ? "text-destructive" : "text-muted-foreground"}`}>
                      Balance: ${profile.balance.toFixed(2)}
                    </span>
                  )}
                </div>
                {selectedService && (
                  <p className="text-sm text-muted-foreground">
                    Rate: ${selectedService.price_per_1000.toFixed(2)} per 1,000
                  </p>
                )}
              </div>

              {/* Submit */}
              <Button 
                type="submit" 
                variant="hero" 
                className="w-full h-12" 
                disabled={isSubmitting || !selectedService || charge === 0 || (profile && charge > profile.balance)}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : profile && charge > profile.balance ? (
                  "Insufficient Balance"
                ) : (
                  `Submit Order - $${charge.toFixed(2)}`
                )}
              </Button>
            </form>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
};

export default Dashboard;