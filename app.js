import React, { useState, useEffect, useRef, useCallback } from "react";
import { Footprints, Bike, Car, Anchor, Compass, Camera, MapPin, Trophy, ChevronLeft, Loader2, Check, X, Lock, Sparkles, RotateCcw, Award, Target, Landmark, Clock, Palette, TreePine, UtensilsCrossed, FlaskConical, Users, Info, ExternalLink, Search, PartyPopper, LogOut, Mail, KeyRound, UserPlus, Star, Share2 } from "lucide-react";
import { supabase } from "./supabase-client.js";

/* ---------------------------------------------------------------
   PALETTE & COSTANTI — "Diario di spedizione"
------------------------------------------------------------------*/
const C = {
  ink: "#1B2430",
  inkSoft: "#242E3D",
  parchment: "#EFE6D2",
  parchmentDark: "#E0D3B4",
  parchmentLine: "#C9B98F",
  brass: "#B08544",
  brassLight: "#D9AE66",
  moss: "#4A5D45",
  rust: "#A6503A",
  sage: "#8FA688",
  teal: "#3E6B6B",
  coral: "#E2734F",
  ink70: "rgba(27,36,48,0.7)",
  ink50: "rgba(27,36,48,0.5)"
};
const FONT_DISPLAY = "'Fraunces', serif";
const FONT_BODY = "'IBM Plex Sans', sans-serif";
const FONT_MONO = "'IBM Plex Mono', monospace";
const TRANSPORT = {
  piedi: {
    label: "A piedi",
    icon: Footprints,
    radius: 900,
    speed: 70,
    note: "raggio breve"
  },
  bici: {
    label: "Bici",
    icon: Bike,
    radius: 3000,
    speed: 230,
    note: "raggio medio"
  },
  auto: {
    label: "Auto / Moto",
    icon: Car,
    radius: 9000,
    speed: 500,
    note: "raggio ampio"
  },
  barca: {
    label: "Barca",
    icon: Anchor,
    radius: 5000,
    speed: 170,
    note: "raggio costiero"
  }
};
const DIFFICULTY = {
  facile: {
    label: "Facile",
    count: 6,
    unlock: 45,
    mult: 1,
    badge: C.sage,
    style: "diretto: quasi rivela il nome e la categoria del luogo, tono amichevole"
  },
  media: {
    label: "Media",
    count: 5,
    unlock: 22,
    mult: 1.6,
    badge: C.brass,
    style: "indiretto: allude a una curiosità storica o a un dettaglio riconoscibile, senza mai dire il nome esplicito"
  },
  difficile: {
    label: "Difficile",
    count: 4,
    unlock: 10,
    mult: 2.6,
    badge: C.rust,
    style: "criptico: un vero indovinello in due righe, gioca con doppi sensi, non nomina categoria né nome"
  }
};
const TIME_OPTIONS = [{
  key: "30",
  label: "30 min",
  minutes: 30
}, {
  key: "60",
  label: "1 ora",
  minutes: 60
}, {
  key: "120",
  label: "2 ore",
  minutes: 120
}, {
  key: "240",
  label: "Mezza giornata",
  minutes: 240
}, {
  key: "480",
  label: "Giornata intera",
  minutes: 480
}];
const TOURISM_UNLOCK = 35;
const TOURISM_CLUE_STYLE = "diretto e invitante, da guida turistica appassionata: 1-2 frasi che descrivono cosa cercare e perché vale la pena, puoi citare la categoria ma MAI il nome esatto del luogo";
const KIDS_MAX_STOPS = 4;
const KIDS_UNLOCK = 55;
const KIDS_CLUE_STYLE = "per bambini di 5-10 anni: frasi cortissime, allegre e un po' buffe, come un indovinello da caccia al tesoro dei pirati o degli esploratori, parole semplici, magari una rima, zero riferimenti storici o date complicate";
const TOURISM_TYPES = {
  arte: {
    label: "Arte & Storia",
    icon: Palette,
    visitTime: 18,
    fragments: [(R, LA, LO) => `node["tourism"~"museum|artwork|gallery"](around:${R},${LA},${LO});`, (R, LA, LO) => `node["historic"](around:${R},${LA},${LO});`]
  },
  natura: {
    label: "Natura",
    icon: TreePine,
    visitTime: 20,
    fragments: [(R, LA, LO) => `node["natural"~"peak|water|wood|beach"](around:${R},${LA},${LO});`, (R, LA, LO) => `node["leisure"~"park|garden|nature_reserve"]["name"](around:${R},${LA},${LO});`]
  },
  enogastronomico: {
    label: "Enogastronomia",
    icon: UtensilsCrossed,
    visitTime: 28,
    fragments: [(R, LA, LO) => `node["amenity"~"restaurant|cafe|winery|marketplace"]["name"](around:${R},${LA},${LO});`, (R, LA, LO) => `node["shop"~"wine|deli|bakery|farm"]["name"](around:${R},${LA},${LO});`, (R, LA, LO) => `node["craft"="winery"](around:${R},${LA},${LO});`]
  },
  scienza: {
    label: "Scienza",
    icon: FlaskConical,
    visitTime: 20,
    fragments: [(R, LA, LO) => `node["tourism"="museum"](around:${R},${LA},${LO});`, (R, LA, LO) => `node["amenity"="university"]["name"](around:${R},${LA},${LO});`, (R, LA, LO) => `node["tourism"="attraction"]["name"~"scienza|tecnolog|planetario",i](around:${R},${LA},${LO});`]
  },
  autoctono: {
    label: "Vivi la città",
    icon: Users,
    visitTime: 15,
    fragments: [(R, LA, LO) => `node["amenity"~"marketplace|cafe|pub|bar"]["name"](around:${R},${LA},${LO});`, (R, LA, LO) => `node["shop"~"bakery|deli|butcher|greengrocer"]["name"](around:${R},${LA},${LO});`, (R, LA, LO) => `node["craft"]["name"](around:${R},${LA},${LO});`]
  }
};
const GIOCO_FRAGMENTS = [(R, LA, LO) => `node["tourism"~"attraction|museum|artwork|viewpoint"](around:${R},${LA},${LO});`, (R, LA, LO) => `node["historic"](around:${R},${LA},${LO});`, (R, LA, LO) => `node["amenity"="fountain"](around:${R},${LA},${LO});`, (R, LA, LO) => `node["amenity"="place_of_worship"]["name"](around:${R},${LA},${LO});`, (R, LA, LO) => `node["natural"~"peak|water"](around:${R},${LA},${LO});`, (R, LA, LO) => `node["leisure"="park"]["name"](around:${R},${LA},${LO});`];

/* ---------------------------------------------------------------
   UTILITY GEOGRAFICHE
------------------------------------------------------------------*/
function toRad(d) {
  return d * Math.PI / 180;
}
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
function bearing(lat1, lon1, lat2, lon2) {
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
  return Math.atan2(y, x) * 180 / Math.PI + 360;
}
function compassLabel(deg) {
  const dirs = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
  return dirs[Math.round(deg % 360 / 45) % 8];
}
function fmtDist(m) {
  if (m == null) return "—";
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}
function categoryLabel(tags) {
  if (!tags) return "luogo particolare";
  if (tags.tourism === "museum") return "museo";
  if (tags.tourism === "artwork") return "opera d'arte";
  if (tags.tourism === "gallery") return "galleria d'arte";
  if (tags.tourism === "viewpoint") return "punto panoramico";
  if (tags.tourism === "attraction") return "attrazione";
  if (tags.historic === "castle") return "castello";
  if (tags.historic === "monument") return "monumento";
  if (tags.historic === "memorial") return "memoriale";
  if (tags.historic === "ruins") return "rovine";
  if (tags.historic) return "sito storico";
  if (tags.amenity === "fountain") return "fontana";
  if (tags.amenity === "place_of_worship") return "luogo di culto";
  if (tags.amenity === "restaurant") return "ristorante";
  if (tags.amenity === "cafe") return "caffè";
  if (tags.amenity === "marketplace") return "mercato";
  if (tags.amenity === "pub") return "pub";
  if (tags.amenity === "bar") return "locale tipico";
  if (tags.amenity === "university") return "università";
  if (tags.shop === "wine") return "enoteca";
  if (tags.shop === "deli") return "gastronomia";
  if (tags.shop === "bakery") return "panetteria";
  if (tags.shop === "farm") return "azienda agricola";
  if (tags.shop === "butcher") return "macelleria";
  if (tags.shop === "greengrocer") return "fruttivendolo";
  if (tags.craft === "winery") return "cantina";
  if (tags.craft) return "bottega artigiana";
  if (tags.natural === "peak") return "vetta";
  if (tags.natural === "water") return "specchio d'acqua";
  if (tags.natural === "wood") return "bosco";
  if (tags.natural === "beach") return "spiaggia";
  if (tags.leisure === "park") return "parco";
  if (tags.leisure === "garden") return "giardino";
  if (tags.leisure === "nature_reserve") return "riserva naturale";
  return "luogo particolare";
}

/* ---------------------------------------------------------------
   OVERPASS API — punti di interesse reali nei dintorni
------------------------------------------------------------------*/
function buildOverpassQuery(fragments, radius, lat, lon) {
  const body = fragments.map(f => f(radius, lat, lon)).join("\n      ");
  return `[out:json][timeout:25];(\n      ${body}\n    );out body 40;`;
}
async function fetchPOIs(lat, lon, radius, fragments) {
  const query = buildOverpassQuery(fragments, radius, lat, lon);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 25000);
  try {
    const res = await fetch("/.netlify/functions/overpass", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query
      }),
      signal: ctrl.signal
    });
    clearTimeout(t);
    if (!res.ok) throw new Error("Overpass proxy error " + res.status);
    const data = await res.json();
    return (data.elements || []).filter(el => el.tags && el.tags.name).map(el => ({
      id: String(el.id),
      name: el.tags.name,
      lat: el.lat,
      lon: el.lon,
      tags: el.tags,
      category: categoryLabel(el.tags)
    }));
  } catch (e) {
    clearTimeout(t);
    throw e;
  }
}
function computeTourismPlan(transportKey, minutes, visitTime) {
  const speed = TRANSPORT[transportKey].speed; // metri al minuto
  const travelAlloc = Math.min(minutes * 0.3, 120);
  const radius = Math.max(400, Math.round(speed * travelAlloc));
  const stops = Math.max(2, Math.min(8, Math.round(minutes / (visitTime + 15))));
  return {
    radius,
    stops
  };
}

