import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Receipt,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Eye,
  Phone,
  DollarSign,
  User,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";

interface PaymentProof {
  id: string;
  user_id: string;
  transaction_id: string;
  screenshot_url: string;
  phone_number: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  profiles?: {
    email: string | null;
    full_name: string | null;
  };
  wallet_transactions?: {
    amount: number;
    reference: string | null;
  };
}

const AdminPaymentProofs = () => {
  const { toast } = useToast();
  const [proofs, setProofs] = useState<PaymentProof[]>([]);
  const [filteredProofs, setFilteredProofs] = useState<PaymentProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedProof, setSelectedProof] = useState<PaymentProof | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchProofs();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("payment-proofs-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payment_proofs",
        },
        () => {
          fetchProofs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterProofs();
  }, [proofs, searchTerm, statusFilter]);

  const fetchProofs = async () => {
    try {
      const { data, error } = await supabase
        .from("payment_proofs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch related data for each proof
      const proofsWithDetails: PaymentProof[] = [];
      for (const proof of data || []) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", proof.user_id)
          .single();

        const { data: txData } = await supabase
          .from("wallet_transactions")
          .select("amount, reference")
          .eq("id", proof.transaction_id)
          .single();

        proofsWithDetails.push({
          ...proof,
          profiles: profileData || undefined,
          wallet_transactions: txData || undefined,
        });
      }

      setProofs(proofsWithDetails);
    } catch (error: any) {
      console.error("Error fetching payment proofs:", error);
      toast({
        title: "Error loading payment proofs",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterProofs = () => {
    let filtered = [...proofs];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (proof) =>
          proof.profiles?.email?.toLowerCase().includes(term) ||
          proof.profiles?.full_name?.toLowerCase().includes(term) ||
          proof.phone_number?.includes(term) ||
          proof.wallet_transactions?.reference?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((proof) => proof.status === statusFilter);
    }

    setFilteredProofs(filtered);
  };

  const handleApprove = async () => {
    if (!selectedProof) return;
    setProcessing(true);

    try {
      // Update payment proof status
      const { error: proofError } = await supabase
        .from("payment_proofs")
        .update({ status: "approved", admin_notes: adminNotes || null })
        .eq("id", selectedProof.id);

      if (proofError) throw proofError;

      // Update transaction status
      const { error: txError } = await supabase
        .from("wallet_transactions")
        .update({ status: "completed" })
        .eq("id", selectedProof.transaction_id);

      if (txError) throw txError;

      // Update user balance atomically
      const amount = selectedProof.wallet_transactions?.amount || 0;
      const { error: updateError } = await supabase.rpc("adjust_balance", {
        p_user_id: selectedProof.user_id,
        p_amount: amount,
      });

      if (updateError) throw updateError;

      toast({
        title: "Payment approved",
        description: `$${amount.toFixed(2)} has been added to the user's balance.`,
      });

      setSelectedProof(null);
      setAdminNotes("");
      fetchProofs();
    } catch (error: any) {
      console.error("Error approving payment:", error);
      toast({
        title: "Error approving payment",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedProof) return;
    if (!adminNotes.trim()) {
      toast({
        title: "Notes required",
        description: "Please provide a reason for rejection.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);

    try {
      // Update payment proof status
      const { error: proofError } = await supabase
        .from("payment_proofs")
        .update({ status: "rejected", admin_notes: adminNotes })
        .eq("id", selectedProof.id);

      if (proofError) throw proofError;

      // Update transaction status
      const { error: txError } = await supabase
        .from("wallet_transactions")
        .update({ status: "failed" })
        .eq("id", selectedProof.transaction_id);

      if (txError) throw txError;

      toast({
        title: "Payment rejected",
        description: "The payment has been rejected.",
      });

      setSelectedProof(null);
      setAdminNotes("");
      fetchProofs();
    } catch (error: any) {
      console.error("Error rejecting payment:", error);
      toast({
        title: "Error rejecting payment",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const pendingCount = proofs.filter((p) => p.status === "pending").length;

  return (
    <AdminLayout title="Payment Proofs">
      <div className="flex-1 p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Clock className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
                  <p className="text-xs text-muted-foreground">Pending Review</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {proofs.filter((p) => p.status === "approved").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <XCircle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {proofs.filter((p) => p.status === "rejected").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Rejected</p>
                </div>
              </div>
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
                  placeholder="Search by email, name, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Payment Proofs List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Payment Proofs ({filteredProofs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredProofs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No payment proofs found
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                        User
                      </th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                        Phone
                      </th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                        Amount
                      </th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                        Date
                      </th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProofs.map((proof) => (
                      <tr key={proof.id} className="border-b border-border/50">
                        <td className="py-3 px-2">
                          <div>
                            <p className="text-sm font-medium">
                              {proof.profiles?.full_name || "Unknown"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {proof.profiles?.email}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-sm">
                          {proof.phone_number || "-"}
                        </td>
                        <td className="py-3 px-2 text-sm font-medium text-green-600">
                          ${proof.wallet_transactions?.amount?.toFixed(2) || "0.00"}
                        </td>
                        <td className="py-3 px-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              proof.status
                            )}`}
                          >
                            {getStatusIcon(proof.status)}
                            {proof.status}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-sm text-muted-foreground">
                          {format(new Date(proof.created_at), "MMM d, yyyy HH:mm")}
                        </td>
                        <td className="py-3 px-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedProof(proof);
                              setAdminNotes(proof.admin_notes || "");
                            }}
                            className="gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            View
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
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selectedProof} onOpenChange={() => setSelectedProof(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Payment Proof</DialogTitle>
            <DialogDescription>
              Verify the payment screenshot and approve or reject the deposit request.
            </DialogDescription>
          </DialogHeader>

          {selectedProof && (
            <div className="space-y-4">
              {/* User Info */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Customer</p>
                    <p className="text-sm font-medium">
                      {selectedProof.profiles?.full_name || selectedProof.profiles?.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone Number</p>
                    <p className="text-sm font-medium">
                      {selectedProof.phone_number || "-"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="text-sm font-medium text-green-600">
                      ${selectedProof.wallet_transactions?.amount?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Submitted</p>
                    <p className="text-sm font-medium">
                      {format(new Date(selectedProof.created_at), "MMM d, yyyy HH:mm")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Screenshot */}
              <div>
                <p className="text-sm font-medium mb-2">Payment Screenshot</p>
                <div className="border border-border rounded-lg overflow-hidden">
                  <img
                    src={selectedProof.screenshot_url}
                    alt="Payment proof"
                    className="w-full max-h-96 object-contain bg-secondary/50"
                  />
                </div>
              </div>

              {/* Admin Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Admin Notes</label>
                <Textarea
                  placeholder="Add notes about this payment (required for rejection)"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  disabled={selectedProof.status !== "pending"}
                />
              </div>

              {/* Status Badge */}
              {selectedProof.status !== "pending" && (
                <div
                  className={`p-3 rounded-lg ${
                    selectedProof.status === "approved"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  <p className="text-sm font-medium">
                    This payment has already been {selectedProof.status}.
                  </p>
                  {selectedProof.admin_notes && (
                    <p className="text-sm mt-1">Notes: {selectedProof.admin_notes}</p>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedProof(null)}>
              Close
            </Button>
            {selectedProof?.status === "pending" && (
              <>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={processing}
                >
                  {processing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </>
                  )}
                </Button>
                <Button onClick={handleApprove} disabled={processing}>
                  {processing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </>
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminPaymentProofs;
