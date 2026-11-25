/* =====================================================================
   COMPTEUR DE VISITES — SKOOL Workshops (Cloudflare Worker + D1)
   - Reçoit les événements envoyés par workshop/assets/stats.js
   - Aucun cookie, rien stocké dans le navigateur du visiteur
   - L'adresse IP n'est jamais enregistrée : elle sert seulement, le jour même,
     à calculer une empreinte anonyme (hachée avec un sel tiré au hasard chaque
     jour puis effacé), pour compter les visiteurs uniques de la journée.
   - Les données de plus de 13 mois sont supprimées automatiquement.
   Lien attendu : variable D1 « DB » vers la base skool-workshop-stats.
   ===================================================================== */

const ORIGINS = ["https://cerega.fr", "https://www.cerega.fr"];
const EVENTS = new Set(["pageview", "reserver", "etape", "paiement", "whatsapp"]);
const BOTS = /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|embedly|pingdom|monitor/i;
const SOURCES = [
  [/(^|\.)instagram\.com$/, "instagram"], [/(^|\.)facebook\.com$|(^|\.)fb\.com$/, "facebook"],
  [/(^|\.)tiktok\.com$/, "tiktok"], [/(^|\.)youtube\.com$|(^|\.)youtu\.be$/, "youtube"],
  [/(^|\.)google\./, "google"], [/(^|\.)bing\.com$/, "bing"], [/(^|\.)linkedin\.com$|lnkd\.in$/, "linkedin"],
  [/(^|\.)skool\.com$/, "skool"], [/(^|\.)whatsapp\.com$/, "whatsapp"], [/(^|\.)t\.co$|(^|\.)x\.com$|twitter\.com$/, "x"]
];

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const origin = req.headers.get("origin") || "";
    const ok = ORIGINS.includes(origin);
    const cors = {
      "access-control-allow-origin": ok ? origin : ORIGINS[0],
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
      "vary": "origin"
    };
    const empty = () => new Response(null, {status: 204, headers: cors});

    if (req.method === "OPTIONS") return empty();
    if (req.method === "GET" && url.pathname === "/") return new Response("SKOOL stats : ok", {headers: cors});
    if (req.method !== "POST" || url.pathname !== "/e") return new Response("introuvable", {status: 404, headers: cors});
    if (!ok) return empty();

    const ua = req.headers.get("user-agent") || "";
    if (!ua || BOTS.test(ua)) return empty();

    let b;
    try { const t = await req.text(); if (t.length > 2000) return empty(); b = JSON.parse(t); } catch (e) { return empty(); }
    const ev = String(b.e || "");
    if (!EVENTS.has(ev)) return empty();

    const cut = (v, n) => (v === undefined || v === null || v === "") ? null : String(v).slice(0, n);
    const now = Date.now();
    const day = parisDay(now);

    // empreinte anonyme du jour (rien n'est stocké sur l'appareil, l'IP n'est pas enregistrée)
    const ip = req.headers.get("cf-connecting-ip") || "";
    const salt = await dailySalt(env.DB, day);
    const visitor = (await sha256(salt + "|" + ip + "|" + ua)).slice(0, 16);

    const page = cut(String(b.p || "/").split("?")[0].split("#")[0], 120);
    const ref = cleanHost(b.r);
    let source = cut(b.us, 60), campaign = cut(b.uc, 60), content = cut(b.ut, 80);
    if (!source && b.fb) source = "meta";
    if (!source && ref) source = sourceOf(ref);

    // pas de source sur cet événement (page interne) : on garde celle de l'arrivée du jour
    if (!source) {
      const first = await env.DB.prepare(
        "SELECT source, campaign, content FROM events WHERE visitor = ? AND day = ? AND source IS NOT NULL ORDER BY id LIMIT 1"
      ).bind(visitor, day).first();
      if (first) ({source, campaign, content} = first);
      else source = ev === "pageview" ? "direct" : null;
    }

    const device = /iPad|Tablet/i.test(ua) ? "tablette" : /Mobi|Android|iPhone/i.test(ua) ? "mobile" : "ordinateur";
    const country = (req.cf && req.cf.country) || null;

    await env.DB.prepare(
      "INSERT INTO events (ts, day, visitor, page, event, label, ref, source, campaign, content, device, country, formule) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)"
    ).bind(now, day, visitor, page, ev, cut(b.l, 60), ref, source, campaign, content, device, country, cut(b.f, 40)).run();

    if (Math.random() < 0.01) ctx.waitUntil(env.DB.prepare("DELETE FROM events WHERE ts < ?").bind(now - 395 * 864e5).run());
    return empty();
  }
};

function parisDay(ms) {
  try { return new Intl.DateTimeFormat("fr-CA", {timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit"}).format(new Date(ms)); }
  catch (e) { return new Date(ms).toISOString().slice(0, 10); }
}

async function dailySalt(DB, day) {
  const row = await DB.prepare("SELECT salt FROM salts WHERE day = ?").bind(day).first();
  if (row) return row.salt;
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const fresh = [...bytes].map(x => x.toString(16).padStart(2, "0")).join("");
  await DB.batch([
    DB.prepare("INSERT OR IGNORE INTO salts (day, salt) VALUES (?, ?)").bind(day, fresh),
    DB.prepare("DELETE FROM salts WHERE day <> ?").bind(day) // le sel de la veille disparaît : plus aucun lien possible
  ]);
  const again = await DB.prepare("SELECT salt FROM salts WHERE day = ?").bind(day).first();
  return again ? again.salt : fresh;
}

async function sha256(s) {
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(h)].map(x => x.toString(16).padStart(2, "0")).join("");
}

function cleanHost(r) {
  if (!r) return null;
  try {
    const h = new URL(String(r).includes("://") ? String(r) : "https://" + r).hostname.replace(/^www\./, "").replace(/^(l|lm|m)\./, "");
    if (!h || h === "cerega.fr") return null;
    return h.slice(0, 80);
  } catch (e) { return null; }
}

function sourceOf(host) {
  for (const [re, name] of SOURCES) if (re.test(host)) return name;
  return host;
}