/* ---------------------------------------------------------------
   CHIAMATE A CLAUDE — indizi + verifica foto + schede informative
------------------------------------------------------------------*/
async function claudeMessages(content, extra = {}) {
  const res = await fetch("/.netlify/functions/claude", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      content,
      ...extra
    })
  });
  const data = await res.json();
  const textBlock = (data.content || []).find(b => b.type === "text");
  return textBlock ? textBlock.text : "";
}
function stripFences(s) {
  return s.replace(/```json/gi, "").replace(/```/g, "").trim();
}
async function generateClues(targets, styleText, fallbackFn) {
  const list = targets.map(t => ({
    id: t.id,
    nome: t.name,
    categoria: t.category
  }));
  const prompt = `Sei l'autore degli indizi per un'app di esplorazione urbana in Italia.
Per ciascun luogo scrivi un indizio in italiano, in stile "${styleText}".
L'indizio deve stare in 1-2 frasi brevi, tono da diario di esploratore, MAI banale.
Luoghi (JSON): ${JSON.stringify(list)}

Rispondi SOLO con un array JSON valido, senza testo introduttivo e senza blocchi markdown, in questo formato esatto:
[{"id":"...","clue":"..."}]`;
  try {
    const raw = await claudeMessages(prompt);
    const parsed = JSON.parse(stripFences(raw));
    const map = {};
    parsed.forEach(p => map[p.id] = p.clue);
    return targets.map(t => ({
      ...t,
      clue: map[t.id] || fallbackFn(t)
    }));
  } catch (e) {
    return targets.map(t => ({
      ...t,
      clue: fallbackFn(t)
    }));
  }
}
function fallbackClueGioco(t, difficultyKey) {
  if (difficultyKey === "facile") return `Cerca ${t.category}: ${t.name}. Non è lontano, tieni gli occhi aperti.`;
  if (difficultyKey === "media") return `Nei dintorni si nasconde ${t.category}. Chi lo trova saprà perché è degno di nota.`;
  return `Un ${t.category} attende chi sa guardare oltre l'ovvio. Nessun altro dettaglio: fidati della bussola.`;
}
function fallbackClueTurismo(t) {
  return `Poco distante trovi ${t.category} che vale la tappa: lasciati guidare dalla bussola.`;
}
function fallbackClueKids(t) {
  return `Shhh! Vicino a te si nasconde un tesoro: ${t.category}! Segui la bussola magica e vai a scoprirlo!`;
}
async function verifyPhoto(base64, mediaType, target, kidsMode) {
  const tono = kidsMode ? "Il messaggio deve essere entusiasta e festoso, adatto a un bambino piccolo, con una emoji, come se un pirata esploratore facesse i complimenti." : "breve commento incoraggiante in italiano, massimo una frase.";
  const prompt = `Stai giudicando una prova fotografica in un'app di esplorazione geolocalizzata${kidsMode ? " pensata per bambini, da fare insieme a un genitore" : ""}.
Il giocatore doveva fotografare: "${target.name}" (categoria: ${target.category}).
Guarda la foto e sii clemente: se mostra plausibilmente quel luogo/oggetto o qualcosa di coerente con la categoria, anche in modo approssimativo, considera la prova valida.
Rispondi SOLO con JSON valido, nessun testo extra, in questo formato:
{"trovato": true/false, "messaggio": "${tono}"}`;
  try {
    const raw = await claudeMessages([{
      type: "image",
      source: {
        type: "base64",
        media_type: mediaType,
        data: base64
      }
    }, {
      type: "text",
      text: prompt
    }]);
    const parsed = JSON.parse(stripFences(raw));
    return {
      trovato: !!parsed.trovato,
      messaggio: parsed.messaggio || ""
    };
  } catch (e) {
    return {
      trovato: true,
      messaggio: kidsMode ? "Tesoro registrato! 🎉" : "Prova registrata (verifica automatica non disponibile)."
    };
  }
}
async function fetchPlaceInfo(target, kidsMode) {
  const wiki = target.tags.wikipedia;
  if (!kidsMode && wiki && wiki.includes(":")) {
    try {
      const idx = wiki.indexOf(":");
      const lang = wiki.slice(0, idx).trim();
      const title = wiki.slice(idx + 1).trim();
      const res = await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.extract) {
          return {
            text: data.extract,
            source: "wikipedia",
            url: data.content_urls?.desktop?.page
          };
        }
      }
    } catch (e) {/* prosegue col fallback */}
  }
  try {
    const prompt = kidsMode ? `Scrivi una curiosità brevissima e divertente (massimo 2 frasi semplicissime) su questo luogo, per un bambino di 5-10 anni, tipo "Lo sapevi che...". Parole facili, tono giocoso, niente date o numeri complicati.
Nome: ${target.name}
Categoria: ${target.category}
Rispondi SOLO con il testo, nessun titolo, nessun markdown.` : `Scrivi una breve scheda informativa in italiano (massimo 4 frasi) su questo luogo, per un turista curioso, tono da guida locale appassionata. Non inventare date o numeri precisi se non ne sei certo, resta su informazioni generali plausibili.
Nome: ${target.name}
Categoria: ${target.category}
Rispondi SOLO con il testo della scheda, nessun titolo, nessun markdown.`;
    const text = await claudeMessages(prompt);
    return {
      text: text.trim(),
      source: "ai"
    };
  } catch (e) {
    return {
      text: "Informazioni non disponibili al momento.",
      source: "none"
    };
  }
}
async function geocodeAddress(query) {
  let err1 = null;
  let err2 = null;
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=it&q=${encodeURIComponent(query)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon),
          label: data[0].display_name
        };
      }
      err1 = "nessun risultato";
    } else {
      err1 = `HTTP ${res.status}`;
    }
  } catch (e) {
    err1 = e && e.message ? e.message : "errore di rete";
  }
  try {
    const res2 = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1&lang=it`);
    if (res2.ok) {
      const data2 = await res2.json();
      const feature = data2.features && data2.features[0];
      if (feature) {
        const [lon, lat] = feature.geometry.coordinates;
        const p = feature.properties || {};
        const label = [p.name, p.city, p.state, p.country].filter(Boolean).join(", ") || query;
        return {
          lat,
          lon,
          label
        };
      }
      err2 = "nessun risultato";
    } else {
      err2 = `HTTP ${res2.status}`;
    }
  } catch (e) {
    err2 = e && e.message ? e.message : "errore di rete";
  }
  throw new Error(`Nominatim: ${err1} · Photon: ${err2}`);
}
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result.split(",")[1]);
    r.onerror = () => reject(new Error("Lettura file fallita"));
    r.readAsDataURL(file);
  });
}

/* ---------------------------------------------------------------
   COMPONENTI DI SUPPORTO GRAFICO
------------------------------------------------------------------*/
function ContourBackground() {
  return /*#__PURE__*/React.createElement("svg", {
    style: {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      opacity: 0.06,
      pointerEvents: "none"
    },
    viewBox: "0 0 400 800",
    preserveAspectRatio: "xMidYMid slice"
  }, [60, 110, 160, 210, 260].map((r, i) => /*#__PURE__*/React.createElement("ellipse", {
    key: i,
    cx: 200 + (i % 2 === 0 ? -40 : 60),
    cy: 150 + i * 140,
    rx: r,
    ry: r * 0.6,
    fill: "none",
    stroke: C.parchment,
    strokeWidth: "1.5"
  })));
}
function StampBadge({
  children,
  color
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: FONT_MONO,
      fontSize: 11,
      letterSpacing: 1,
      textTransform: "uppercase",
      color,
      border: `1.5px solid ${color}`,
      borderRadius: 999,
      padding: "3px 10px"
    }
  }, children);
}
function CompassDial({
  bearingDeg,
  size = 96
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width: size,
      height: size
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 100 100"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "50",
    cy: "50",
    r: "47",
    fill: C.parchment,
    stroke: C.brass,
    strokeWidth: "2"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "50",
    cy: "50",
    r: "40",
    fill: "none",
    stroke: C.brassLight,
    strokeWidth: "1"
  }), ["N", "E", "S", "O"].map((d, i) => {
    const ang = i * 90;
    const rad = toRad(ang - 90);
    const x = 50 + 34 * Math.cos(rad);
    const y = 50 + 34 * Math.sin(rad);
    return /*#__PURE__*/React.createElement("text", {
      key: d,
      x: x,
      y: y + 3,
      fontSize: "9",
      fontFamily: FONT_MONO,
      fill: C.ink70,
      textAnchor: "middle"
    }, d);
  }), /*#__PURE__*/React.createElement("g", {
    style: {
      transform: `rotate(${bearingDeg}deg)`,
      transformOrigin: "50px 50px",
      transition: "transform 0.6s ease-out"
    }
  }, /*#__PURE__*/React.createElement("polygon", {
    points: "50,14 44,52 50,46 56,52",
    fill: C.rust
  }), /*#__PURE__*/React.createElement("polygon", {
    points: "50,86 44,54 50,60 56,54",
    fill: C.ink70
  })), /*#__PURE__*/React.createElement("circle", {
    cx: "50",
    cy: "50",
    r: "4",
    fill: C.brass
  })));
}

/* ---------------------------------------------------------------
   APP PRINCIPALE
------------------------------------------------------------------*/
export default function App() {
  const [session, setSession] = useState(undefined); // undefined = in caricamento, null = non loggato
  const [authView, setAuthView] = useState("login"); // login | signup
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authUsername, setAuthUsername] = useState("");
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [mode, setMode] = useState("gioco"); // gioco | turismo
  const [screen, setScreen] = useState("setup"); // setup | list | active | summary | leaderboard
  const [transportKey, setTransportKey] = useState("piedi");
  const [difficultyKey, setDifficultyKey] = useState("facile");
  const [tourismTypeKey, setTourismTypeKey] = useState("arte");
  const [timeKey, setTimeKey] = useState("60");
  const [kidsMode, setKidsMode] = useState(false);
  const [locError, setLocError] = useState(null);
  const [position, setPosition] = useState(null);
  const [positionSource, setPositionSource] = useState(null); // 'gps' | 'manual'
  const [showManualLocation, setShowManualLocation] = useState(false);
  const [manualQuery, setManualQuery] = useState("");
  const [manualLat, setManualLat] = useState("");
  const [manualLon, setManualLon] = useState("");
  const [manualLabel, setManualLabel] = useState(null);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState(null);
  const watchIdRef = useRef(null);
  const [loadingHunt, setLoadingHunt] = useState(false);
  const [huntError, setHuntError] = useState(null);
  const [targets, setTargets] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [score, setScore] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [showStamp, setShowStamp] = useState(false);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const fileInputRef = useRef(null);
  const [sessionRowId, setSessionRowId] = useState(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const playerName = session?.user?.user_metadata?.username || session?.user?.email || (session?.user?.is_anonymous ? `Ospite-${session.user.id.slice(0, 4)}` : "");

  /* sessione Supabase: recupero quella esistente + ascolto i cambi (login/logout) */
  useEffect(() => {
    supabase.auth.getSession().then(({
      data
    }) => setSession(data.session));
    const {
      data: listener
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);
  async function handleAuthSubmit(e) {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      if (authView === "signup") {
        if (!authUsername.trim()) throw new Error("Scegli un nome esploratore.");
        const {
          error
        } = await supabase.auth.signUp({
          email: authEmail.trim(),
          password: authPassword,
          options: {
            data: {
              username: authUsername.trim()
            }
          }
        });
        if (error) throw error;
      } else {
        const {
          error
        } = await supabase.auth.signInWithPassword({
          email: authEmail.trim(),
          password: authPassword
        });
        if (error) throw error;
      }
    } catch (err) {
      setAuthError(err.message || "Qualcosa è andato storto. Riprova.");
    } finally {
      setAuthLoading(false);
    }
  }
  async function handleLogout() {
    await supabase.auth.signOut();
    setScreen("setup");
  }
  async function handleGuestLogin() {
    setAuthError(null);
    setAuthLoading(true);
    try {
      const {
        error
      } = await supabase.auth.signInAnonymously();
      if (error) throw error;
    } catch (err) {
      setAuthError(err.message || "Accesso come ospite non riuscito. Riprova.");
    } finally {
      setAuthLoading(false);
    }
  }
  useEffect(() => {
    if (screen !== "list" && screen !== "active") return;
    if (positionSource === "manual") return; // posizione fissa, nessun aggiornamento GPS
    if (!navigator.geolocation) {
      setLocError("Geolocalizzazione non supportata su questo dispositivo.");
      return;
    }
    watchIdRef.current = navigator.geolocation.watchPosition(pos => {
      setPosition({
        lat: pos.coords.latitude,
        lon: pos.coords.longitude
      });
      setLocError(null);
    }, err => setLocError("Impossibile accedere alla posizione: " + err.message), {
      enableHighAccuracy: true,
      maximumAge: 3000,
      timeout: 15000
    });
    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [screen, positionSource]);

  /* classifica su database condiviso (tabella "scores" con RLS: chiunque legge, ognuno scrive solo il proprio punteggio) */
  const saveScore = useCallback(async finalScore => {
    if (!session || finalScore <= 0) return;
    try {
      const {
        data: existing
      } = await supabase.from("scores").select("score").eq("user_id", session.user.id).maybeSingle();
      if (!existing || finalScore > existing.score) {
        await supabase.from("scores").upsert({
          user_id: session.user.id,
          username: playerName,
          score: finalScore,
          difficulty: difficultyKey,
          updated_at: new Date().toISOString()
        });
      }
    } catch (e) {/* la classifica è un bonus, non blocca il gioco */}
  }, [session, playerName, difficultyKey]);
  const loadLeaderboard = useCallback(async () => {
    try {
      const {
        data,
        error
      } = await supabase.from("scores").select("username, score").order("score", {
        ascending: false
      }).limit(50);
      if (error) throw error;
      setLeaderboard(data || []);
    } catch (e) {
      setLeaderboard([]);
    }
  }, []);

  /* analytics leggere: quante spedizioni si iniziano, quante si finiscono, quali modalità si usano */
  const logSessionStart = useCallback(async targetCount => {
    if (!session) return;
    try {
      const {
        data,
        error
      } = await supabase.from("sessions").insert({
        user_id: session.user.id,
        mode,
        sub_type: mode === "gioco" ? difficultyKey : tourismTypeKey,
        transport: transportKey,
        kids_mode: kidsMode,
        target_count: targetCount
      }).select("id").single();
      if (error) throw error;
      setSessionRowId(data.id);
    } catch (e) {
      setSessionRowId(null);
    }
  }, [session, mode, difficultyKey, tourismTypeKey, transportKey, kidsMode]);
  const logSessionComplete = useCallback(async targetsFound => {
    if (!sessionRowId) return;
    try {
      await supabase.from("sessions").update({
        completed_at: new Date().toISOString(),
        targets_found: targetsFound
      }).eq("id", sessionRowId);
    } catch (e) {/* non blocca il gioco */}
  }, [sessionRowId]);
  const submitFeedback = useCallback(async () => {
    if (!session || feedbackRating === 0) return;
    setFeedbackSubmitting(true);
    try {
      await supabase.from("feedback").insert({
        user_id: session.user.id,
        mode,
        rating: feedbackRating,
        comment: feedbackComment.trim() || null
      });
      setFeedbackSubmitted(true);
    } catch (e) {
      /* se fallisce, l'utente può comunque continuare a usare l'app */
    } finally {
      setFeedbackSubmitting(false);
    }
  }, [session, mode, feedbackRating, feedbackComment]);
  const logSearchError = useCallback(async (errorType, lat, lon) => {
    if (!session) return;
    try {
      await supabase.from("search_errors").insert({
        user_id: session.user.id,
        mode,
        sub_type: mode === "gioco" ? difficultyKey : tourismTypeKey,
        transport: transportKey,
        lat,
        lon,
        error_type: errorType
      });
    } catch (e) {/* non blocca il gioco */}
  }, [session, mode, difficultyKey, tourismTypeKey, transportKey]);
  async function handleShare() {
    const shareData = {
      title: "Diario di Spedizione",
      text: "Vieni a esplorare la città con me su Diario di Spedizione!",
      url: window.location.href
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareData.url);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      }
    } catch (e) {/* l'utente ha annullato la condivisione: nessun problema */}
  }
  async function runSearch(lat, lon) {
    try {
      let pool, withClues;
      if (mode === "gioco") {
        const radius = TRANSPORT[transportKey].radius;
        const pois = await fetchPOIs(lat, lon, radius, GIOCO_FRAGMENTS);
        if (pois.length === 0) throw {
          empty: true
        };
        const withDist = pois.map(p => ({
          ...p,
          dist: haversine(lat, lon, p.lat, p.lon)
        })).sort((a, b) => a.dist - b.dist);
        const count = kidsMode ? Math.min(DIFFICULTY[difficultyKey].count, KIDS_MAX_STOPS) : DIFFICULTY[difficultyKey].count;
        if (difficultyKey === "facile" || kidsMode) pool = withDist.slice(0, count);else if (difficultyKey === "media") pool = withDist.slice(Math.min(2, withDist.length - 1)).slice(0, count);else pool = withDist.slice(Math.max(0, withDist.length - count));
        const clueStyle = kidsMode ? KIDS_CLUE_STYLE : DIFFICULTY[difficultyKey].style;
        const fallback = kidsMode ? fallbackClueKids : t => fallbackClueGioco(t, difficultyKey);
        withClues = await generateClues(pool, clueStyle, fallback);
      } else {
        const type = TOURISM_TYPES[tourismTypeKey];
        const timeOpt = TIME_OPTIONS.find(t => t.key === timeKey);
        const {
          radius,
          stops
        } = computeTourismPlan(transportKey, timeOpt.minutes, type.visitTime);
        const pois = await fetchPOIs(lat, lon, radius, type.fragments);
        if (pois.length === 0) throw {
          empty: true
        };
        const withDist = pois.map(p => ({
          ...p,
          dist: haversine(lat, lon, p.lat, p.lon)
        })).sort((a, b) => a.dist - b.dist);
        const effectiveStops = kidsMode ? Math.min(stops, KIDS_MAX_STOPS) : stops;
        pool = withDist.slice(0, effectiveStops);
        const clueStyle = kidsMode ? KIDS_CLUE_STYLE : TOURISM_CLUE_STYLE;
        const fallback = kidsMode ? fallbackClueKids : fallbackClueTurismo;
        withClues = await generateClues(pool, clueStyle, fallback);
      }
      setTargets(withClues.map(t => ({
        ...t,
        found: false,
        photo: null,
        info: null
      })));
      setScore(0);
      setFeedbackRating(0);
      setFeedbackComment("");
      setFeedbackSubmitted(false);
      setScreen("list");
      logSessionStart(withClues.length);
    } catch (e) {
      if (e && e.empty) {
        setHuntError("Nessun luogo interessante trovato nel raggio scelto. Prova un mezzo con raggio più ampio, un altro tipo di turismo, oppure una posizione diversa.");
        logSearchError("empty", lat, lon);
      } else {
        setHuntError("Non riesco a raggiungere la mappa dei dintorni (Overpass). Controlla la connessione e riprova.");
        logSearchError("network", lat, lon);
      }
    } finally {
      setLoadingHunt(false);
    }
  }
  async function startExpedition() {
    setHuntError(null);
    setLoadingHunt(true);
    if (positionSource === "manual" && position) {
      runSearch(position.lat, position.lon);
      return;
    }
    if (!navigator.geolocation) {
      setHuntError("Il tuo browser non supporta la geolocalizzazione. Usa la ricerca manuale della posizione qui sotto.");
      setLoadingHunt(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(pos => {
      setPositionSource("gps");
      setPosition({
        lat: pos.coords.latitude,
        lon: pos.coords.longitude
      });
      runSearch(pos.coords.latitude, pos.coords.longitude);
    }, err => {
      setHuntError("Permesso di posizione negato o non disponibile. Se stai testando l'app dentro un'anteprima integrata, il browser spesso blocca il GPS: usa la ricerca manuale qui sotto per continuare.");
      setLoadingHunt(false);
    }, {
      enableHighAccuracy: true,
      timeout: 15000
    });
  }
  async function handleManualSearch() {
    if (!manualQuery.trim()) return;
    setGeocoding(true);
    setGeocodeError(null);
    try {
      const result = await geocodeAddress(manualQuery.trim());
      setPosition({
        lat: result.lat,
        lon: result.lon
      });
      setPositionSource("manual");
      setManualLabel(result.label);
      setLocError(null);
      setHuntError(null);
    } catch (e) {
      setGeocodeError(`Ricerca non riuscita (${e.message}). Prova a inserire le coordinate qui sotto invece.`);
    } finally {
      setGeocoding(false);
    }
  }
  function handleManualCoords() {
    const lat = parseFloat(String(manualLat).replace(",", "."));
    const lon = parseFloat(String(manualLon).replace(",", "."));
    if (Number.isNaN(lat) || Number.isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      setGeocodeError("Coordinate non valide. Usa il formato decimale, ad esempio 45.4642 e 9.1900 per Milano.");
      return;
    }
    setPosition({
      lat,
      lon
    });
    setPositionSource("manual");
    setManualLabel(`Coordinate ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
    setLocError(null);
    setHuntError(null);
    setGeocodeError(null);
  }
  function openTarget(id) {
    setActiveId(id);
    setVerifyResult(null);
    setScreen("active");
  }
  function triggerCamera() {
    fileInputRef.current?.click();
  }
  async function handlePhoto(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const target = targets.find(t => t.id === activeId);
    if (!target) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      const base64 = await fileToBase64(file);
      const mediaType = file.type || "image/jpeg";
      const result = await verifyPhoto(base64, mediaType, target, kidsMode);
      setVerifyResult(result);
      if (result.trovato) {
        const photoDataUrl = `data:${mediaType};base64,${base64}`;
        setTargets(prev => prev.map(t => t.id === activeId ? {
          ...t,
          found: true,
          photo: photoDataUrl
        } : t));
        setShowStamp(true);
        setTimeout(() => setShowStamp(false), 1400);
        if (mode === "gioco") {
          const pts = Math.round(100 * DIFFICULTY[difficultyKey].mult);
          setScore(s => {
            const newScore = s + pts;
            saveScore(newScore);
            return newScore;
          });
        } else {
          setLoadingInfo(true);
          const info = await fetchPlaceInfo(target, kidsMode);
          setTargets(prev => prev.map(t => t.id === activeId ? {
            ...t,
            info
          } : t));
          setLoadingInfo(false);
        }
      }
    } catch (err) {
      setVerifyResult({
        trovato: false,
        messaggio: "Errore nella lettura della foto. Riprova."
      });
    } finally {
      setVerifying(false);
    }
  }
  const activeTarget = targets.find(t => t.id === activeId);
  const distToActive = activeTarget && position ? haversine(position.lat, position.lon, activeTarget.lat, activeTarget.lon) : null;
  const bearingToActive = activeTarget && position ? bearing(position.lat, position.lon, activeTarget.lat, activeTarget.lon) : 0;
  const baseUnlock = mode === "gioco" ? DIFFICULTY[difficultyKey].unlock : TOURISM_UNLOCK;
  const unlockDist = kidsMode ? Math.max(baseUnlock, KIDS_UNLOCK) : baseUnlock;
  const canPhotograph = distToActive != null && distToActive <= unlockDist;
  const allFound = targets.length > 0 && targets.every(t => t.found);
  const foundCount = targets.filter(t => t.found).length;
  const globalFonts = /*#__PURE__*/React.createElement("style", null, `
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
      * { box-sizing: border-box; }
      @keyframes stampIn {
        0% { transform: scale(2.4) rotate(-18deg); opacity: 0; }
        60% { transform: scale(0.9) rotate(-8deg); opacity: 1; }
        100% { transform: scale(1) rotate(-8deg); opacity: 1; }
      }
      @keyframes riseIn { 0% { opacity: 0; transform: translateY(10px); } 100% { opacity: 1; transform: translateY(0); } }
      @keyframes spin { to { transform: rotate(360deg); } }
      .rise { animation: riseIn 0.45s ease-out both; }
      button:focus-visible, input:focus-visible { outline: 2px solid ${C.brassLight}; outline-offset: 2px; }
      @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
    `);
  if (session === undefined) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        minHeight: "100vh",
        background: C.ink,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: C.parchment,
        fontFamily: FONT_BODY
      }
    }, globalFonts, /*#__PURE__*/React.createElement(Loader2, {
      size: 26,
      style: {
        animation: "spin 1s linear infinite"
      }
    }));
  }
  if (!session) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        minHeight: "100vh",
        background: C.ink,
        fontFamily: FONT_BODY,
        color: C.parchment,
        position: "relative",
        overflow: "hidden"
      }
    }, globalFonts, /*#__PURE__*/React.createElement(ContourBackground, null), /*#__PURE__*/React.createElement("div", {
      style: {
        position: "relative",
        maxWidth: 480,
        margin: "0 auto",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "20px"
      }
    }, /*#__PURE__*/React.createElement(AuthScreen, {
      authView: authView,
      setAuthView: setAuthView,
      authEmail: authEmail,
      setAuthEmail: setAuthEmail,
      authPassword: authPassword,
      setAuthPassword: setAuthPassword,
      authUsername: authUsername,
      setAuthUsername: setAuthUsername,
      authError: authError,
      authLoading: authLoading,
      onSubmit: handleAuthSubmit,
      onGuestLogin: handleGuestLogin
    })));
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100vh",
      background: C.ink,
      fontFamily: FONT_BODY,
      color: C.parchment,
      position: "relative",
      overflow: "hidden"
    }
  }, globalFonts, /*#__PURE__*/React.createElement(ContourBackground, null), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      maxWidth: 480,
      margin: "0 auto",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement(TopBar, {
    screen: screen,
    mode: mode,
    score: score,
    foundCount: foundCount,
    totalCount: targets.length,
    playerName: playerName,
    onLogout: handleLogout,
    onBack: () => {
      if (screen === "active") setScreen("list");else if (screen === "leaderboard") setScreen(targets.length ? "list" : "setup");else if (screen === "summary") setScreen("list");
    },
    onLeaderboard: () => {
      loadLeaderboard();
      setScreen("leaderboard");
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      padding: "0 20px 32px"
    }
  }, screen === "setup" && /*#__PURE__*/React.createElement(SetupScreen, {
    mode: mode,
    setMode: setMode,
    playerName: playerName,
    transportKey: transportKey,
    setTransportKey: setTransportKey,
    difficultyKey: difficultyKey,
    setDifficultyKey: setDifficultyKey,
    tourismTypeKey: tourismTypeKey,
    setTourismTypeKey: setTourismTypeKey,
    timeKey: timeKey,
    setTimeKey: setTimeKey,
    onStart: startExpedition,
    loading: loadingHunt,
    error: huntError,
    kidsMode: kidsMode,
    setKidsMode: setKidsMode,
    positionSource: positionSource,
    manualLabel: manualLabel,
    showManualLocation: showManualLocation,
    setShowManualLocation: setShowManualLocation,
    manualQuery: manualQuery,
    setManualQuery: setManualQuery,
    manualLat: manualLat,
    setManualLat: setManualLat,
    manualLon: manualLon,
    setManualLon: setManualLon,
    geocoding: geocoding,
    geocodeError: geocodeError,
    onManualSearch: handleManualSearch,
    onManualCoords: handleManualCoords,
    onShare: handleShare,
    shareCopied: shareCopied
  }), screen === "list" && /*#__PURE__*/React.createElement(ListScreen, {
    mode: mode,
    kidsMode: kidsMode,
    targets: targets,
    position: position,
    locError: locError,
    onOpen: openTarget,
    difficultyKey: difficultyKey,
    allFound: allFound,
    onSummary: () => {
      logSessionComplete(foundCount);
      setScreen("summary");
    }
  }), screen === "active" && activeTarget && /*#__PURE__*/React.createElement(ActiveScreen, {
    mode: mode,
    kidsMode: kidsMode,
    target: activeTarget,
    dist: distToActive,
    bearingDeg: bearingToActive,
    unlock: unlockDist,
    canPhotograph: canPhotograph,
    verifying: verifying,
    verifyResult: verifyResult,
    loadingInfo: loadingInfo,
    onPhoto: triggerCamera,
    locError: locError
  }), screen === "summary" && /*#__PURE__*/React.createElement(SummaryScreen, {
    mode: mode,
    targets: targets,
    score: score,
    playerName: playerName,
    onLeaderboard: () => {
      loadLeaderboard();
      setScreen("leaderboard");
    },
    onRestart: () => setScreen("setup"),
    feedbackRating: feedbackRating,
    setFeedbackRating: setFeedbackRating,
    feedbackComment: feedbackComment,
    setFeedbackComment: setFeedbackComment,
    feedbackSubmitting: feedbackSubmitting,
    feedbackSubmitted: feedbackSubmitted,
    onSubmitFeedback: submitFeedback
  }), screen === "leaderboard" && /*#__PURE__*/React.createElement(LeaderboardScreen, {
    leaderboard: leaderboard,
    playerName: playerName
  }))), /*#__PURE__*/React.createElement("input", {
    ref: fileInputRef,
    type: "file",
    accept: "image/*",
    capture: "environment",
    style: {
      display: "none"
    },
    onChange: handlePhoto
  }), showStamp && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      pointerEvents: "none",
      zIndex: 50
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      animation: "stampIn 0.5s ease-out",
      border: `4px solid ${kidsMode ? C.coral : mode === "gioco" ? C.rust : C.teal}`,
      borderRadius: "50%",
      width: 140,
      height: 140,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transform: "rotate(-8deg)",
      background: kidsMode ? "rgba(226,115,79,0.14)" : mode === "gioco" ? "rgba(166,80,58,0.12)" : "rgba(62,107,107,0.14)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      color: kidsMode ? C.coral : mode === "gioco" ? C.rust : C.teal,
      fontFamily: FONT_DISPLAY,
      fontWeight: 700
    }
  }, kidsMode ? /*#__PURE__*/React.createElement(PartyPopper, {
    size: 30,
    style: {
      marginBottom: 2
    }
  }) : /*#__PURE__*/React.createElement(Check, {
    size: 30,
    style: {
      marginBottom: 2
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      letterSpacing: 1
    }
  }, kidsMode ? "EVVIVA!" : mode === "gioco" ? "TROVATO" : "SCOPERTO")))));
}

