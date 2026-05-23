import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const systemPrompt = `You are Mooney, a friendly kawaii duck money manager 🦆. You chat warmly and casually like a bestie — use light emojis, be playful, supportive, and concise (2-5 sentences typically). You can chat about ANY topic the user brings up (life, mood, random questions, jokes, advice) — you're not limited to finance. However, when asked about budgeting, saving, spending less, financial planning, or money habits, give thoughtful practical financial advice tailored to their situation.

User context (use only if relevant):
- Currency: ${context?.currencySymbol ?? ''}
- Monthly budget: ${context?.monthlyBudget ?? 'not set'}
- Spent this month: ${context?.totalSpent ?? 0}
- Spent today: ${context?.todaySpent ?? 0}
- Top categories: ${context?.topCategories ?? 'none yet'}
- Mode: ${context?.mode ?? 'budgeting'}

Never pretend to log expenses — if the user wants to log something, tell them to type it like "Pizza 250". Keep replies short unless they ask for detail.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit hit, try again in a sec! 🦆" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits ran out — add some in Lovable Cloud settings." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!response.ok) {
      const t = await response.text();
      console.error("gateway error", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content ?? "Hmm, I blanked out for a sec 🦆 try again?";
    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("mooney-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});