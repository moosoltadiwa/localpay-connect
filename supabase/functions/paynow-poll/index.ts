import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const { transactionId } = await req.json();

    if (!transactionId) {
      throw new Error("Transaction ID required");
    }

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Get the transaction
    const { data: transaction, error: txError } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("id", transactionId)
      .single();

    if (txError || !transaction) {
      throw new Error("Transaction not found");
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

    console.log("Polling PayNow status:", pollUrl);

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
      // Update transaction status
      await supabase
        .from("wallet_transactions")
        .update({ status: newStatus })
        .eq("id", transactionId);

      // If completed, update user balance
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

          console.log("Balance updated via poll:", newBalance);
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