/* ---------------------------------------------------------------
   TOP BAR
------------------------------------------------------------------*/
function TopBar({
  screen,
  mode,
  score,
  foundCount,
  totalCount,
  playerName,
  onLogout,
  onBack,
  onLeaderboard
}) {
  const showBack = screen === "active" || screen === "summary" || screen === "leaderboard";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "18px 20px 10px",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 40,
      display: "flex"
    }
  }, showBack && /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    style: {
      background: "none",
      border: "none",
      color: C.parchment,
      cursor: "pointer",
      padding: 6
    }
  }, /*#__PURE__*/React.createElement(ChevronLeft, {
    size: 22
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: FONT_DISPLAY,
      fontSize: 16,
      fontWeight: 600,
      letterSpacing: 0.5,
      color: C.brassLight,
      textAlign: "center",
      flex: 1,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, screen === "setup" && playerName ? `Ciao, ${playerName}` : "Diario di Spedizione"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 4
    }
  }, mode === "gioco" ? /*#__PURE__*/React.createElement("button", {
    onClick: onLeaderboard,
    style: {
      background: "none",
      border: "none",
      color: C.parchment,
      cursor: "pointer",
      padding: 6,
      display: "flex",
      alignItems: "center",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement(Trophy, {
    size: 18,
    color: C.brassLight
  }), score > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: FONT_MONO,
      fontSize: 13
    }
  }, score)) : totalCount > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: FONT_MONO,
      fontSize: 12,
      color: C.teal,
      display: "flex",
      alignItems: "center",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement(MapPin, {
    size: 14
  }), " ", foundCount, "/", totalCount), screen === "setup" && /*#__PURE__*/React.createElement("button", {
    onClick: onLogout,
    title: "Esci",
    style: {
      background: "none",
      border: "none",
      color: C.parchmentDark,
      cursor: "pointer",
      padding: 6
    }
  }, /*#__PURE__*/React.createElement(LogOut, {
    size: 16
  }))));
}

