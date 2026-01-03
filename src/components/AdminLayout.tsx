import { useState, ReactNode, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Shield,
  Menu,
  Home,
  Package,
  ShoppingCart,
  Users,
  CreditCard,
  LogOut,
  BarChart3,
  Settings,
  Receipt,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

const AdminLayout = ({ children, title }: AdminLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();

  // Fetch pending payment proofs count
  const { data: pendingProofsCount } = useQuery({
    queryKey: ["pending-proofs-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("payment_proofs")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      
      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000,
  });

  // Fetch pending deposits count
  const { data: pendingDepositsCount } = useQuery({
    queryKey: ["pending-deposits-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("wallet_transactions")
        .select("*", { count: "exact", head: true })
        .eq("type", "deposit")
        .eq("status", "pending");
      
      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000,
  });

  const navItems = [
    { path: "/admin", icon: BarChart3, label: "Dashboard", badge: 0 },
    { path: "/admin/orders", icon: ShoppingCart, label: "All Orders", badge: 0 },
    { path: "/admin/services", icon: Package, label: "Services", badge: 0 },
    { path: "/admin/customers", icon: Users, label: "Customers", badge: 0 },
    { path: "/admin/transactions", icon: CreditCard, label: "Transactions", badge: pendingDepositsCount || 0 },
    { path: "/admin/payment-proofs", icon: Receipt, label: "Payment Proofs", badge: pendingProofsCount || 0 },
    { path: "/admin/settings", icon: Settings, label: "Settings", badge: 0 },
  ];

  useEffect(() => {
    if (!authLoading && !adminLoading && !isAdmin) {
      navigate("/dashboard");
    }
  }, [isAdmin, authLoading, adminLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
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
            <Link to="/admin" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-destructive flex items-center justify-center">
                <Shield className="w-5 h-5 text-destructive-foreground" />
              </div>
              <div>
                <span className="font-display font-bold text-xl text-foreground">scrVll</span>
                <p className="text-xs text-muted-foreground">Admin Panel</p>
              </div>
            </Link>
          </div>

          {/* Admin Info */}
          <div className="p-4 border-b border-border bg-destructive/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">
                  {profile?.full_name || profile?.email?.split("@")[0] || "Admin"}
                </p>
                <p className="text-xs text-destructive font-medium">Administrator</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-destructive/10 text-destructive font-medium"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </div>
                  {item.badge > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer Links */}
          <div className="p-4 border-t border-border space-y-1">
            <Link
              to="/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors w-full"
            >
              <Home className="w-5 h-5" />
              User Dashboard
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors w-full"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
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
            <h1 className="font-display font-bold text-xl text-foreground">{title}</h1>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-destructive/10 rounded-full">
            <Shield className="w-4 h-4 text-destructive" />
            <span className="text-sm font-medium text-destructive">Admin Mode</span>
          </div>
        </header>

        {/* Page Content */}
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;