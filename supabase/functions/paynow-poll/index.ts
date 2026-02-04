import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function parsePaynowResponse(response: string): Record<string, string> {
  const result: Record<string, string> = {};
  const pairs = response.split("&");
  for (const pair of pairs) {
    const [key, value] = pair.split("=");
    if (key && value !== undefined) {
      result[key.toLowerCase()] = decodeURIComponent(value);
    }
  }
  return result;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    // SECURITY FIX: Verify user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's auth to verify identity
    const supabaseAuth = createClient(supabaseUrl!, supabaseAnonKey!, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claims?.claims) {
      console.error("Auth verification failed:", claimsError);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claims.claims.sub;
    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: "User ID not found in token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { transactionId } = await req.json();

    if (!transactionId) {
      throw new Error("Transaction ID required");
    }

    // Create Supabase client with service role for privileged operations
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Get the transaction - SECURITY FIX: Verify user owns this transaction
    const { data: transaction, error: txError } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("id", transactionId)
      .eq("user_id", userId) // Only allow polling own transactions
      .single();

    if (txError || !transaction) {
      console.error("Transaction not found or access denied:", transactionId, "user:", userId);
      return new Response(
        JSON.stringify({ success: false, error: "Transaction not found or access denied" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If already completed or failed, return current status
    if (transaction.status !== "pending") {
      return new Response(
        JSON.stringify({
          success: true,
          status: transaction.status,
          completed: transaction.status === "completed",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Extract poll URL from reference if stored
    const refParts = (transaction.reference || "").split("|");
    const pollUrl = refParts.length > 1 ? refParts[1] : null;

    if (!pollUrl || pollUrl.startsWith("PN:")) {
      // No poll URL available, return current status
      return new Response(
        JSON.stringify({
          success: true,
          status: transaction.status,
          completed: false,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Polling PayNow status:", pollUrl, "for user:", userId);

    // Poll PayNow for status
    const response = await fetch(pollUrl);
    const responseText = await response.text();
    console.log("Poll response:", responseText);

    const data = parsePaynowResponse(responseText);
    const paynowStatus = (data.status || "").toLowerCase();

    let newStatus: string | null = null;

    if (paynowStatus === "paid" || paynowStatus === "complete" || paynowStatus === "completed") {
      newStatus = "completed";
    } else if (paynowStatus === "cancelled" || paynowStatus === "canceled" || paynowStatus === "failed") {
      newStatus = "failed";
    } else if (paynowStatus === "awaiting delivery" || paynowStatus === "delivered") {
      newStatus = "completed";
    }

    if (newStatus) {
      // SECURITY FIX: Use atomic update with status check to prevent race conditions
      // Only update if status is still 'pending' - prevents duplicate balance credits
      const { data: updatedTx, error: updateError } = await supabase
        .from("wallet_transactions")
        .update({ status: newStatus })
        .eq("id", transactionId)
        .eq("status", "pending") // Atomic check - only update if still pending
        .select()
        .single();

      // If no rows updated, transaction was already processed
      if (updateError || !updatedTx) {
        console.log("Transaction already processed by another request");
        // Fetch current status to return accurate info
        const { data: currentTx } = await supabase
          .from("wallet_transactions")
          .select("status")
          .eq("id", transactionId)
          .single();
        
        return new Response(
          JSON.stringify({
            success: true,
            status: currentTx?.status || newStatus,
            completed: currentTx?.status === "completed" || newStatus === "completed",
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // If completed and we successfully updated, update user balance
      if (newStatus === "completed") {
        const { data: profile } = await supabase
          .from("profiles")
          .select("balance")
          .eq("id", transaction.user_id)
          .single();

        if (profile) {
          const newBalance = (profile.balance || 0) + transaction.amount;
          await supabase
            .from("profiles")
            .update({ balance: newBalance })
            .eq("id", transaction.user_id);

          console.log("Balance updated via poll:", newBalance, "for user:", userId);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          status: newStatus,
          completed: newStatus === "completed",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Still pending
    return new Response(
      JSON.stringify({
        success: true,
        status: "pending",
        completed: false,
        paynowStatus: data.status,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error("Poll error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