/* ---------------------------------------------------------------
   SCHERMATA AUTENTICAZIONE (registrazione / accesso)
------------------------------------------------------------------*/
function AuthScreen({
  authView,
  setAuthView,
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
  authUsername,
  setAuthUsername,
  authError,
  authLoading,
  onSubmit,
  onGuestLogin
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "rise"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement(Compass, {
    size: 36,
    color: C.brassLight
  }), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: FONT_DISPLAY,
      fontSize: 24,
      fontWeight: 700,
      margin: "10px 0 4px"
    }
  }, "Diario di Spedizione"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: C.parchmentDark,
      fontSize: 13
    }
  }, authView === "signup" ? "Crea il tuo account da esploratore" : "Accedi per continuare l'esplorazione")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setAuthView("login"),
    style: {
      flex: 1,
      padding: "10px",
      borderRadius: 10,
      cursor: "pointer",
      textAlign: "center",
      border: `1.5px solid ${authView === "login" ? C.brassLight : C.parchmentLine}`,
      background: authView === "login" ? "rgba(217,174,102,0.15)" : "transparent",
      color: C.parchment,
      fontSize: 13,
      fontWeight: 600
    }
  }, "Accedi"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setAuthView("signup"),
    style: {
      flex: 1,
      padding: "10px",
      borderRadius: 10,
      cursor: "pointer",
      textAlign: "center",
      border: `1.5px solid ${authView === "signup" ? C.brassLight : C.parchmentLine}`,
      background: authView === "signup" ? "rgba(217,174,102,0.15)" : "transparent",
      color: C.parchment,
      fontSize: 13,
      fontWeight: 600
    }
  }, "Registrati")), /*#__PURE__*/React.createElement("form", {
    onSubmit: onSubmit
  }, authView === "signup" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("label", {
    style: {
      fontFamily: FONT_MONO,
      fontSize: 12,
      letterSpacing: 1,
      color: C.brassLight,
      textTransform: "uppercase"
    }
  }, "Nome esploratore"), /*#__PURE__*/React.createElement("input", {
    value: authUsername,
    onChange: e => setAuthUsername(e.target.value),
    placeholder: "Come apparirai in classifica",
    style: {
      width: "100%",
      marginTop: 6,
      marginBottom: 16,
      padding: "12px 14px",
      borderRadius: 10,
      border: `1.5px solid ${C.parchmentLine}`,
      background: C.parchment,
      color: C.ink,
      fontSize: 15,
      fontFamily: FONT_BODY
    }
  })), /*#__PURE__*/React.createElement("label", {
    style: {
      fontFamily: FONT_MONO,
      fontSize: 12,
      letterSpacing: 1,
      color: C.brassLight,
      textTransform: "uppercase"
    }
  }, "Email"), /*#__PURE__*/React.createElement("input", {
    type: "email",
    required: true,
    value: authEmail,
    onChange: e => setAuthEmail(e.target.value),
    placeholder: "tuonome@email.it",
    style: {
      width: "100%",
      marginTop: 6,
      marginBottom: 16,
      padding: "12px 14px",
      borderRadius: 10,
      border: `1.5px solid ${C.parchmentLine}`,
      background: C.parchment,
      color: C.ink,
      fontSize: 15,
      fontFamily: FONT_BODY
    }
  }), /*#__PURE__*/React.createElement("label", {
    style: {
      fontFamily: FONT_MONO,
      fontSize: 12,
      letterSpacing: 1,
      color: C.brassLight,
      textTransform: "uppercase"
    }
  }, "Password"), /*#__PURE__*/React.createElement("input", {
    type: "password",
    required: true,
    minLength: 6,
    value: authPassword,
    onChange: e => setAuthPassword(e.target.value),
    placeholder: "Almeno 6 caratteri",
    style: {
      width: "100%",
      marginTop: 6,
      marginBottom: 20,
      padding: "12px 14px",
      borderRadius: 10,
      border: `1.5px solid ${C.parchmentLine}`,
      background: C.parchment,
      color: C.ink,
      fontSize: 15,
      fontFamily: FONT_BODY
    }
  }), authError && /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(166,80,58,0.15)",
      border: `1px solid ${C.rust}`,
      color: "#E8B4A6",
      borderRadius: 10,
      padding: "10px 12px",
      fontSize: 13,
      marginBottom: 16
    }
  }, authError), authView === "signup" && !authError && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 11,
      color: C.parchmentDark,
      marginBottom: 16
    }
  }, "Dopo la registrazione, controlla la posta per confermare l'email prima di accedere (a seconda di come è configurato il progetto Supabase)."), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    disabled: authLoading,
    style: {
      width: "100%",
      padding: "15px",
      borderRadius: 12,
      border: "none",
      cursor: authLoading ? "default" : "pointer",
      background: C.brass,
      color: C.ink,
      fontFamily: FONT_DISPLAY,
      fontWeight: 700,
      fontSize: 16,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      opacity: authLoading ? 0.7 : 1
    }
  }, authLoading ? /*#__PURE__*/React.createElement(Loader2, {
    size: 18,
    style: {
      animation: "spin 1s linear infinite"
    }
  }) : authView === "signup" ? /*#__PURE__*/React.createElement(UserPlus, {
    size: 18
  }) : /*#__PURE__*/React.createElement(Mail, {
    size: 18
  }), authLoading ? "Un attimo…" : authView === "signup" ? "Crea account" : "Accedi")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      margin: "20px 0"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 1,
      background: C.parchmentLine,
      opacity: 0.3
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: C.parchmentDark,
      fontFamily: FONT_MONO,
      textTransform: "uppercase"
    }
  }, "oppure"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 1,
      background: C.parchmentLine,
      opacity: 0.3
    }
  })), /*#__PURE__*/React.createElement("button", {
    onClick: onGuestLogin,
    disabled: authLoading,
    style: {
      width: "100%",
      padding: "13px",
      borderRadius: 12,
      border: `1.5px solid ${C.parchmentLine}`,
      background: "transparent",
      color: C.parchmentDark,
      fontFamily: FONT_BODY,
      fontSize: 13,
      cursor: authLoading ? "default" : "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      opacity: authLoading ? 0.6 : 1
    }
  }, /*#__PURE__*/React.createElement(Sparkles, {
    size: 15
  }), " Continua come ospite (solo per prova)"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 11,
      color: C.parchmentDark,
      textAlign: "center",
      marginTop: 8
    }
  }, "Accesso istantaneo, nessun dato salvato in modo permanente: se esci o cambi dispositivo, questo account non si recupera."));
}

