import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PaymentRequest {
  amount: number;
  paymentMethod: string;
  phoneNumber?: string;
  email: string;
  userId: string;
}

interface PaynowResponse {
  status: string;
  browserurl?: string;
  pollurl?: string;
  hash?: string;
  error?: string;
  instructions?: string;
}

const PAYNOW_URL = "https://www.paynow.co.zw/interface/initiatetransaction";
const PAYNOW_MOBILE_URL = "https://www.paynow.co.zw/interface/remotetransaction";

function generateHash(values: string[], integrationKey: string): string {
  const data = values.join("") + integrationKey;
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  
  // Use Web Crypto API for SHA512
  return crypto.subtle.digest("SHA-512", dataBuffer).then((hashBuffer) => {
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  }) as unknown as string;
}

async function generateHashAsync(values: string[], integrationKey: string): Promise<string> {
  const data = values.join("") + integrationKey;
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-512", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

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
    const integrationId = Deno.env.get("PAYNOW_INTEGRATION_ID");
    const integrationKey = Deno.env.get("PAYNOW_INTEGRATION_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!integrationId || !integrationKey) {
      console.error("PayNow credentials not configured");
      throw new Error("Payment gateway not configured");
    }

    // SECURITY FIX: Verify user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    const authenticatedUserId = claims.claims.sub;
    if (!authenticatedUserId) {
      return new Response(
        JSON.stringify({ success: false, error: "User ID not found in token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { amount, paymentMethod, phoneNumber, email, userId }: PaymentRequest = await req.json();

    // SECURITY FIX: Verify userId matches authenticated user
    if (userId !== authenticatedUserId) {
      return new Response(
        JSON.stringify({ success: false, error: "User mismatch" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Payment request received:", { amount, paymentMethod, email, userId });

    // Validate input
    if (!amount || amount < 1) {
      throw new Error("Invalid amount");
    }
    if (!email || !userId) {
      throw new Error("User information required");
    }
    if ((paymentMethod === "ecocash" || paymentMethod === "onemoney") && !phoneNumber) {
      throw new Error("Phone number required for mobile money");
    }

    // Create Supabase client with service role for admin access
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Generate unique reference
    const reference = `DEP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create pending transaction in database
    const { data: transaction, error: txError } = await supabase
      .from("wallet_transactions")
      .insert({
        user_id: userId,
        type: "deposit",
        amount: amount,
        payment_method: paymentMethod,
        reference: reference,
        status: "pending",
      })
      .select()
      .single();

    if (txError) {
      console.error("Failed to create transaction:", txError);
      throw new Error("Failed to create transaction");
    }

    console.log("Transaction created:", transaction.id);

    // Build result URL (webhook endpoint)
    const resultUrl = `${supabaseUrl}/functions/v1/paynow-webhook`;
    const returnUrl = `${Deno.env.get("SITE_URL") || supabaseUrl?.replace(".supabase.co", ".lovableproject.com") || ""}/add-funds?status=success`;

    let paynowResponse: PaynowResponse;

    if (paymentMethod === "ecocash" || paymentMethod === "onemoney") {
      // Mobile money payment
      const mobileMethod = paymentMethod === "ecocash" ? "ecocash" : "onemoney";
      
      // Format phone number (remove leading 0 and add 263)
      let formattedPhone = phoneNumber!.replace(/\s/g, "");
      if (formattedPhone.startsWith("0")) {
        formattedPhone = "263" + formattedPhone.substring(1);
      } else if (!formattedPhone.startsWith("263")) {
        formattedPhone = "263" + formattedPhone;
      }

      const values = [
        integrationId,
        reference,
        email,
        amount.toFixed(2),
        "Wallet Top Up",
        resultUrl,
        "Message",
        formattedPhone,
        mobileMethod,
      ];

      const hash = await generateHashAsync(values, integrationKey);

      const formData = new URLSearchParams();
      formData.append("id", integrationId);
      formData.append("reference", reference);
      formData.append("authemail", email);
      formData.append("amount", amount.toFixed(2));
      formData.append("additionalinfo", "Wallet Top Up");
      formData.append("resulturl", resultUrl);
      formData.append("status", "Message");
      formData.append("phone", formattedPhone);
      formData.append("method", mobileMethod);
      formData.append("hash", hash);

      console.log("Sending mobile payment request to PayNow");

      const response = await fetch(PAYNOW_MOBILE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      const responseText = await response.text();
      console.log("PayNow mobile response:", responseText);

      const parsed = parsePaynowResponse(responseText);
      paynowResponse = {
        status: parsed.status || "Error",
        browserurl: parsed.browserurl,
        pollurl: parsed.pollurl,
        instructions: parsed.instructions,
        error: parsed.error,
      };

    } else {
      // Web-based payment (PayNow redirect or bank)
      const values = [
        integrationId,
        reference,
        email,
        amount.toFixed(2),
        "Wallet Top Up",
        resultUrl,
        returnUrl,
        "Message",
      ];

      const hash = await generateHashAsync(values, integrationKey);

      const formData = new URLSearchParams();
      formData.append("id", integrationId);
      formData.append("reference", reference);
      formData.append("authemail", email);
      formData.append("amount", amount.toFixed(2));
      formData.append("additionalinfo", "Wallet Top Up");
      formData.append("resulturl", resultUrl);
      formData.append("returnurl", returnUrl);
      formData.append("status", "Message");
      formData.append("hash", hash);

      console.log("Sending web payment request to PayNow");

      const response = await fetch(PAYNOW_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      const responseText = await response.text();
      console.log("PayNow web response:", responseText);

      const parsed = parsePaynowResponse(responseText);
      paynowResponse = {
        status: parsed.status || "Error",
        browserurl: parsed.browserurl,
        pollurl: parsed.pollurl,
        error: parsed.error,
      };
    }

    // Check PayNow response
    if (paynowResponse.status !== "Ok" && paynowResponse.status !== "ok") {
      console.error("PayNow error:", paynowResponse);
      
      // Update transaction to failed
      await supabase
        .from("wallet_transactions")
        .update({ status: "failed" })
        .eq("id", transaction.id);

      throw new Error(paynowResponse.error || "Payment initiation failed");
    }

    // Store poll URL in database for later verification
    if (paynowResponse.pollurl) {
      await supabase
        .from("wallet_transactions")
        .update({ 
          reference: `${reference}|${paynowResponse.pollurl}` 
        })
        .eq("id", transaction.id);
    }

    console.log("Payment initiated successfully:", {
      reference,
      browserUrl: paynowResponse.browserurl,
      instructions: paynowResponse.instructions,
    });

    return new Response(
      JSON.stringify({
        success: true,
        transactionId: transaction.id,
        reference: reference,
        redirectUrl: paynowResponse.browserurl,
        instructions: paynowResponse.instructions,
        pollUrl: paynowResponse.pollurl,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Payment initiation error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Payment failed" 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
