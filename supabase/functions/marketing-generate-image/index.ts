import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { prompt, unit_id } = await req.json();
    if (!prompt || !unit_id) throw new Error("prompt and unit_id required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch brand context for visual consistency
    const { data: brand } = await supabase
      .from("brand_identity")
      .select("colors, tone_of_voice, tagline")
      .eq("unit_id", unit_id)
      .maybeSingle();

    const brandColors = brand?.colors ? JSON.stringify(brand.colors) : "";
    const brandStyle = brand?.tone_of_voice || "";

    const imagePrompt = `Generate a professional Instagram post image for a restaurant/food business. 
The image should be vibrant, appetizing, and ready to post. 
Style: modern food photography, clean composition, warm lighting.
${brandColors ? `Brand color palette for accents/props: ${brandColors}.` : ""}
${brandStyle ? `Brand personality: ${brandStyle}.` : ""}
DO NOT include any text overlay on the image.
Subject: ${prompt}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [{ role: "user", content: imagePrompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const errText = await response.text();
      console.error("Image generation error:", response.status, errText);
      throw new Error("Image generation failed");
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) throw new Error("No image generated");

    // Extract base64 data and upload to storage
    const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
    const imageBytes = decode(base64Data);

    const fileName = `${unit_id}/ai-${Date.now()}.png`;
    const { error: uploadError } = await supabase.storage
      .from("marketing-media")
      .upload(fileName, imageBytes, { contentType: "image/png" });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(JSON.stringify({ image_url: imageUrl, storage: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: publicUrlData } = supabase.storage.from("marketing-media").getPublicUrl(fileName);

    return new Response(JSON.stringify({ image_url: publicUrlData.publicUrl, storage: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("marketing-generate-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