/* ---------------------------------------------------------------
   SCHERMATA SETUP
------------------------------------------------------------------*/
function SetupScreen({
  mode,
  setMode,
  playerName,
  transportKey,
  setTransportKey,
  difficultyKey,
  setDifficultyKey,
  tourismTypeKey,
  setTourismTypeKey,
  timeKey,
  setTimeKey,
  onStart,
  loading,
  error,
  kidsMode,
  setKidsMode,
  positionSource,
  manualLabel,
  showManualLocation,
  setShowManualLocation,
  manualQuery,
  setManualQuery,
  manualLat,
  setManualLat,
  manualLon,
  setManualLon,
  geocoding,
  geocodeError,
  onManualSearch,
  onManualCoords,
  onShare,
  shareCopied
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "rise"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      margin: "8px 0 20px"
    }
  }, /*#__PURE__*/React.createElement(Compass, {
    size: 36,
    color: C.brassLight
  }), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: FONT_DISPLAY,
      fontSize: 24,
      fontWeight: 700,
      margin: "10px 0 4px"
    }
  }, "La città come mappa da esplorare"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: C.parchmentDark,
      fontSize: 13,
      lineHeight: 1.5
    }
  }, "Monumenti, curiosità e angoli nascosti attorno a te, trasformati in indizi da scoprire.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setMode("gioco"),
    style: {
      flex: 1,
      padding: "12px 8px",
      borderRadius: 12,
      cursor: "pointer",
      textAlign: "center",
      border: `1.5px solid ${mode === "gioco" ? C.brassLight : C.parchmentLine}`,
      background: mode === "gioco" ? "rgba(217,174,102,0.15)" : "transparent",
      color: C.parchment,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Target, {
    size: 20,
    color: mode === "gioco" ? C.brassLight : C.parchmentDark
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 600
    }
  }, "Caccia al tesoro"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: C.parchmentDark
    }
  }, "indizi criptici, punti, classifica")), /*#__PURE__*/React.createElement("button", {
    onClick: () => setMode("turismo"),
    style: {
      flex: 1,
      padding: "12px 8px",
      borderRadius: 12,
      cursor: "pointer",
      textAlign: "center",
      border: `1.5px solid ${mode === "turismo" ? C.teal : C.parchmentLine}`,
      background: mode === "turismo" ? "rgba(62,107,107,0.18)" : "transparent",
      color: C.parchment,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Landmark, {
    size: 20,
    color: mode === "turismo" ? C.teal : C.parchmentDark
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 600
    }
  }, "Turismo"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: C.parchmentDark
    }
  }, "scopri e impara, senza sfida"))), /*#__PURE__*/React.createElement("button", {
    onClick: () => setKidsMode(v => !v),
    style: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "12px 14px",
      marginBottom: 22,
      borderRadius: 12,
      cursor: "pointer",
      textAlign: "left",
      border: `1.5px solid ${kidsMode ? C.coral : C.parchmentLine}`,
      background: kidsMode ? "rgba(226,115,79,0.16)" : "transparent"
    }
  }, /*#__PURE__*/React.createElement(PartyPopper, {
    size: 22,
    color: kidsMode ? C.coral : C.parchmentDark,
    style: {
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      color: kidsMode ? C.coral : C.parchment,
      fontSize: 13,
      fontWeight: 600
    }
  }, "Modalità Bambini"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      color: C.parchmentDark,
      fontSize: 11,
      marginTop: 2
    }
  }, "Indizi più semplici e giocosi, meno tappe, foto più facili da confermare — da fare insieme a un adulto")), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 40,
      height: 22,
      borderRadius: 999,
      flexShrink: 0,
      position: "relative",
      background: kidsMode ? C.coral : C.parchmentLine,
      transition: "background 0.2s"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: 2,
      left: kidsMode ? 20 : 2,
      width: 18,
      height: 18,
      borderRadius: "50%",
      background: C.parchment,
      transition: "left 0.2s"
    }
  }))), /*#__PURE__*/React.createElement("p", {
    style: {
      color: C.parchmentDark,
      fontSize: 13,
      marginBottom: 22
    }
  }, "Esploratore: ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: C.brassLight,
      fontWeight: 600
    }
  }, playerName)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: FONT_MONO,
      fontSize: 12,
      letterSpacing: 1,
      color: C.brassLight,
      textTransform: "uppercase",
      marginBottom: 8
    }
  }, "Come ti muovi?"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 10,
      marginBottom: 22
    }
  }, Object.entries(TRANSPORT).map(([key, t]) => {
    const Icon = t.icon;
    const active = key === transportKey;
    return /*#__PURE__*/React.createElement("button", {
      key: key,
      onClick: () => setTransportKey(key),
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        padding: "14px 8px",
        borderRadius: 12,
        cursor: "pointer",
        border: `1.5px solid ${active ? C.brassLight : C.parchmentLine}`,
        background: active ? "rgba(217,174,102,0.15)" : "transparent",
        color: C.parchment
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      size: 22,
      color: active ? C.brassLight : C.parchmentDark
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        fontWeight: 500
      }
    }, t.label), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        color: C.parchmentDark,
        textAlign: "center"
      }
    }, t.note));
  })), mode === "gioco" ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: FONT_MONO,
      fontSize: 12,
      letterSpacing: 1,
      color: C.brassLight,
      textTransform: "uppercase",
      marginBottom: 8
    }
  }, "Difficoltà"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginBottom: 26
    }
  }, Object.entries(DIFFICULTY).map(([key, d]) => {
    const active = key === difficultyKey;
    return /*#__PURE__*/React.createElement("button", {
      key: key,
      onClick: () => setDifficultyKey(key),
      style: {
        flex: 1,
        padding: "10px 6px",
        borderRadius: 10,
        cursor: "pointer",
        textAlign: "center",
        border: `1.5px solid ${active ? d.badge : C.parchmentLine}`,
        background: active ? `${d.badge}22` : "transparent",
        color: active ? d.badge : C.parchmentDark,
        fontFamily: FONT_MONO,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: 0.5
      }
    }, d.label);
  }))) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: FONT_MONO,
      fontSize: 12,
      letterSpacing: 1,
      color: C.teal,
      textTransform: "uppercase",
      marginBottom: 8,
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Clock, {
    size: 13
  }), " Tempo a disposizione"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginBottom: 22,
      flexWrap: "wrap"
    }
  }, TIME_OPTIONS.map(opt => {
    const active = opt.key === timeKey;
    return /*#__PURE__*/React.createElement("button", {
      key: opt.key,
      onClick: () => setTimeKey(opt.key),
      style: {
        flex: "1 1 30%",
        padding: "9px 6px",
        borderRadius: 10,
        cursor: "pointer",
        textAlign: "center",
        border: `1.5px solid ${active ? C.teal : C.parchmentLine}`,
        background: active ? "rgba(62,107,107,0.2)" : "transparent",
        color: active ? C.teal : C.parchmentDark,
        fontFamily: FONT_MONO,
        fontSize: 11,
        fontWeight: 600
      }
    }, opt.label);
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: FONT_MONO,
      fontSize: 12,
      letterSpacing: 1,
      color: C.teal,
      textTransform: "uppercase",
      marginBottom: 8
    }
  }, "Tipo di turismo"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 10,
      marginBottom: 26
    }
  }, Object.entries(TOURISM_TYPES).map(([key, t]) => {
    const Icon = t.icon;
    const active = key === tourismTypeKey;
    return /*#__PURE__*/React.createElement("button", {
      key: key,
      onClick: () => setTourismTypeKey(key),
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        padding: "12px 8px",
        borderRadius: 12,
        cursor: "pointer",
        border: `1.5px solid ${active ? C.teal : C.parchmentLine}`,
        background: active ? "rgba(62,107,107,0.18)" : "transparent",
        color: C.parchment
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      size: 20,
      color: active ? C.teal : C.parchmentDark
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        fontWeight: 500,
        textAlign: "center"
      }
    }, t.label));
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 16
    }
  }, positionSource === "manual" && manualLabel ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      background: "rgba(62,107,107,0.12)",
      border: `1px solid ${C.teal}`,
      borderRadius: 10,
      padding: "9px 12px",
      fontSize: 12,
      color: C.teal
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement(MapPin, {
    size: 13,
    style: {
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, manualLabel)), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowManualLocation(true),
    style: {
      background: "none",
      border: "none",
      color: C.teal,
      textDecoration: "underline",
      cursor: "pointer",
      fontSize: 12,
      flexShrink: 0
    }
  }, "cambia")) : /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowManualLocation(v => !v),
    style: {
      background: "none",
      border: "none",
      color: C.parchmentDark,
      fontSize: 12,
      textDecoration: "underline",
      cursor: "pointer",
      padding: 0
    }
  }, "Il GPS non funziona qui? Inserisci una posizione manualmente"), showManualLocation && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: manualQuery,
    onChange: e => setManualQuery(e.target.value),
    onKeyDown: e => {
      if (e.key === "Enter") onManualSearch();
    },
    placeholder: "Città, indirizzo o monumento…",
    style: {
      flex: 1,
      padding: "10px 12px",
      borderRadius: 10,
      border: `1.5px solid ${C.parchmentLine}`,
      background: C.parchment,
      color: C.ink,
      fontSize: 13,
      fontFamily: FONT_BODY
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: onManualSearch,
    disabled: geocoding || !manualQuery.trim(),
    style: {
      padding: "0 14px",
      borderRadius: 10,
      border: "none",
      background: C.teal,
      color: C.parchment,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      opacity: geocoding || !manualQuery.trim() ? 0.6 : 1
    }
  }, geocoding ? /*#__PURE__*/React.createElement(Loader2, {
    size: 16,
    style: {
      animation: "spin 1s linear infinite"
    }
  }) : /*#__PURE__*/React.createElement(Search, {
    size: 16
  }))), geocodeError && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      fontSize: 12,
      color: "#E8B4A6"
    }
  }, geocodeError), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      margin: "12px 0"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 1,
      background: C.parchmentLine,
      opacity: 0.4
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: C.parchmentDark,
      fontFamily: FONT_MONO,
      textTransform: "uppercase"
    }
  }, "oppure coordinate"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 1,
      background: C.parchmentLine,
      opacity: 0.4
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: manualLat,
    onChange: e => setManualLat(e.target.value),
    placeholder: "Latitudine, es. 45.4642",
    inputMode: "decimal",
    style: {
      flex: 1,
      padding: "10px 12px",
      borderRadius: 10,
      border: `1.5px solid ${C.parchmentLine}`,
      background: C.parchment,
      color: C.ink,
      fontSize: 13,
      fontFamily: FONT_MONO
    }
  }), /*#__PURE__*/React.createElement("input", {
    value: manualLon,
    onChange: e => setManualLon(e.target.value),
    placeholder: "Longitudine, es. 9.1900",
    inputMode: "decimal",
    style: {
      flex: 1,
      padding: "10px 12px",
      borderRadius: 10,
      border: `1.5px solid ${C.parchmentLine}`,
      background: C.parchment,
      color: C.ink,
      fontSize: 13,
      fontFamily: FONT_MONO
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: onManualCoords,
    disabled: !manualLat || !manualLon,
    style: {
      padding: "0 14px",
      borderRadius: 10,
      border: "none",
      background: C.brass,
      color: C.ink,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      opacity: !manualLat || !manualLon ? 0.6 : 1
    }
  }, /*#__PURE__*/React.createElement(MapPin, {
    size: 16
  }))), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 11,
      color: C.parchmentDark,
      marginTop: 6
    }
  }, "Trovi le coordinate di un luogo cercandolo su Google Maps e tenendo premuto sul punto: appaiono in basso, pronte da incollare qui."))), error && /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(166,80,58,0.15)",
      border: `1px solid ${C.rust}`,
      color: "#E8B4A6",
      borderRadius: 10,
      padding: "10px 12px",
      fontSize: 13,
      marginBottom: 16
    }
  }, error), /*#__PURE__*/React.createElement("button", {
    onClick: onStart,
    disabled: loading,
    style: {
      width: "100%",
      padding: "15px",
      borderRadius: 12,
      border: "none",
      cursor: loading ? "default" : "pointer",
      background: loading ? C.parchmentLine : kidsMode ? C.coral : mode === "gioco" ? C.brass : C.teal,
      color: kidsMode ? C.parchment : mode === "gioco" ? C.ink : C.parchment,
      fontFamily: FONT_DISPLAY,
      fontWeight: 700,
      fontSize: 16,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      opacity: loading ? 0.6 : 1
    }
  }, loading ? /*#__PURE__*/React.createElement(Loader2, {
    size: 18,
    style: {
      animation: "spin 1s linear infinite"
    }
  }) : kidsMode ? /*#__PURE__*/React.createElement(PartyPopper, {
    size: 18
  }) : /*#__PURE__*/React.createElement(MapPin, {
    size: 18
  }), loading ? "Consulto la mappa dei dintorni…" : kidsMode ? "Si parte alla caccia al tesoro!" : mode === "gioco" ? "Parti in spedizione" : "Parti alla scoperta"), /*#__PURE__*/React.createElement("button", {
    onClick: onShare,
    style: {
      width: "100%",
      marginTop: 12,
      padding: "11px",
      borderRadius: 12,
      border: `1.5px solid ${C.parchmentLine}`,
      background: "transparent",
      color: C.parchmentDark,
      fontFamily: FONT_BODY,
      fontSize: 13,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6
    }
  }, shareCopied ? /*#__PURE__*/React.createElement(Check, {
    size: 15,
    color: C.sage
  }) : /*#__PURE__*/React.createElement(Share2, {
    size: 15
  }), shareCopied ? "Link copiato!" : "Invita un amico a esplorare con te"));
}

