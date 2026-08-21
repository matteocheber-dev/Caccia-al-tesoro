// Proxy verso Overpass API (ricerca luoghi OpenStreetMap).
// Le chiamate dirette dal browser vengono bloccate da CORS/filtri anti-bot
// sui server pubblici di Overpass; passando da qui (server-to-server) il
// problema non si presenta. I tre mirror vengono provati IN PARALLELO
// (non in fila) perché Netlify interrompe una funzione dopo ~10 secondi:
// tentativi in sequenza rischiano di superare quel limite e restituire
// una risposta vuota invece di un errore leggibile.
const ENDPOINTS = [
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

async function tryEndpoint(endpoint, query) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json, /",
      },
      body: "data=" + encodeURIComponent(query),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) {
      const bodyText = await res.text();
      throw new Error(HTTP ${res.status}: ${bodyText.slice(0, 200)});
    }
    return await res.json();
  } catch (e) {
    clearTimeout(t);
    throw new Error(${endpoint} -> ${e && e.message ? e.message : String(e)});
  }
}

export default async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Metodo non consentito" }), { status: 405 });
  }

  try {
    const { query } = await req.json();
    if (!query) {
      return new Response(JSON.stringify({ error: "Query mancante" }), { status: 400 });
    }

    const results = await Promise.allSettled(ENDPOINTS.map((ep) => tryEndpoint(ep, query)));
    const success = results.find((r) => r.status === "fulfilled");
    if (success) {
      return new Response(JSON.stringify(success.value), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    const attempts = results.map((r) => r.reason?.message || String(r.reason));
    return new Response(JSON.stringify({ error: "Tutti i server Overpass hanno rifiutato la richiesta", attempts }), { status: 502 });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e && e.message ? e.message : e) }), { status: 500 });
  }
};
