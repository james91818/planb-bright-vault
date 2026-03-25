import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-affiliate-key, x-api-key",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Validate API key
    const apiKey = req.headers.get("x-affiliate-key") || req.headers.get("x-api-key");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing API key header (X-Affiliate-Key or X-Api-Key)" }), {
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

    // Parse params from query string (GET) or body (POST)
    let from: string | null = null;
    let to: string | null = null;
    let limit = 100;
    let page = 1;

    if (req.method === "GET") {
      const url = new URL(req.url);
      from = url.searchParams.get("from");
      to = url.searchParams.get("to");
      limit = Math.min(Number(url.searchParams.get("limit") || 100), 1000);
      page = Math.max(Number(url.searchParams.get("page") || 1), 1);
    } else {
      const body = await req.json();
      from = body.from || null;
      to = body.to || null;
      limit = Math.min(Number(body.limit || 100), 1000);
      page = Math.max(Number(body.page || 1), 1);
    }

    const offset = (page - 1) * limit;

    // Query leads belonging to this affiliate
    let query = adminClient
      .from("profiles")
      .select("id, full_name, email, phone, country, funnel, status, created_at, first_deposit_at", { count: "exact" })
      .eq("affiliate", affiliate.name)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (from) query = query.gte("created_at", `${from}T00:00:00Z`);
    if (to) query = query.lte("created_at", `${to}T23:59:59Z`);

    const { data: leads, count, error: qError } = await query;

    if (qError) {
      return new Response(JSON.stringify({ error: qError.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      affiliate: affiliate.name,
      total: count,
      page,
      limit,
      leads: (leads ?? []).map(l => ({
        id: l.id,
        name: l.full_name,
        email: l.email,
        phone: l.phone,
        country: l.country,
        funnel: l.funnel,
        status: l.status,
        registered_at: l.created_at,
        first_deposit_at: l.first_deposit_at ?? null,
      })),
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