/* ---------------------------------------------------------------
   SCHERMATA LISTA OBIETTIVI / TAPPE
------------------------------------------------------------------*/
function ListScreen({
  mode,
  kidsMode,
  targets,
  position,
  locError,
  onOpen,
  difficultyKey,
  allFound,
  onSummary
}) {
  const foundCount = targets.filter(t => t.found).length;
  const accent = kidsMode ? C.coral : mode === "gioco" ? C.brassLight : C.teal;
  return /*#__PURE__*/React.createElement("div", {
    className: "rise"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      margin: "14px 0 6px"
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: FONT_DISPLAY,
      fontSize: 20,
      fontWeight: 700
    }
  }, kidsMode ? "I tesori da trovare" : mode === "gioco" ? "I tuoi obiettivi" : "Le tue tappe"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: FONT_MONO,
      fontSize: 13,
      color: accent
    }
  }, foundCount, "/", targets.length)), kidsMode && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      background: "rgba(226,115,79,0.14)",
      border: `1px solid ${C.coral}`,
      borderRadius: 10,
      padding: "8px 12px",
      marginBottom: 12,
      color: C.coral,
      fontSize: 12
    }
  }, /*#__PURE__*/React.createElement(PartyPopper, {
    size: 14,
    style: {
      flexShrink: 0
    }
  }), " Esplorate insieme a un adulto!"), locError && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#E8B4A6",
      marginBottom: 10
    }
  }, locError), allFound && /*#__PURE__*/React.createElement("button", {
    onClick: onSummary,
    style: {
      width: "100%",
      marginBottom: 16,
      padding: "13px",
      borderRadius: 12,
      border: "none",
      background: mode === "gioco" ? C.moss : C.teal,
      color: C.parchment,
      fontFamily: FONT_DISPLAY,
      fontWeight: 700,
      fontSize: 15,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(Award, {
    size: 18
  }), " ", mode === "gioco" ? "Spedizione completata — vedi il riepilogo" : "Giro completato — vedi il riepilogo"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, targets.map(t => {
    const dist = position ? haversine(position.lat, position.lon, t.lat, t.lon) : null;
    return /*#__PURE__*/React.createElement("button", {
      key: t.id,
      onClick: () => onOpen(t.id),
      style: {
        textAlign: "left",
        background: t.found ? "rgba(143,166,136,0.12)" : C.parchment,
        border: `1.5px solid ${t.found ? C.sage : C.parchmentLine}`,
        borderRadius: 14,
        padding: 16,
        cursor: "pointer"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 6
      }
    }, /*#__PURE__*/React.createElement(StampBadge, {
      color: t.found ? C.sage : kidsMode ? C.coral : mode === "gioco" ? DIFFICULTY[difficultyKey].badge : C.teal
    }, t.found ? kidsMode ? "Trovato!" : mode === "gioco" ? "Completato" : "Scoperta" : kidsMode ? "Da cercare" : mode === "gioco" ? "Da scoprire" : "Da visitare"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: FONT_MONO,
        fontSize: 12,
        color: t.found ? C.moss : C.ink70
      }
    }, fmtDist(dist))), /*#__PURE__*/React.createElement("p", {
      style: {
        color: t.found ? C.moss : C.ink,
        fontSize: 14,
        lineHeight: 1.5,
        margin: 0,
        fontStyle: t.found ? "normal" : "italic"
      }
    }, t.found ? t.name : t.clue), !t.found && /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 4,
        marginTop: 8,
        color: C.ink70,
        fontSize: 11
      }
    }, /*#__PURE__*/React.createElement(Lock, {
      size: 12
    }), " nome nascosto finché non lo trovi"));
  })));
}

