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
import { Search, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";

// Service categories and services data
const categories = [
  {
    id: "instagram-followers",
    name: "Instagram Followers | New Servers",
    services: [
      { id: "30446", name: "Instagram Followers | 7 Days Refill", price: 0.50, min: 10, max: 1000000 },
      { id: "30447", name: "Instagram Followers | 30 Days Refill", price: 0.70, min: 50, max: 500000 },
      { id: "30448", name: "Instagram Followers | Instant Start", price: 0.90, min: 100, max: 100000 },
    ],
  },
  {
    id: "instagram-likes",
    name: "Instagram Likes | Premium",
    services: [
      { id: "30450", name: "Instagram Likes | Fast Delivery", price: 0.30, min: 10, max: 50000 },
      { id: "30451", name: "Instagram Likes | Premium Quality", price: 0.50, min: 50, max: 100000 },
    ],
  },
  {
    id: "tiktok-followers",
    name: "TikTok Followers | Real",
    services: [
      { id: "30460", name: "TikTok Followers | Fast Start", price: 0.40, min: 100, max: 500000 },
      { id: "30461", name: "TikTok Followers | Premium", price: 0.60, min: 50, max: 1000000 },
    ],
  },
  {
    id: "tiktok-views",
    name: "TikTok Views | High Quality",
    services: [
      { id: "30465", name: "TikTok Views | Instant", price: 0.10, min: 100, max: 10000000 },
      { id: "30466", name: "TikTok Views | Premium", price: 0.20, min: 500, max: 5000000 },
    ],
  },
  {
    id: "youtube-subscribers",
    name: "YouTube Subscribers",
    services: [
      { id: "30470", name: "YouTube Subscribers | Lifetime", price: 2.00, min: 50, max: 100000 },
      { id: "30471", name: "YouTube Subscribers | Fast", price: 2.50, min: 100, max: 50000 },
    ],
  },
  {
    id: "youtube-views",
    name: "YouTube Views | Real",
    services: [
      { id: "30475", name: "YouTube Views | High Retention", price: 1.00, min: 100, max: 1000000 },
      { id: "30476", name: "YouTube Views | Fast Delivery", price: 0.80, min: 500, max: 5000000 },
    ],
  },
  {
    id: "facebook-likes",
    name: "Facebook Page Likes",
    services: [
      { id: "30480", name: "Facebook Page Likes | Premium", price: 0.60, min: 100, max: 500000 },
      { id: "30481", name: "Facebook Page Likes | Fast", price: 0.80, min: 50, max: 100000 },
    ],
  },
];

const Dashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState("");
  const [charge, setCharge] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentCategory = categories.find((c) => c.id === selectedCategory);
  const currentService = currentCategory?.services.find((s) => s.id === selectedService);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Calculate charge when quantity or service changes
  useEffect(() => {
    if (currentService && quantity) {
      const qty = parseInt(quantity);
      if (!isNaN(qty) && qty >= currentService.min && qty <= currentService.max) {
        setCharge((qty / 1000) * currentService.price);
      } else {
        setCharge(0);
      }
    } else {
      setCharge(0);
    }
  }, [quantity, currentService]);

  // Reset service when category changes
  useEffect(() => {
    setSelectedService("");
    setQuantity("");
    setCharge(0);
  }, [selectedCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCategory || !selectedService || !link || !quantity) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (currentService) {
      const qty = parseInt(quantity);
      if (qty < currentService.min || qty > currentService.max) {
        toast({
          title: "Invalid quantity",
          description: `Quantity must be between ${currentService.min} and ${currentService.max.toLocaleString()}.`,
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
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Create order (order_number is generated by trigger)
      const { error: orderError } = await supabase.from("orders").insert({
        user_id: user!.id,
        order_number: "TEMP", // Will be overwritten by trigger
        service_id: selectedService,
        service_name: currentService!.name,
        link,
        quantity: parseInt(quantity),
        charge,
        remains: parseInt(quantity),
      });

      if (orderError) throw orderError;

      // Deduct balance
      const newBalance = (profile?.balance || 0) - charge;
      const { error: balanceError } = await supabase
        .from("profiles")
        .update({ balance: newBalance })
        .eq("id", user!.id);

      if (balanceError) throw balanceError;

      // Create transaction record
      await supabase.from("wallet_transactions").insert({
        user_id: user!.id,
        type: "order",
        amount: -charge,
        reference: `Order for ${currentService!.name}`,
        status: "completed",
      });

      await refreshProfile();

      toast({
        title: "Order submitted!",
        description: `Your order for ${quantity} has been placed. Total: $${charge.toFixed(2)}`,
      });

      // Reset form
      setLink("");
      setQuantity("");
      setSelectedCategory("");
      setSelectedService("");
    } catch (error: any) {
      toast({
        title: "Order failed",
        description: error.message || "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = categories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.services.some((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
        <title>Dashboard - ZimBoost SMM Panel</title>
        <meta name="description" content="Place orders and manage your social media growth with ZimBoost dashboard." />
      </Helmet>

      <DashboardLayout title="New Order">
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-2xl mx-auto">
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

              {/* Category */}
              <div className="space-y-2">
                <Label className="text-primary font-semibold">Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-12 bg-background border-border">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Service */}
              <div className="space-y-2">
                <Label className="text-primary font-semibold">Service</Label>
                <Select
                  value={selectedService}
                  onValueChange={setSelectedService}
                  disabled={!selectedCategory}
                >
                  <SelectTrigger className="h-12 bg-background border-border">
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentCategory?.services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        <span className="inline-flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-medium">
                            {service.id}
                          </span>
                          <span>{service.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  min={currentService?.min}
                  max={currentService?.max}
                />
                {currentService && (
                  <p className="text-sm text-muted-foreground">
                    Min: {currentService.min.toLocaleString()} - Max: {currentService.max.toLocaleString()}
                  </p>
                )}
              </div>

              {/* Charge */}
              <div className="space-y-2">
                <Label className="text-primary font-semibold">Charge</Label>
                <div className="h-12 px-4 flex items-center bg-secondary/50 rounded-lg border border-border">
                  <span className="text-lg font-bold text-foreground">
                    ${charge.toFixed(2)}
                  </span>
                </div>
                {currentService && (
                  <p className="text-sm text-muted-foreground">
                    Rate: ${currentService.price.toFixed(2)} per 1000
                  </p>
                )}
              </div>

              {/* Submit */}
              <Button type="submit" variant="hero" className="w-full h-12" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Submit Order"
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
