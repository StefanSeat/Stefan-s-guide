// Pretvara kratki Google Maps link sa telefona (maps.app.goo.gl/...) u pun link sa nazivom i koordinatama.
// Browser to ne može sam zbog zaštite između sajtova, pa ovo radi na Supabase serveru.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { url } = await req.json();
    if (typeof url !== "string" || !/^https:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps)\//.test(url)) {
      return new Response(JSON.stringify({ error: "Nije kratki Google Maps link" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }
    let current = url;
    for (let i = 0; i < 6; i++) {
      const res = await fetch(current, { redirect: "manual" });
      const next = res.headers.get("location");
      if (!next) break;
      current = new URL(next, current).toString();
      if (/^https:\/\/(www\.)?google\.[a-z.]+\/maps\//.test(current)) break;
    }
    return new Response(JSON.stringify({ url: current }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (_e) {
    return new Response(JSON.stringify({ error: "Link nije mogao da se otvori" }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
