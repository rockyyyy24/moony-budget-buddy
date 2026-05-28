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

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const overridesStr = context?.monthlyBudgetOverrides
      ? Object.entries(context.monthlyBudgetOverrides as Record<string, number>)
          .map(([k, v]) => `${k}: ${context?.currencySymbol ?? ''}${v}${context?.monthlyBudgetLabels?.[k] ? ` (${context.monthlyBudgetLabels[k]})` : ''}`)
          .join(', ') || 'none'
      : 'none';

    const systemPrompt = `You are Mooney, a friendly kawaii duck money manager 🦆. You chat warmly and casually like a bestie — use light emojis, be playful, supportive, and concise (2-5 sentences). You can chat about ANY topic (life, mood, jokes, advice). When asked about budgeting, saving, or money habits, give thoughtful practical financial advice tailored to their situation.

IMPORTANT — YOU CAN EDIT MONTHLY BUDGETS:
When the user mentions a plan that affects a future month's budget (e.g. "I'm going on a trip in February and my budget is 30000", "I need 50k for December gifts"), call the set_month_budget tool with the correct YYYY-MM and amount.
When the user cancels or removes a plan (e.g. "Feb trip is cancelled", "scrap the December plan"), call reset_month_budget to fall back to the default monthly budget.
Always confirm the action in your text reply in a warm tone.
If a month is mentioned without a year, assume the NEXT upcoming occurrence of that month (today is ${currentYear}-${String(currentMonth).padStart(2,'0')}).

User context (use only if relevant):
- Currency: ${context?.currencySymbol ?? ''}
- Default monthly budget: ${context?.monthlyBudget ?? 'not set'}
- Spent this month: ${context?.totalSpent ?? 0}
- Spent today: ${context?.todaySpent ?? 0}
- Top categories: ${context?.topCategories ?? 'none yet'}
- Mode: ${context?.mode ?? 'budgeting'}
- Financial year starts: ${context?.fyStart ?? 'Jan'}
- Existing month overrides: ${overridesStr}

Never pretend to log expenses — if the user wants to log something, tell them to type it like "Pizza 250". Keep replies short unless they ask for detail.`;

    const tools = [
      {
        type: "function",
        function: {
          name: "set_month_budget",
          description: "Set or override the budget for a specific month (e.g. for a trip or special event).",
          parameters: {
            type: "object",
            properties: {
              monthIso: { type: "string", description: "Month in YYYY-MM format, e.g. 2027-02" },
              amount: { type: "number", description: "Budget amount in user's currency" },
              label: { type: "string", description: "Short label like 'Goa trip' or 'December gifts'" },
            },
            required: ["monthIso", "amount"],
            additionalProperties: false,
          },
        },
      },
      {
        type: "function",
        function: {
          name: "reset_month_budget",
          description: "Clear an override for a month — falls back to the default monthly budget.",
          parameters: {
            type: "object",
            properties: {
              monthIso: { type: "string", description: "Month in YYYY-MM format" },
            },
            required: ["monthIso"],
            additionalProperties: false,
          },
        },
      },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        tools,
        tool_choice: "auto",
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
    const msg = data.choices?.[0]?.message;
    const reply = msg?.content ?? "Hmm, I blanked out for a sec 🦆 try again?";
    const actions: Array<{ type: string; monthIso?: string; amount?: number; label?: string }> = [];
    const toolCalls = msg?.tool_calls || [];
    for (const tc of toolCalls) {
      try {
        const args = JSON.parse(tc.function?.arguments || "{}");
        if (tc.function?.name === "set_month_budget") {
          actions.push({ type: "set_month_budget", monthIso: args.monthIso, amount: args.amount, label: args.label });
        } else if (tc.function?.name === "reset_month_budget") {
          actions.push({ type: "reset_month_budget", monthIso: args.monthIso });
        }
      } catch (e) {
        console.error("tool args parse error", e);
      }
    }
    return new Response(JSON.stringify({ reply, actions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("mooney-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});