/* ---------------------------------------------------------------
   SCHERMATA OBIETTIVO / TAPPA ATTIVA
------------------------------------------------------------------*/
function ActiveScreen({
  mode,
  kidsMode,
  target,
  dist,
  bearingDeg,
  unlock,
  canPhotograph,
  verifying,
  verifyResult,
  loadingInfo,
  onPhoto,
  locError
}) {
  const accent = kidsMode ? C.coral : mode === "gioco" ? C.brass : C.teal;
  return /*#__PURE__*/React.createElement("div", {
    className: "rise",
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      paddingTop: 8
    }
  }, kidsMode && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      background: "rgba(226,115,79,0.14)",
      border: `1px solid ${C.coral}`,
      borderRadius: 10,
      padding: "8px 12px",
      marginBottom: 14,
      color: C.coral,
      fontSize: 12,
      width: "100%"
    }
  }, /*#__PURE__*/React.createElement(PartyPopper, {
    size: 14,
    style: {
      flexShrink: 0
    }
  }), " Caccia al tesoro in famiglia!"), /*#__PURE__*/React.createElement(CompassDial, {
    bearingDeg: bearingDeg
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: FONT_MONO,
      fontSize: 12,
      color: accent,
      marginTop: 8
    }
  }, dist != null ? `${compassLabel(bearingDeg)} · ${fmtDist(dist)}` : "in attesa del GPS…"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20,
      background: C.parchment,
      borderRadius: 16,
      padding: 20,
      width: "100%",
      border: `1.5px solid ${C.parchmentLine}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: FONT_MONO,
      fontSize: 11,
      letterSpacing: 1,
      color: C.ink70,
      textTransform: "uppercase",
      marginBottom: 8
    }
  }, "Indizio"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: C.ink,
      fontFamily: FONT_DISPLAY,
      fontSize: 17,
      lineHeight: 1.5,
      fontStyle: "italic",
      margin: 0
    }
  }, target.found ? target.name : target.clue)), locError && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#E8B4A6",
      marginTop: 12,
      textAlign: "center"
    }
  }, locError), target.found ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 22,
      textAlign: "center",
      width: "100%"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: target.photo,
    alt: target.name,
    style: {
      width: 160,
      height: 160,
      objectFit: "cover",
      borderRadius: 12,
      border: `2px solid ${kidsMode ? C.coral : mode === "gioco" ? C.moss : C.teal}`
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      color: kidsMode ? C.coral : mode === "gioco" ? C.sage : C.teal,
      fontFamily: FONT_MONO,
      fontSize: 13,
      display: "flex",
      alignItems: "center",
      gap: 6,
      justifyContent: "center"
    }
  }, kidsMode ? /*#__PURE__*/React.createElement(PartyPopper, {
    size: 16
  }) : /*#__PURE__*/React.createElement(Check, {
    size: 16
  }), " ", kidsMode ? "Tesoro trovato!" : mode === "gioco" ? "Obiettivo raggiunto" : "Tappa scoperta"), mode === "turismo" && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18,
      background: C.parchment,
      borderRadius: 14,
      padding: 16,
      textAlign: "left",
      border: `1.5px solid ${C.parchmentLine}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      marginBottom: 8,
      color: C.teal
    }
  }, /*#__PURE__*/React.createElement(Info, {
    size: 15
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: FONT_MONO,
      fontSize: 11,
      letterSpacing: 1,
      textTransform: "uppercase"
    }
  }, "Da sapere")), loadingInfo && !target.info && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      color: C.ink70,
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement(Loader2, {
    size: 14,
    style: {
      animation: "spin 1s linear infinite"
    }
  }), " Recupero informazioni…"), target.info && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", {
    style: {
      color: C.ink,
      fontSize: 14,
      lineHeight: 1.55,
      margin: 0
    }
  }, target.info.text), target.info.source === "wikipedia" && target.info.url && /*#__PURE__*/React.createElement("a", {
    href: target.info.url,
    target: "_blank",
    rel: "noreferrer",
    style: {
      marginTop: 10,
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      color: C.teal,
      fontSize: 12,
      fontFamily: FONT_MONO,
      textDecoration: "none"
    }
  }, "Fonte: Wikipedia ", /*#__PURE__*/React.createElement(ExternalLink, {
    size: 11
  })), target.info.source === "ai" && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      fontSize: 11,
      color: C.ink70,
      fontStyle: "italic"
    }
  }, "Scheda generata automaticamente")))) : /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 26,
      width: "100%"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onPhoto,
    disabled: !canPhotograph || verifying,
    style: {
      width: "100%",
      padding: "15px",
      borderRadius: 12,
      border: "none",
      background: canPhotograph ? accent : C.parchmentLine,
      color: kidsMode ? C.parchment : mode === "gioco" ? C.ink : C.parchment,
      fontFamily: FONT_DISPLAY,
      fontWeight: 700,
      fontSize: 15,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      cursor: canPhotograph && !verifying ? "pointer" : "default",
      opacity: verifying ? 0.7 : 1
    }
  }, verifying ? /*#__PURE__*/React.createElement(Loader2, {
    size: 18,
    style: {
      animation: "spin 1s linear infinite"
    }
  }) : canPhotograph ? /*#__PURE__*/React.createElement(Camera, {
    size: 18
  }) : /*#__PURE__*/React.createElement(Lock, {
    size: 18
  }), verifying ? "Verifico la foto…" : canPhotograph ? kidsMode ? "Scatta la foto del tesoro!" : "Scatta la foto" : `Avvicinati a meno di ${unlock} m`), verifyResult && !verifyResult.trovato && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      background: "rgba(166,80,58,0.15)",
      border: `1px solid ${C.rust}`,
      color: "#E8B4A6",
      borderRadius: 10,
      padding: "10px 12px",
      fontSize: 13,
      display: "flex",
      gap: 8,
      alignItems: "flex-start"
    }
  }, /*#__PURE__*/React.createElement(X, {
    size: 16,
    style: {
      flexShrink: 0,
      marginTop: 1
    }
  }), /*#__PURE__*/React.createElement("span", null, verifyResult.messaggio || "Non sembra essere il posto giusto. Riprova."))));
}

