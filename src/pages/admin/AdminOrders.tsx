import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ShoppingCart, Search, RefreshCw, ExternalLink, User, Calendar, DollarSign } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Order = Database["public"]["Tables"]["orders"]["Row"] & {
  profiles?: {
    email: string | null;
    full_name: string | null;
  } | null;
};
type OrderStatus = Database["public"]["Enums"]["order_status"];

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [remainsValue, setRemainsValue] = useState("");
  const [startCountValue, setStartCountValue] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        profiles:user_id (email, full_name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch orders");
      console.error("Fetch error:", error);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  const filterOrders = () => {
    let filtered = [...orders];

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.link.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdating(true);
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      toast.error("Failed to update order status");
    } else {
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders();
    }
    setUpdating(false);
  };

  const updateOrderProgress = async () => {
    if (!selectedOrder) return;

    setUpdating(true);
    try {
      const updates: { remains?: number; start_count?: number } = {};
      
      if (remainsValue !== "") {
        updates.remains = parseInt(remainsValue);
      }
      if (startCountValue !== "") {
        updates.start_count = parseInt(startCountValue);
      }

      const { error } = await supabase
        .from("orders")
        .update(updates)
        .eq("id", selectedOrder.id);

      if (error) throw error;

      toast.success("Order progress updated");
      setDetailsDialogOpen(false);
      fetchOrders();
    } catch (error) {
      toast.error("Failed to update order progress");
      console.error("Update error:", error);
    } finally {
      setUpdating(false);
    }
  };

  const handleRefund = async () => {
    if (!selectedOrder) return;

    setUpdating(true);
    try {
      // Update order status to refunded
      const { error: orderError } = await supabase
        .from("orders")
        .update({ status: "refunded" })
        .eq("id", selectedOrder.id);

      if (orderError) throw orderError;

      // Add refund amount to user's balance atomically
      const { error: balanceError } = await supabase.rpc("adjust_balance", {
        p_user_id: selectedOrder.user_id,
        p_amount: Number(selectedOrder.charge),
      });

      if (balanceError) throw balanceError;

      // Create refund transaction
      const { error: transactionError } = await supabase
        .from("wallet_transactions")
        .insert({
          user_id: selectedOrder.user_id,
          type: "refund",
          amount: Number(selectedOrder.charge),
          status: "completed",
          reference: `Refund for order ${selectedOrder.order_number}`,
        });

      if (transactionError) throw transactionError;

      toast.success(
        `Refund of $${Number(selectedOrder.charge).toFixed(2)} processed successfully`
      );
      setRefundDialogOpen(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (error) {
      toast.error("Failed to process refund");
      console.error("Refund error:", error);
    } finally {
      setUpdating(false);
    }
  };

  const openDetailsDialog = (order: Order) => {
    setSelectedOrder(order);
    setRemainsValue(order.remains?.toString() || "");
    setStartCountValue(order.start_count?.toString() || "");
    setDetailsDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "pending":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "processing":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "cancelled":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      case "refunded":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Summary stats
  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    processing: orders.filter((o) => o.status === "processing").length,
    completed: orders.filter((o) => o.status === "completed").length,
    totalRevenue: orders.reduce((sum, o) => sum + Number(o.charge), 0),
  };

  return (
    <AdminLayout title="All Orders">
      <div className="flex-1 p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Orders</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-500">{stats.processing}</p>
              <p className="text-xs text-muted-foreground">Processing</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-500">{stats.completed}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">${stats.totalRevenue.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Revenue</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by order #, service, link, or customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={fetchOrders}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Orders ({filteredOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : filteredOrders.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No orders found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Order #</th>
                      <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Customer</th>
                      <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Service</th>
                      <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Link</th>
                      <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Qty / Remains</th>
                      <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Charge</th>
                      <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="border-b border-border/50 hover:bg-secondary/20">
                        <td className="py-3 px-2">
                          <button
                            onClick={() => openDetailsDialog(order)}
                            className="text-sm font-mono text-primary hover:underline"
                          >
                            {order.order_number}
                          </button>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(order.created_at)}
                          </p>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="w-3.5 h-3.5 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium truncate max-w-[120px]">
                                {order.profiles?.full_name || "Unknown"}
                              </p>
                              <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                                {order.profiles?.email || "N/A"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-sm max-w-[150px] truncate">
                          {order.service_name}
                        </td>
                        <td className="py-3 px-2 text-sm">
                          <a
                            href={order.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1"
                          >
                            <span className="max-w-[100px] truncate">{order.link}</span>
                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          </a>
                        </td>
                        <td className="py-3 px-2 text-sm">
                          <span className="font-medium">{order.quantity.toLocaleString()}</span>
                          <span className="text-muted-foreground"> / </span>
                          <span className="text-muted-foreground">{(order.remains || 0).toLocaleString()}</span>
                        </td>
                        <td className="py-3 px-2 text-sm font-medium">
                          ${Number(order.charge).toFixed(2)}
                        </td>
                        <td className="py-3 px-2">
                          <Badge variant="outline" className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <Select
                              value={order.status}
                              onValueChange={(value) =>
                                updateOrderStatus(order.id, value as OrderStatus)
                              }
                              disabled={updating || order.status === "refunded"}
                            >
                              <SelectTrigger className="h-8 text-xs w-28">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="processing">Processing</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                            {order.status !== "refunded" && order.status !== "cancelled" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs text-destructive hover:text-destructive"
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setRefundDialogOpen(true);
                                }}
                              >
                                Refund
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Details Dialog */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Order Number</p>
                    <p className="font-mono font-medium">{selectedOrder.order_number}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge variant="outline" className={getStatusColor(selectedOrder.status)}>
                      {selectedOrder.status}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Customer</p>
                    <p className="font-medium">{selectedOrder.profiles?.full_name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{selectedOrder.profiles?.email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="text-sm">{formatDate(selectedOrder.created_at)}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Service</p>
                  <p className="font-medium">{selectedOrder.service_name}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Link</p>
                  <a
                    href={selectedOrder.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm break-all"
                  >
                    {selectedOrder.link}
                  </a>
                </div>

                <div className="grid grid-cols-3 gap-4 p-4 bg-secondary/50 rounded-lg">
                  <div className="text-center">
                    <p className="text-lg font-bold">{selectedOrder.quantity.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Quantity</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">{(selectedOrder.remains || 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Remains</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-primary">${Number(selectedOrder.charge).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Charge</p>
                  </div>
                </div>

                {selectedOrder.status !== "refunded" && selectedOrder.status !== "cancelled" && (
                  <div className="space-y-4 pt-4 border-t border-border">
                    <h4 className="font-medium">Update Progress</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="start_count">Start Count</Label>
                        <Input
                          id="start_count"
                          type="number"
                          value={startCountValue}
                          onChange={(e) => setStartCountValue(e.target.value)}
                          placeholder="Enter start count"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="remains">Remains</Label>
                        <Input
                          id="remains"
                          type="number"
                          value={remainsValue}
                          onChange={(e) => setRemainsValue(e.target.value)}
                          placeholder="Enter remains"
                        />
                      </div>
                    </div>
                    <Button onClick={updateOrderProgress} disabled={updating} className="w-full">
                      {updating ? "Updating..." : "Update Progress"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Refund Dialog */}
        <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Process Refund</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Are you sure you want to refund this order?
                </p>
                <div className="bg-secondary/50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order #:</span>
                    <span className="font-mono">{selectedOrder.order_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Customer:</span>
                    <span>{selectedOrder.profiles?.email || "Unknown"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service:</span>
                    <span className="truncate max-w-[200px]">{selectedOrder.service_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Refund Amount:</span>
                    <span className="font-bold text-destructive">
                      ${Number(selectedOrder.charge).toFixed(2)}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  This will credit ${Number(selectedOrder.charge).toFixed(2)} back to the
                  customer's wallet.
                </p>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setRefundDialogOpen(false);
                  setSelectedOrder(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRefund}
                disabled={updating}
              >
                {updating ? "Processing..." : "Confirm Refund"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;