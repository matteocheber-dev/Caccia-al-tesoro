// Proxy verso Overpass API (ricerca luoghi OpenStreetMap).
// Le chiamate dirette dal browser vengono bloccate da CORS/filtri anti-bot
// sui server pubblici di Overpass; passando da qui (server-to-server) il
// problema non si presenta.
const ENDPOINTS = [
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass-api.de/api/interpreter",
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

    let lastError = "Nessun server Overpass raggiungibile";
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
          lastError = `HTTP ${res.status} da ${endpoint}`;
          continue;
        }
        const data = await res.json();
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch (e) {
        lastError = e && e.message ? e.message : String(e);
      }
    }
    return new Response(JSON.stringify({ error: lastError }), { status: 502 });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e && e.message ? e.message : e) }), { status: 500 });
  }
};