/* ---------------------------------------------------------------
   RIEPILOGO
------------------------------------------------------------------*/
function SummaryScreen({
  mode,
  targets,
  score,
  playerName,
  onLeaderboard,
  onRestart,
  feedbackRating,
  setFeedbackRating,
  feedbackComment,
  setFeedbackComment,
  feedbackSubmitting,
  feedbackSubmitted,
  onSubmitFeedback
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "rise",
    style: {
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement(Sparkles, {
    size: 36,
    color: mode === "gioco" ? C.brassLight : C.teal,
    style: {
      marginTop: 8
    }
  }), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: FONT_DISPLAY,
      fontSize: 24,
      fontWeight: 700,
      margin: "10px 0 4px"
    }
  }, mode === "gioco" ? `Spedizione completata, ${playerName}!` : `Giro completato, ${playerName}!`), mode === "gioco" ? /*#__PURE__*/React.createElement("p", {
    style: {
      color: C.parchmentDark,
      fontSize: 14,
      marginBottom: 18
    }
  }, "Hai totalizzato ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: C.brassLight,
      fontFamily: FONT_MONO
    }
  }, score), " punti.") : /*#__PURE__*/React.createElement("p", {
    style: {
      color: C.parchmentDark,
      fontSize: 14,
      marginBottom: 18
    }
  }, "Hai scoperto ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: C.teal,
      fontFamily: FONT_MONO
    }
  }, targets.length), " tappe. Ecco il tuo diario di viaggio."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12,
      marginBottom: 22,
      textAlign: "left"
    }
  }, targets.map(t => /*#__PURE__*/React.createElement("div", {
    key: t.id,
    style: {
      background: C.parchment,
      borderRadius: 12,
      padding: 12,
      border: `1.5px solid ${C.parchmentLine}`,
      display: "flex",
      gap: 12
    }
  }, t.photo && /*#__PURE__*/React.createElement("img", {
    src: t.photo,
    alt: t.name,
    style: {
      width: 70,
      height: 70,
      objectFit: "cover",
      borderRadius: 8,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      color: C.ink,
      fontSize: 14,
      fontWeight: 600
    }
  }, t.name), mode === "turismo" && t.info && /*#__PURE__*/React.createElement("p", {
    style: {
      color: C.ink70,
      fontSize: 12,
      lineHeight: 1.4,
      margin: "4px 0 0"
    }
  }, t.info.text))))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: C.parchment,
      borderRadius: 14,
      padding: 18,
      marginBottom: 20,
      border: `1.5px solid ${C.parchmentLine}`,
      textAlign: "left"
    }
  }, feedbackSubmitted ? /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      color: C.moss,
      fontSize: 14,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Check, {
    size: 16
  }), " Grazie del feedback!") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: FONT_MONO,
      fontSize: 11,
      letterSpacing: 1,
      color: C.ink70,
      textTransform: "uppercase",
      marginBottom: 10
    }
  }, "Com'è andata?"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      justifyContent: "center",
      marginBottom: 12
    }
  }, [1, 2, 3, 4, 5].map(n => /*#__PURE__*/React.createElement("button", {
    key: n,
    onClick: () => setFeedbackRating(n),
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: 2
    }
  }, /*#__PURE__*/React.createElement(Star, {
    size: 26,
    color: C.brass,
    fill: n <= feedbackRating ? C.brass : "transparent"
  })))), /*#__PURE__*/React.createElement("textarea", {
    value: feedbackComment,
    onChange: e => setFeedbackComment(e.target.value),
    placeholder: "Cosa ti è piaciuto o cosa miglioreresti? (facoltativo)",
    rows: 2,
    style: {
      width: "100%",
      padding: "10px 12px",
      borderRadius: 10,
      border: `1.5px solid ${C.parchmentLine}`,
      background: C.parchmentDark + "40",
      color: C.ink,
      fontSize: 13,
      fontFamily: FONT_BODY,
      resize: "none",
      marginBottom: 10
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: onSubmitFeedback,
    disabled: feedbackRating === 0 || feedbackSubmitting,
    style: {
      width: "100%",
      padding: "10px",
      borderRadius: 10,
      border: "none",
      background: feedbackRating === 0 ? C.parchmentLine : C.moss,
      color: C.parchment,
      fontFamily: FONT_BODY,
      fontWeight: 600,
      fontSize: 13,
      cursor: feedbackRating === 0 ? "default" : "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      opacity: feedbackSubmitting ? 0.7 : 1
    }
  }, feedbackSubmitting ? /*#__PURE__*/React.createElement(Loader2, {
    size: 14,
    style: {
      animation: "spin 1s linear infinite"
    }
  }) : null, feedbackSubmitting ? "Invio…" : "Invia feedback"))), mode === "gioco" ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    onClick: onLeaderboard,
    style: {
      width: "100%",
      padding: "13px",
      borderRadius: 12,
      border: "none",
      marginBottom: 10,
      background: C.brass,
      color: C.ink,
      fontFamily: FONT_DISPLAY,
      fontWeight: 700,
      fontSize: 15,
      cursor: "pointer"
    }
  }, "Vedi la classifica"), /*#__PURE__*/React.createElement("button", {
    onClick: onRestart,
    style: {
      width: "100%",
      padding: "13px",
      borderRadius: 12,
      border: `1.5px solid ${C.parchmentLine}`,
      background: "transparent",
      color: C.parchment,
      fontFamily: FONT_BODY,
      fontSize: 14,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(RotateCcw, {
    size: 15
  }), " Nuova spedizione")) : /*#__PURE__*/React.createElement("button", {
    onClick: onRestart,
    style: {
      width: "100%",
      padding: "13px",
      borderRadius: 12,
      border: "none",
      background: C.teal,
      color: C.parchment,
      fontFamily: FONT_DISPLAY,
      fontWeight: 700,
      fontSize: 15,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(RotateCcw, {
    size: 15
  }), " Nuovo giro"));
}

/* ---------------------------------------------------------------
   CLASSIFICA (solo modalità Caccia al tesoro)
------------------------------------------------------------------*/
function LeaderboardScreen({
  leaderboard,
  playerName
}) {
  const medalColors = [C.brassLight, "#C9C9C9", C.rust];
  return /*#__PURE__*/React.createElement("div", {
    className: "rise"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      margin: "10px 0 20px"
    }
  }, /*#__PURE__*/React.createElement(Trophy, {
    size: 32,
    color: C.brassLight
  }), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: FONT_DISPLAY,
      fontSize: 22,
      fontWeight: 700,
      margin: "8px 0 0"
    }
  }, "Classifica esploratori"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12,
      color: C.parchmentDark,
      marginTop: 4
    }
  }, "Visibile a tutti gli esploratori")), leaderboard.length === 0 ? /*#__PURE__*/React.createElement("p", {
    style: {
      textAlign: "center",
      color: C.parchmentDark,
      fontSize: 14
    }
  }, "Nessun punteggio ancora registrato. Completa un obiettivo in modalità Caccia al tesoro per comparire qui.") : /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, leaderboard.map((r, i) => {
    const isMe = r.username === playerName;
    return /*#__PURE__*/React.createElement("div", {
      key: r.username + i,
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 14px",
        borderRadius: 12,
        background: isMe ? "rgba(217,174,102,0.18)" : C.parchment,
        border: `1.5px solid ${isMe ? C.brassLight : C.parchmentLine}`
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: FONT_MONO,
        fontWeight: 700,
        fontSize: 14,
        width: 22,
        textAlign: "center",
        color: i < 3 ? medalColors[i] : C.ink70
      }
    }, i + 1), /*#__PURE__*/React.createElement("span", {
      style: {
        color: C.ink,
        fontWeight: isMe ? 700 : 500,
        fontSize: 14
      }
    }, r.username)), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: FONT_MONO,
        fontSize: 14,
        color: C.ink
      }
    }, r.score));
  })));
}