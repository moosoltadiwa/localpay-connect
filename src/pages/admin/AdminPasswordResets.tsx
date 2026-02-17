import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, KeyRound, CheckCircle, Clock, Link as LinkIcon } from "lucide-react";

const AdminPasswordResets = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const { data: requests, isLoading } = useQuery({
    queryKey: ["admin-password-resets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("password_reset_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    refetchInterval: 15000,
  });

  const handleGenerateLink = async (requestId: string, email: string) => {
    setGeneratingId(requestId);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const response = await supabase.functions.invoke("generate-reset-link", {
        body: { email, requestId },
      });

      if (response.error) throw new Error(response.error.message);

      const resetLink = response.data?.resetLink;
      if (resetLink) {
        await navigator.clipboard.writeText(resetLink);
        toast({
          title: "Reset link generated & copied!",
          description: "The link has been copied to your clipboard. Send it to the user.",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["admin-password-resets"] });
    } catch (error: any) {
      console.error("Generate link error:", error);
      toast({
        title: "Failed to generate link",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGeneratingId(null);
    }
  };

  const handleCopyLink = async (link: string) => {
    await navigator.clipboard.writeText(link);
    toast({
      title: "Link copied!",
      description: "Reset link copied to clipboard.",
    });
  };

  const handleMarkDone = async (requestId: string) => {
    const { error } = await supabase
      .from("password_reset_requests")
      .update({ status: "completed" })
      .eq("id", requestId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Marked as completed" });
      queryClient.invalidateQueries({ queryKey: ["admin-password-resets"] });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "link_generated":
        return <Badge variant="outline" className="border-blue-500 text-blue-600"><LinkIcon className="w-3 h-3 mr-1" />Link Generated</Badge>;
      case "completed":
        return <Badge variant="outline" className="border-green-500 text-green-600"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingCount = requests?.filter((r) => r.status === "pending").length || 0;

  return (
    <>
      <Helmet>
        <title>Password Resets - Admin</title>
      </Helmet>

      <AdminLayout title="Password Resets">
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-card rounded-xl border border-border p-4">
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold text-foreground">{requests?.length || 0}</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-4">
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-4">
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {requests?.filter((r) => r.status === "completed").length || 0}
                </p>
              </div>
            </div>

            {/* Table */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {isLoading ? (
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : !requests?.length ? (
                <div className="text-center p-12 text-muted-foreground">
                  <KeyRound className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No password reset requests yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Requested</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">{request.user_email}</TableCell>
                          <TableCell>{getStatusBadge(request.status)}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {new Date(request.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {request.status !== "completed" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleGenerateLink(request.id, request.user_email)}
                                  disabled={generatingId === request.id}
                                >
                                  {generatingId === request.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                                  ) : (
                                    <KeyRound className="w-4 h-4 mr-1" />
                                  )}
                                  {request.reset_link ? "Regenerate" : "Generate"} Link
                                </Button>
                              )}
                              {request.reset_link && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCopyLink(request.reset_link!)}
                                >
                                  <Copy className="w-4 h-4 mr-1" />
                                  Copy
                                </Button>
                              )}
                              {request.status !== "completed" && request.reset_link && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleMarkDone(request.id)}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Done
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </div>
      </AdminLayout>
    </>
  );
};

export default AdminPasswordResets;
