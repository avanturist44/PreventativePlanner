declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: { get: (key: string) => string | undefined };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { profile } = await req.json();

    if (!profile?.age || !profile?.sex) {
      return new Response(JSON.stringify({ error: "Missing profile data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const riskText = Array.isArray(profile.riskFactors) && profile.riskFactors.length > 0
      ? profile.riskFactors.join(", ")
      : "none";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              'You are a preventative healthcare advisor. Return a JSON object with a "recommendations" array. Each item must have: id (unique snake_case string), title (short appointment name), category (one of: Screening, Checkup, Vaccination, Consultation), explanation (1-2 sentences personalized to this patient).',
          },
          {
            role: "user",
            content: `Patient: ${profile.age} year old ${profile.sex}. Risk factors: ${riskText}. Generate 4-6 preventative care recommendations.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI error ${response.status}: ${err}`);
    }

    const data = await response.json();
    const parsed = JSON.parse(data.choices[0].message.content);

    return new Response(JSON.stringify(parsed.recommendations), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unknown error occurred";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
