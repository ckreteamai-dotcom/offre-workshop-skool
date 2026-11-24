/* SKOOL Workshops — logique commune à toutes les pages */
(function(){
const C = window.SKOOL_CATALOG;
const MONTHS = ["janv.","févr.","mars","avr.","mai","juin","juil.","août","sept.","oct.","nov.","déc."];
const MONTHS_L = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
const DAYS_L = ["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"];
const S = {};
S.C = C; S.MONTHS_L = MONTHS_L;
S.d = s => { const [y,m,d] = s.split("-").map(Number); return new Date(y, m-1, d); };
S.iso = d => d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
S.formula = id => C.formulas.find(f => f.id === id);
S.theme = id => C.themes.find(t => t.id === id);
S.session = id => C.sessions.find(s => s.id === id);
S.eur = n => n.toLocaleString("fr-FR").replace(/[\u202f\u00a0 ]/g, "\u00a0") + "\u00a0€";
S.promoPrice = p => Math.round(p * (100 - C.promo.percent) / 100);
S.range = s => {
  const a = S.d(s.start), b = S.d(s.end);
  if (a.getMonth() === b.getMonth()) return `${a.getDate()} – ${b.getDate()} ${MONTHS[b.getMonth()]} ${b.getFullYear()}`;
  return `${a.getDate()} ${MONTHS[a.getMonth()]} – ${b.getDate()} ${MONTHS[b.getMonth()]} ${b.getFullYear()}`;
};
S.rangeLong = s => {
  const a = S.d(s.start), b = S.d(s.end);
  return `du ${DAYS_L[a.getDay()]} ${a.getDate()} ${MONTHS_L[a.getMonth()]} au ${DAYS_L[b.getDay()]} ${b.getDate()} ${MONTHS_L[b.getMonth()]} ${b.getFullYear()}`;
};
S.sessionDays = s => { // jours de cours (lundi-vendredi pour les semaines, tous les jours pour les week-ends de 2 jours)
  const out = [], a = S.d(s.start), b = S.d(s.end), f = S.formula(s.formula);
  for (let d = new Date(a); d <= b; d.setDate(d.getDate()+1)) {
    const wd = d.getDay();
    if (f.days === 2 || (wd !== 0 && wd !== 6)) out.push(S.iso(d));
  }
  return out;
};

/* ---------- disponibilités : serveur si présent, sinon mode aperçu ---------- */
S.demo = false;      // ancien mode aperçu (plus utilisé)
S.static = false;    // site sans serveur (GitHub Pages) : paiement par liens Stripe / PayPal
S.taken = {};
const today = new Date(); today.setHours(0,0,0,0);
S.isPast = s => S.d(s.start) < today;
S.left = s => Math.max(0, S.formula(s.formula).capacity - (S.taken[s.id] || 0));
S.ready = (async () => {
  try {
    const r = await fetch("/api/availability", {cache: "no-store"});
    if (!r.ok) throw 0;
    const j = await r.json();
    S.taken = j.taken || {};
  } catch (e) {
    S.static = true;
    C.sessions.forEach(s => S.taken[s.id] = s.taken || 0);
  }
  return S;
})();
S.upcoming = (formulaId) => C.sessions
  .filter(s => !S.isPast(s) && (!formulaId || s.formula === formulaId))
  .sort((a, b) => a.start.localeCompare(b.start));

/* ---------- badges d'urgence ---------- */
S.badge = s => {
  const l = S.left(s);
  if (l <= 0) return `<span class="seats full"><i></i>Complet</span>`;
  if (l === 1) return `<span class="seats last"><i></i>Dernière place !</span>`;
  if (l <= 3) return `<span class="seats low"><i></i>Plus que ${l} places</span>`;
  return `<span class="seats ok"><i></i>${l} places dispo</span>`;
};
S.urgencyLine = s => {
  const l = S.left(s);
  if (l <= 0) return "";
  if (l === 1) return "🔥 C'est la dernière place sur cette session.";
  if (l <= 3) return `🔥 Plus que ${l} places sur cette session : elles partent vite.`;
  return "";
};

/* ---------- mascottes ---------- */
const MNAME = {"le-m": "Le M", "cerega": "Cerega", "duo": "Cerega & Le M"};
S.mascots = (root = document) => {
  root.querySelectorAll(".mascot-slot[data-m]").forEach(el => {
    if (el.dataset.init) return; el.dataset.init = 1;
    const m = el.dataset.m, pose = el.dataset.pose || "hero";
    el.insertAdjacentHTML("afterbegin", `<span class="blob"></span>`);
    el.insertAdjacentHTML("beforeend", `<span class="ph"><b>${MNAME[m] || m}</b>Illustration à venir<br>${m}-${pose}.webp</span>`);
    const img = new Image();
    img.alt = el.dataset.alt || (MNAME[m] + ", mascotte des workshops SKOOL");
    img.decoding = "async";
    img.onload = () => { el.classList.add("has-img"); el.appendChild(img); };
    img.src = `assets/img/mascottes/${m}-${pose}.webp`;
  });
};

/* ---------- widgets ---------- */
S.formulaCard = f => {
  const next = S.upcoming(f.id).find(s => S.left(s) > 0);
  return `<article class="fcard ${f.color} reveal">
    ${f.best ? `<span class="best">3 FILMS EN 2 SEMAINES</span>` : ""}
    <div class="top">
      <span class="dur">${f.short}</span>
      <h3>${f.name}</h3>
      <p class="tl">${f.tagline}</p>
      <div class="price">${S.eur(f.price)}<small>TTC / pers.</small></div>
    </div>
    <div class="body">
      <ul>${f.includes.map(i => `<li>${i}</li>`).join("")}</ul>
      ${f.skoolBonus ? `<div class="bonus"><b>🎁 ${f.skoolBonus}</b><span>Membre du Skool ? −${C.promo.percent} % avec ton code</span></div>` : ""}
      ${next ? `<div class="next"><span>Prochaine : ${S.range(next)}</span>${S.badge(next)}</div>` : `<div class="next"><span>Nouvelles dates bientôt</span></div>`}
      <div class="acts">
        <a class="btn btn-line btn-sm" href="${f.page}">Le programme</a>
        <a class="btn btn-dark btn-sm" href="reserver.html#${f.id}">Réserver <span class="arr">→</span></a>
      </div>
    </div>
  </article>`;
};
S.sessionRow = s => {
  const f = S.formula(s.formula), a = S.d(s.start), t = s.theme ? S.theme(s.theme) : null, l = S.left(s);
  return `<div class="srow ${f.color}">
    <div class="d"><div><b>${a.getDate()}</b><br><small>${MONTHS[a.getMonth()]}</small></div></div>
    <div><h4>${f.name}${t ? ` · ${t.name}` : ""}</h4><p>${f.short} · ${S.range(s)} · ${S.eur(f.price)}</p></div>
    ${S.badge(s)}
    ${l > 0 ? `<a class="btn btn-lime btn-sm" href="reserver.html#${s.id}">Réserver</a>` : `<span class="btn btn-ghost btn-sm" aria-disabled="true">Complet</span>`}
  </div>`;
};

/* ---------- interface générale ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const b = document.querySelector(".burger"), ul = document.querySelector(".nav ul");
  if (b) b.addEventListener("click", () => ul.classList.toggle("open"));
  S.mascots();
  const io = "IntersectionObserver" in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), {threshold: .12}) : null;
  S.observe = root => (root || document).querySelectorAll(".reveal:not(.in)").forEach(el => io ? io.observe(el) : el.classList.add("in"));
  S.observe();
  document.querySelectorAll("[data-year]").forEach(e => e.textContent = new Date().getFullYear());
  S.ready.then(() => {
    // widgets déclarés dans le HTML
    document.querySelectorAll("[data-widget=formulas]").forEach(el => { el.innerHTML = C.formulas.map(S.formulaCard).join(""); S.observe(el); });
    document.querySelectorAll("[data-widget=sessions]").forEach(el => {
      const list = S.upcoming(el.dataset.formula).slice(0, +(el.dataset.limit || 6));
      el.innerHTML = list.length ? list.map(S.sessionRow).join("") : `<p class="mut">De nouvelles dates arrivent très bientôt.</p>`;
    });
    // barre mobile + bandeau : prochaine session la plus pressante
    const hot = S.upcoming().filter(s => S.left(s) > 0).sort((a, b) => S.left(a) - S.left(b))[0];
    document.querySelectorAll("[data-hot]").forEach(el => {
      if (!hot) { el.textContent = "Réserve ta session"; return; }
      const f = S.formula(hot.formula);
      el.innerHTML = `${f.name} · ${S.range(hot)}<small>${S.left(hot) <= 3 ? "Plus que " + S.left(hot) + " place" + (S.left(hot) > 1 ? "s" : "") : S.left(hot) + " places dispo"}</small>`;
    });
    // bandeau d'alerte en haut de page : basé sur les vraies places restantes
    const nav = document.querySelector("header.nav");
    const nxt = S.upcoming().find(s => S.left(s) > 0);
    if (hot && nxt && nav && !document.querySelector(".alertbar")) {
      const urgent = S.left(hot) <= 3, s0 = urgent ? hot : nxt, f = S.formula(s0.formula), l = S.left(s0);
      const msg = urgent
        ? `<b>Attention :</b> plus que ${l} place${l > 1 ? "s" : ""} sur « ${f.name} » (${S.range(s0)})`
        : `<b>Places limitées :</b> une seule session par formule, de 5 à 15 places seulement. Prochaine : ${f.nav || f.short}, ${S.range(s0)}`;
      nav.insertAdjacentHTML("afterend", `<a class="alertbar ${urgent ? "hot" : ""}" href="reserver.html#${s0.id}"><i></i><span>${msg}</span><em>Réserver →</em></a>`);
    }
    document.dispatchEvent(new CustomEvent("skw-ready"));
  });
});
window.SKW = S;
})();
