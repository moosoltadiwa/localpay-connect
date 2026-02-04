import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function verifyHash(data: Record<string, string>, receivedHash: string, integrationKey: string): Promise<boolean> {
  // Build hash string from response values in order
  const values = [
    data.reference || "",
    data.paynowreference || "",
    data.amount || "",
    data.status || "",
    data.pollurl || "",
  ];
  
  const hashString = values.join("") + integrationKey;
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(hashString);
  const hashBuffer = await crypto.subtle.digest("SHA-512", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const calculatedHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  
  return calculatedHash === receivedHash.toUpperCase();
}

function parsePaynowData(body: string): Record<string, string> {
  const result: Record<string, string> = {};
  const pairs = body.split("&");
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

  console.log("PayNow webhook received");

  try {
    const integrationKey = Deno.env.get("PAYNOW_INTEGRATION_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!integrationKey) {
      console.error("PayNow integration key not configured");
      return new Response("Configuration error", { status: 500 });
    }

    // Parse the webhook data
    const body = await req.text();
    console.log("Webhook body:", body);

    const data = parsePaynowData(body);
    console.log("Parsed webhook data:", data);

    const {
      reference,
      paynowreference,
      amount,
      status,
      pollurl,
      hash,
    } = data;

    if (!reference || !status) {
      console.error("Missing required fields in webhook");
      return new Response("Invalid webhook data", { status: 400 });
    }

    // SECURITY FIX: Hash verification is now MANDATORY
    // Reject any webhook request that doesn't include a valid hash
    if (!hash) {
      console.error("SECURITY: Webhook rejected - no hash provided");
      return new Response("Authentication required - hash missing", { status: 401 });
    }

    const isValid = await verifyHash(data, hash, integrationKey);
    if (!isValid) {
      console.error("SECURITY: Hash verification failed");
      return new Response("Invalid hash", { status: 403 });
    }
    console.log("Hash verified successfully");

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Find the transaction by reference
    // Reference might be stored with poll URL appended
    const { data: transactions, error: findError } = await supabase
      .from("wallet_transactions")
      .select("*")
      .or(`reference.eq.${reference},reference.like.${reference}|%`);

    if (findError || !transactions || transactions.length === 0) {
      console.error("Transaction not found:", reference, findError);
      return new Response("Transaction not found", { status: 404 });
    }

    const transaction = transactions[0];
    console.log("Found transaction:", transaction.id, "Current status:", transaction.status);

    // Only process if transaction is still pending
    if (transaction.status !== "pending") {
      console.log("Transaction already processed, status:", transaction.status);
      return new Response("OK", { status: 200 });
    }

    // Map PayNow status to our status
    let newStatus: string;
    const paynowStatus = status.toLowerCase();

    if (paynowStatus === "paid" || paynowStatus === "complete" || paynowStatus === "completed") {
      newStatus = "completed";
    } else if (paynowStatus === "cancelled" || paynowStatus === "canceled" || paynowStatus === "failed") {
      newStatus = "failed";
    } else if (paynowStatus === "awaiting delivery" || paynowStatus === "delivered") {
      newStatus = "completed";
    } else {
      // Still pending (e.g., "created", "sent", "pending")
      console.log("Transaction still pending, PayNow status:", status);
      return new Response("OK", { status: 200 });
    }

    console.log("Updating transaction status to:", newStatus);

    // SECURITY FIX: Use atomic update with status check to prevent race conditions
    // Only update if status is still 'pending' - prevents duplicate processing
    const { data: updatedTx, error: updateError } = await supabase
      .from("wallet_transactions")
      .update({ 
        status: newStatus,
        reference: paynowreference ? `${reference}|PN:${paynowreference}` : transaction.reference,
      })
      .eq("id", transaction.id)
      .eq("status", "pending") // Atomic check - only update if still pending
      .select()
      .single();

    if (updateError || !updatedTx) {
      // If no rows updated, transaction was already processed
      console.log("Transaction already processed by another request or update failed");
      return new Response("OK", { status: 200 });
    }

    // If payment completed, update user balance
    if (newStatus === "completed") {
      // Get current profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("balance")
        .eq("id", transaction.user_id)
        .single();

      if (profileError) {
        console.error("Failed to get profile:", profileError);
        return new Response("Profile error", { status: 500 });
      }

      const newBalance = (profile.balance || 0) + transaction.amount;
      
      const { error: balanceError } = await supabase
        .from("profiles")
        .update({ balance: newBalance })
        .eq("id", transaction.user_id);

      if (balanceError) {
        console.error("Failed to update balance:", balanceError);
        return new Response("Balance update failed", { status: 500 });
      }

      console.log("User balance updated:", {
        userId: transaction.user_id,
        oldBalance: profile.balance,
        newBalance: newBalance,
        amount: transaction.amount,
      });
    }

    console.log("Webhook processed successfully");
    return new Response("OK", { status: 200 });

  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response("Server error", { status: 500 });
  }
});
