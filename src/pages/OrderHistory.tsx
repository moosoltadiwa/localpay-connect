import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Search,
  Clock,
  Loader2,
  CheckCircle,
  XCircle,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

type OrderStatus = "pending" | "processing" | "completed" | "cancelled";

interface Order {
  id: string;
  service: string;
  link: string;
  quantity: number;
  charge: number;
  status: OrderStatus;
  startCount: number;
  remains: number;
  createdAt: string;
}

const mockOrders: Order[] = [
  {
    id: "ORD-78542",
    service: "Instagram Followers | 7 Days Refill",
    link: "https://instagram.com/user1",
    quantity: 5000,
    charge: 2.50,
    status: "completed",
    startCount: 1250,
    remains: 0,
    createdAt: "2024-12-04T10:30:00",
  },
  {
    id: "ORD-78541",
    service: "TikTok Views | Instant",
    link: "https://tiktok.com/@user2/video/123",
    quantity: 10000,
    charge: 1.00,
    status: "processing",
    startCount: 500,
    remains: 3500,
    createdAt: "2024-12-04T09:15:00",
  },
  {
    id: "ORD-78540",
    service: "YouTube Subscribers | Lifetime",
    link: "https://youtube.com/@channel",
    quantity: 1000,
    charge: 2.00,
    status: "pending",
    startCount: 0,
    remains: 1000,
    createdAt: "2024-12-04T08:00:00",
  },
  {
    id: "ORD-78539",
    service: "Facebook Page Likes | Premium",
    link: "https://facebook.com/page",
    quantity: 500,
    charge: 0.30,
    status: "cancelled",
    startCount: 0,
    remains: 500,
    createdAt: "2024-12-03T16:45:00",
  },
  {
    id: "ORD-78538",
    service: "Instagram Likes | Fast Delivery",
    link: "https://instagram.com/p/abc123",
    quantity: 2000,
    charge: 0.60,
    status: "completed",
    startCount: 150,
    remains: 0,
    createdAt: "2024-12-03T14:20:00",
  },
];

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pending", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", icon: Clock },
  processing: { label: "Processing", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: Loader2 },
  completed: { label: "Completed", color: "bg-green-500/10 text-green-500 border-green-500/20", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-red-500/10 text-red-500 border-red-500/20", icon: XCircle },
};

const OrderHistory = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredOrders = mockOrders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.link.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <Helmet>
        <title>Order History - ZimBoost SMM Panel</title>
        <meta name="description" content="View your order history and track the status of your social media growth orders." />
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
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 text-primary font-medium"
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
              <h1 className="font-display font-bold text-xl text-foreground">Order History</h1>
            </div>
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <Home className="w-5 h-5" />
              <span className="hidden sm:inline">Home</span>
            </Link>
          </header>

          {/* Orders Content */}
          <div className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="max-w-5xl mx-auto space-y-6">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search orders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12 bg-card border-border"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-12 w-full sm:w-48 bg-card border-border">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Orders</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="h-12">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>

              {/* Orders List */}
              <div className="space-y-4">
                {filteredOrders.length === 0 ? (
                  <div className="bg-card rounded-2xl border border-border p-12 text-center">
                    <History className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">No orders found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchQuery || statusFilter !== "all"
                        ? "Try adjusting your search or filter"
                        : "You haven't placed any orders yet"}
                    </p>
                    <Link to="/dashboard">
                      <Button variant="hero">Place Your First Order</Button>
                    </Link>
                  </div>
                ) : (
                  filteredOrders.map((order) => {
                    const status = statusConfig[order.status];
                    const StatusIcon = status.icon;
                    const progress = ((order.quantity - order.remains) / order.quantity) * 100;

                    return (
                      <div
                        key={order.id}
                        className="bg-card rounded-2xl border border-border p-4 md:p-6 hover:border-primary/30 transition-colors"
                      >
                        <div className="flex flex-col md:flex-row md:items-start gap-4">
                          {/* Order Info */}
                          <div className="flex-1 space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-sm font-semibold text-primary">
                                {order.id}
                              </span>
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                                <StatusIcon className={`w-3 h-3 ${order.status === "processing" ? "animate-spin" : ""}`} />
                                {status.label}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(order.createdAt)}
                              </span>
                            </div>

                            <p className="font-medium text-foreground">{order.service}</p>

                            <a
                              href={order.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-primary hover:underline truncate max-w-full"
                            >
                              <ExternalLink className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{order.link}</span>
                            </a>

                            {/* Progress Bar for Processing Orders */}
                            {order.status === "processing" && (
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>Progress</span>
                                  <span>{Math.round(progress)}%</span>
                                </div>
                                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary rounded-full transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Order Stats */}
                          <div className="grid grid-cols-3 md:grid-cols-1 gap-3 md:w-32 text-center md:text-right">
                            <div>
                              <p className="text-xs text-muted-foreground">Quantity</p>
                              <p className="font-semibold text-foreground">{order.quantity.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Remains</p>
                              <p className="font-semibold text-foreground">{order.remains.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Charge</p>
                              <p className="font-semibold text-primary">${order.charge.toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Summary Stats */}
              {filteredOrders.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-card rounded-xl border border-border p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">{mockOrders.length}</p>
                    <p className="text-sm text-muted-foreground">Total Orders</p>
                  </div>
                  <div className="bg-card rounded-xl border border-border p-4 text-center">
                    <p className="text-2xl font-bold text-green-500">
                      {mockOrders.filter((o) => o.status === "completed").length}
                    </p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                  <div className="bg-card rounded-xl border border-border p-4 text-center">
                    <p className="text-2xl font-bold text-blue-500">
                      {mockOrders.filter((o) => o.status === "processing").length}
                    </p>
                    <p className="text-sm text-muted-foreground">Processing</p>
                  </div>
                  <div className="bg-card rounded-xl border border-border p-4 text-center">
                    <p className="text-2xl font-bold text-primary">
                      ${mockOrders.reduce((sum, o) => sum + o.charge, 0).toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Spent</p>
                  </div>
                </div>
              )}
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

export default OrderHistory;
