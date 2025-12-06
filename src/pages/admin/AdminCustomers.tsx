import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Users, Search, Wallet, Plus, Minus } from "lucide-react";

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  balance: number;
  created_at: string;
}

const AdminCustomers = () => {
  const [customers, setCustomers] = useState<Profile[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Profile | null>(null);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustType, setAdjustType] = useState<"add" | "subtract">("add");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      setFilteredCustomers(
        customers.filter(
          (c) =>
            c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredCustomers(customers);
    }
  }, [customers, searchTerm]);

  const fetchCustomers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch customers");
    } else {
      setCustomers(data || []);
    }
    setLoading(false);
  };

  const handleAdjustBalance = async () => {
    if (!selectedCustomer || !adjustAmount) return;

    const amount = parseFloat(adjustAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setUpdating(true);
    try {
      const newBalance =
        adjustType === "add"
          ? Number(selectedCustomer.balance) + amount
          : Math.max(0, Number(selectedCustomer.balance) - amount);

      const { error: balanceError } = await supabase
        .from("profiles")
        .update({ balance: newBalance })
        .eq("id", selectedCustomer.id);

      if (balanceError) throw balanceError;

      // Create transaction record
      const { error: transactionError } = await supabase
        .from("wallet_transactions")
        .insert({
          user_id: selectedCustomer.id,
          type: adjustType === "add" ? "deposit" : "withdrawal",
          amount: amount,
          status: "completed",
          reference: `Admin adjustment: ${adjustType === "add" ? "+" : "-"}$${amount.toFixed(2)}`,
        });

      if (transactionError) throw transactionError;

      toast.success(
        `Balance ${adjustType === "add" ? "added" : "subtracted"} successfully`
      );
      setAdjustDialogOpen(false);
      setSelectedCustomer(null);
      setAdjustAmount("");
      fetchCustomers();
    } catch (error) {
      toast.error("Failed to adjust balance");
      console.error("Adjust error:", error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <AdminLayout title="Customers">
      <div className="flex-1 p-6 space-y-6">
        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Customers Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Customers ({filteredCustomers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No customers found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                        Customer
                      </th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                        Email
                      </th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                        Balance
                      </th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                        Joined
                      </th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.id} className="border-b border-border/50">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-medium text-primary">
                                {(customer.full_name || customer.email || "U")
                                  .charAt(0)
                                  .toUpperCase()}
                              </span>
                            </div>
                            <span className="font-medium text-sm">
                              {customer.full_name || "No name"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-sm text-muted-foreground">
                          {customer.email || "No email"}
                        </td>
                        <td className="py-3 px-2">
                          <span className="font-semibold text-sm">
                            ${Number(customer.balance).toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-sm text-muted-foreground">
                          {new Date(customer.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setAdjustDialogOpen(true);
                            }}
                          >
                            <Wallet className="w-4 h-4 mr-2" />
                            Adjust Balance
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Adjust Balance Dialog */}
        <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adjust Balance</DialogTitle>
            </DialogHeader>
            {selectedCustomer && (
              <div className="space-y-4">
                <div className="bg-secondary/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">
                    {selectedCustomer.full_name || selectedCustomer.email}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">Current Balance</p>
                  <p className="font-bold text-lg">
                    ${Number(selectedCustomer.balance).toFixed(2)}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant={adjustType === "add" ? "default" : "outline"}
                    onClick={() => setAdjustType("add")}
                    className="flex-1"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                  <Button
                    variant={adjustType === "subtract" ? "destructive" : "outline"}
                    onClick={() => setAdjustType("subtract")}
                    className="flex-1"
                  >
                    <Minus className="w-4 h-4 mr-2" />
                    Subtract
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (USD)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setAdjustDialogOpen(false);
                  setSelectedCustomer(null);
                  setAdjustAmount("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAdjustBalance}
                disabled={updating || !adjustAmount}
                variant={adjustType === "subtract" ? "destructive" : "default"}
              >
                {updating ? "Processing..." : "Confirm"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminCustomers;
