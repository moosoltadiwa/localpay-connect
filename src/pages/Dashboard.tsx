import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
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
import {
  Zap,
  Search,
  Menu,
  X,
  Home,
  ShoppingCart,
  History,
  Wallet,
  HelpCircle,
  LogOut,
  User,
  Plus,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState("");
  const [charge, setCharge] = useState(0);

  const currentCategory = categories.find((c) => c.id === selectedCategory);
  const currentService = currentCategory?.services.find((s) => s.id === selectedService);

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

  const handleSubmit = (e: React.FormEvent) => {
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
    }

    toast({
      title: "Order submitted!",
      description: `Your order for ${quantity} has been placed. Total: $${charge.toFixed(2)}`,
    });

    // Reset form
    setLink("");
    setQuantity("");
  };

  const filteredCategories = categories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.services.some((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <>
      <Helmet>
        <title>Dashboard - ZimBoost SMM Panel</title>
        <meta name="description" content="Place orders and manage your social media growth with ZimBoost dashboard." />
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
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 text-primary font-medium"
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
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
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
              <h1 className="font-display font-bold text-xl text-foreground">New Order</h1>
            </div>
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <Home className="w-5 h-5" />
              <span className="hidden sm:inline">Home</span>
            </Link>
          </header>

          {/* Order Form */}
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
                <Button type="submit" variant="hero" className="w-full h-12">
                  Submit Order
                </Button>
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

export default Dashboard;
