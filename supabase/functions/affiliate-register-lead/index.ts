import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-affiliate-key",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Validate API key
    const apiKey = req.headers.get("x-affiliate-key");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing X-Affiliate-Key header" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: affiliate, error: affError } = await adminClient
      .from("affiliates")
      .select("id, name, status")
      .eq("api_key", apiKey)
      .maybeSingle();

    if (affError || !affiliate) {
      return new Response(JSON.stringify({ error: "Invalid API key" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (affiliate.status !== "active") {
      return new Response(JSON.stringify({ error: "Affiliate account suspended" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { email, full_name, phone, country, funnel } = body;

    if (!email || !full_name) {
      return new Response(JSON.stringify({ error: "email and full_name are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check duplicate email in profiles
    const { data: existing } = await adminClient
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ error: "A lead with this email already exists" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create auth user with random password (lead won't log in directly)
    const randomPassword = crypto.randomUUID() + "Aa1!";
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password: randomPassword,
      email_confirm: true,
      user_metadata: { full_name, phone, country },
    });

    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update the profile with affiliate info
    await adminClient.from("profiles").update({
      affiliate: affiliate.name,
      funnel: funnel || null,
      status: "New Registration",
      is_lead: true,
    }).eq("id", authData.user.id);

    return new Response(JSON.stringify({ success: true, lead_id: authData.user.id }), {
      status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
