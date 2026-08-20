
// Proxy verso Overpass API (ricerca luoghi OpenStreetMap).
// Le chiamate dirette dal browser vengono bloccate da CORS/filtri anti-bot
// sui server pubblici di Overpass; passando da qui (server-to-server) il
// problema non si presenta.
const ENDPOINTS = [
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

export default async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Metodo non consentito" }), { status: 405 });
  }

  try {
    const { query } = await req.json();
    if (!query) {
      return new Response(JSON.stringify({ error: "Query mancante" }), { status: 400 });
    }

    let attempts = [];
    for (const endpoint of ENDPOINTS) {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json, */*",
          },
          body: "data=" + encodeURIComponent(query),
        });
        if (!res.ok) {
          const bodyText = await res.text();
          attempts.push(`${endpoint} -> HTTP ${res.status}: ${bodyText.slice(0, 200)}`);
          continue;
        }
        const data = await res.json();
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch (e) {
        attempts.push(`${endpoint} -> ${e && e.message ? e.message : String(e)}`);
      }
    }
    return new Response(JSON.stringify({ error: "Tutti i server Overpass hanno rifiutato la richiesta", attempts }), { status: 502 });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e && e.message ? e.message : e) }), { status: 500 });
  }
};
