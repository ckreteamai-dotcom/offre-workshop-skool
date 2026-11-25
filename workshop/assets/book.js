/* SKOOL Workshops — tunnel de réservation */
(function(){
const $ = s => document.querySelector(s);
const st = {step: 1, formula: null, session: null, themeFilter: "", month: null, info: {}, result: null, promo: {code: "", ok: false, percent: 0, msg: ""}};
const STEPS = ["Formule", "Date", "Coordonnées", "Paiement"];
let S, C;

function sha256(str){ // empreinte SHA-256 (hex), sans dépendre de crypto.subtle (marche aussi en http)
  let ascii = unescape(encodeURIComponent(str));
  const rr = (v, a) => (v >>> a) | (v << (32 - a)), maxWord = Math.pow(2, 32), words = [], bitLen = ascii.length * 8;
  let hash = [], k = [], pc = 0; const comp = {};
  for (let c = 2; pc < 64; c++) { if (!comp[c]) { for (let i = 0; i < 313; i += c) comp[i] = c; hash[pc] = (Math.pow(c, .5) * maxWord) | 0; k[pc++] = (Math.pow(c, 1 / 3) * maxWord) | 0; } }
  ascii += "\x80"; while (ascii.length % 64 - 56) ascii += "\x00";
  for (let i = 0; i < ascii.length; i++) words[i >> 2] |= ascii.charCodeAt(i) << ((3 - i) % 4) * 8;
  words[words.length] = (bitLen / maxWord) | 0; words[words.length] = bitLen;
  for (let j = 0; j < words.length;) {
    const w = words.slice(j, j += 16), old = hash; hash = hash.slice(0, 8);
    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2], a = hash[0], e = hash[4];
      const t1 = hash[7] + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + ((e & hash[5]) ^ (~e & hash[6])) + k[i]
        + (w[i] = i < 16 ? w[i] : (w[i - 16] + (rr(w15, 7) ^ rr(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rr(w2, 17) ^ rr(w2, 19) ^ (w2 >>> 10))) | 0);
      const t2 = (rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      hash = [(t1 + t2) | 0].concat(hash); hash[4] = (hash[4] + t1) | 0;
    }
    for (let i = 0; i < 8; i++) hash[i] = (hash[i] + old[i]) | 0;
  }
  let out = ""; for (let i = 0; i < 8; i++) for (let j = 3; j + 1; j--) { const b = (hash[i] >> (j * 8)) & 255; out += (b < 16 ? "0" : "") + b.toString(16); }
  return out;
}
function price(f){ return st.promo.ok ? Math.round(f.price * (100 - st.promo.percent) / 100) : f.price; }
function esc(s){ return String(s || "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]); }

function renderSteps(){
  $("#steps").innerHTML = st.step > 4 ? "" : STEPS.map((n, i) => {
    const k = i + 1, cls = k === st.step ? "on" : k < st.step ? "done" : "";
    return `<span class="${cls}"><i>${k < st.step ? "✓" : k}</i>${n}</span>`;
  }).join("");
}

function renderRecap(){
  const f = st.formula ? S.formula(st.formula) : null, s = st.session ? S.session(st.session) : null;
  const t = s && s.theme ? S.theme(s.theme) : null;
  $("#recap").innerHTML = `
    <div class="head">
      <div class="mascot-slot ${f ? (f.color === "violet" ? "" : f.color) : ""}" data-m="${f ? f.mascot : "duo"}" data-pose="${f ? f.id : "hero"}"></div>
      <div><b style="font:800 18px var(--f-d)">Ta réservation</b><br><small style="color:var(--mut-d)">${f ? f.short : "Choisis ta formule"}</small></div>
    </div>
    <div class="rows">
      <div><span>Formule</span><b>${f ? esc(f.name) : "—"}</b></div>
      ${t ? `<div><span>Thème</span><b>${esc(t.name)}</b></div>` : ""}
      <div><span>Dates</span><b>${s ? S.range(s) : "—"}</b></div>
      <div><span>Format</span><b>En ligne, en direct</b></div>
      ${s ? `<div><span>Places</span>${S.badge(s)}</div>` : ""}
    </div>
    ${f && st.promo.ok ? `<div class="perk on"><b>Remise membre Skool −${st.promo.percent} %</b><span>Code ${esc(st.promo.code)} appliqué</span></div>` : ""}
    ${f && !st.promo.ok && f.skoolBonus ? `<div class="perk"><b>🎁 ${esc(f.skoolBonus)}</b><span>Inclus avec ton workshop</span></div>` : ""}
    <div class="tot"><small>Total TTC</small>${f ? (st.promo.ok ? `<s>${S.eur(f.price)}</s> ` : "") + S.eur(price(f)) : "—"}</div>
    <div class="urg ${s && S.urgencyLine(s) ? "on" : ""}">${s ? S.urgencyLine(s) : ""}</div>`;
  S.mascots($("#recap"));
}

function go(n){ st.step = n; render(); window.scrollTo({top: 0, behavior: "smooth"}); }

/* ---------- étape 1 : formule ---------- */
function stepFormula(){
  return `<h2>Quelle formule te tente ?</h2><p class="mut">Tu pourras choisir ta date juste après.</p>
  <div class="choice">${C.formulas.map(f => {
    const next = S.upcoming(f.id).find(s => S.left(s) > 0);
    return `<button class="opt" aria-pressed="${st.formula === f.id}" data-f="${f.id}">
      <span class="dot bg-${f.color}">${f.days}j</span>
      <span><h4>${esc(f.name)} <span class="tag" style="margin-left:6px">${f.short}</span></h4>
      <p>${esc(f.tagline)}${next ? ` · Prochaine : ${S.range(next)}` : ""}</p></span>
      <span class="pr">${S.eur(f.price)}</span></button>`;
  }).join("")}</div>
  <div class="nav-step"><span></span><button class="btn btn-lime" id="next1" ${st.formula ? "" : "disabled"}>Choisir ma date <span class="arr">→</span></button></div>`;
}

/* ---------- étape 2 : calendrier ---------- */
function monthsRange(){
  const ss = S.upcoming(st.formula); if (!ss.length) return [];
  const a = S.d(ss[0].start), b = S.d(ss[ss.length - 1].end), out = [];
  for (let d = new Date(a.getFullYear(), a.getMonth(), 1); d <= b; d.setMonth(d.getMonth() + 1)) out.push(new Date(d));
  return out;
}
function stepDate(){
  const f = S.formula(st.formula);
  let list = S.upcoming(st.formula);
  if (st.themeFilter) list = list.filter(s => s.theme === st.themeFilter);
  const months = monthsRange();
  if (!st.month && months.length) {
    const sel = st.session ? S.session(st.session) : list.find(s => S.left(s) > 0) || list[0];
    const d = sel ? S.d(sel.start) : months[0];
    st.month = new Date(d.getFullYear(), d.getMonth(), 1);
  }
  const m = st.month;
  // jours couverts par les sessions de la formule
  const map = {};
  list.forEach(s => S.sessionDays(s).forEach((day, i) => { map[day] = {s, start: i === 0}; }));
  const first = new Date(m.getFullYear(), m.getMonth(), 1), off = (first.getDay() + 6) % 7, dim = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
  let cells = "";
  for (let i = 0; i < off; i++) cells += `<span class="c"></span>`;
  for (let d = 1; d <= dim; d++) {
    const iso = S.iso(new Date(m.getFullYear(), m.getMonth(), d)), x = map[iso];
    if (x) {
      const full = S.left(x.s) <= 0;
      cells += `<button class="c in ${full ? "full" : f.color} ${x.start ? "start" : ""} ${st.session === x.s.id ? "sel" : ""}" data-s="${x.s.id}" ${full ? "disabled" : ""} aria-label="${d} ${S.MONTHS_L[m.getMonth()]}, session ${S.range(x.s)}">${d}</button>`;
    } else cells += `<span class="c">${d}</span>`;
  }
  const mi = months.findIndex(x => x.getFullYear() === m.getFullYear() && x.getMonth() === m.getMonth());
  const themes = C.themes.length && f.id === "perfectionnement" ? `<div class="tabs" style="margin:18px 0 0">${[{id: "", name: "Tous les thèmes"}].concat(C.themes).map(t =>
      `<button aria-selected="${st.themeFilter === t.id}" data-th="${t.id}" style="border-color:var(--line);background:${st.themeFilter === t.id ? "var(--lime)" : "var(--ink)"};color:${st.themeFilter === t.id ? "var(--ink)" : "var(--text)"};box-shadow:none">${t.name}</button>`).join("")}</div>` : "";
  return `<h2>Choisis ta date.</h2><p class="mut">${esc(f.name)} · ${f.short} · ${C.schedule}</p>
  ${themes}
  <div class="cal">
    <div class="cal-h"><button data-mv="-1" ${mi <= 0 ? "disabled" : ""} aria-label="Mois précédent">‹</button><b>${S.MONTHS_L[m.getMonth()]} ${m.getFullYear()}</b><button data-mv="1" ${mi >= months.length - 1 ? "disabled" : ""} aria-label="Mois suivant">›</button></div>
    <div class="cal-g">${["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map(d => `<span class="wd">${d}</span>`).join("")}${cells}</div>
    <div class="cal-legend"><span><i class="bg-${f.color}"></i>Jours de session</span><span><i style="background:#fff"></i>Point = 1er jour</span><span><i style="background:rgba(255,255,255,.15)"></i>Complet</span></div>
  </div>
  <div class="slist">${list.map(s => {
    const t = s.theme ? S.theme(s.theme) : null, full = S.left(s) <= 0;
    return `<button class="sopt" data-s="${s.id}" aria-pressed="${st.session === s.id}" ${full ? "disabled" : ""}>
      <span><h4>${S.range(s)}${t ? ` · ${esc(t.name)}` : ""}</h4><p>${S.rangeLong(s)}</p></span>${S.badge(s)}</button>`;
  }).join("") || `<p class="mut">Pas de session sur ce thème pour l'instant.</p>`}</div>
  <div class="nav-step"><button class="btn btn-ghost" id="back">← Formule</button><button class="btn btn-lime" id="next2" ${st.session ? "" : "disabled"}>Continuer <span class="arr">→</span></button></div>`;
}

/* ---------- étape 3 : coordonnées ---------- */
function stepInfo(){
  const i = st.info;
  return `<h2>Tes coordonnées.</h2><p class="mut">Pour t'envoyer ta confirmation et les accès à la session.</p>
  <form class="form" id="form" novalidate>
    <label>Prénom<input name="firstName" autocomplete="given-name" required value="${esc(i.firstName)}"></label>
    <label>Nom<input name="lastName" autocomplete="family-name" required value="${esc(i.lastName)}"></label>
    <label>E-mail<input name="email" type="email" autocomplete="email" required value="${esc(i.email)}"></label>
    <label>Téléphone<input name="phone" type="tel" autocomplete="tel" value="${esc(i.phone)}" placeholder="Optionnel"></label>
    ${S.static ? "" : `<label class="full">Ton niveau en IA
      <select name="level">${["Je débute", "Je pratique un peu", "Je pratique régulièrement", "C'est mon métier"].map(o => `<option ${i.level === o ? "selected" : ""}>${o}</option>`).join("")}</select></label>
    <label class="full">Ce que tu veux en retirer <textarea name="goal" placeholder="Optionnel : ton projet, tes attentes…">${esc(i.goal)}</textarea></label>`}
    <p class="err full" id="err"></p>
  </form>
  <div class="nav-step"><button class="btn btn-ghost" id="back">← Date</button><button class="btn btn-lime" id="next3" style="background:#15803D;box-shadow:0 6px 0 #0A4D24">Passer au paiement <span class="arr">→</span></button></div>`;
}

/* ---------- étape 4 : paiement ---------- */
function stepPay(){
  const f = S.formula(st.formula), s = S.session(st.session), pr = st.promo;
  return `<h2>Dernière étape.</h2><p class="mut">Ta place est bloquée dès que le paiement est validé.</p>
  <div class="choice">
    <div class="opt" style="cursor:default"><span class="dot bg-${f.color}">${f.days}j</span><span><h4>${esc(f.name)} · ${S.range(s)}</h4><p>${esc(st.info.firstName)} ${esc(st.info.lastName)} · ${esc(st.info.email)}</p></span><span class="pr">${pr.ok ? `<s>${S.eur(f.price)}</s>` : ""}${S.eur(price(f))}</span></div>
  </div>
  <div class="promo-box">
    <div class="pb-col">
      <b>Déjà membre du Skool ?</b>
      <p>Entre ton code membre : −${C.promo.percent} % sur ton workshop.</p>
      <div class="pb-row"><input id="promo" placeholder="Ton code membre" autocomplete="off" value="${esc(pr.code)}" ${pr.ok ? "disabled" : ""}><button class="btn btn-line btn-sm" id="applyPromo" type="button">${pr.ok ? "Retirer" : "Appliquer"}</button></div>
      <p class="pb-msg ${pr.ok ? "ok" : ""}" id="promoMsg">${esc(pr.msg)}</p>
    </div>
    ${f.skoolBonus ? `<div class="pb-col gift ${pr.ok ? "off" : ""}"><b>🎁 Pas encore dans le Skool ?</b><p>${esc(f.skoolBonus)} avec ce workshop : cours, lives, exercices et la communauté des créateurs IA.</p></div>` : ""}
  </div>
  <form class="form" id="payform" style="grid-template-columns:1fr">
    <label class="chk"><input type="checkbox" id="cgv"> J'accepte les conditions de réservation et je confirme que mes informations sont exactes.</label>
    <p class="err" id="err"></p>
  </form>
  ${payButtons(f)}`;
}

function payButtons(f){
  const card = !S.static || !!f.paymentLink, ppOn = S.static && C.paypal && C.paypal.clientId;
  const pp = ppOn && !st.promo.ok; // remise membre : uniquement par carte (Stripe vérifie le code)
  if (!card && !pp) return `<div class="paysoon"><b>Le paiement en ligne ouvre très bientôt.</b><p>Les réservations s'ouvrent dans quelques jours. Rejoins le canal WhatsApp du Skool pour être prévenu(e) dès l'ouverture et garder ta place.</p><a class="btn btn-lime btn-sm" href="https://chat.whatsapp.com/BBF6IarQ6EIJTpxFCDZwci" target="_blank" rel="noopener">Être prévenu(e) sur WhatsApp →</a></div>
  <div class="nav-step"><button class="btn btn-ghost" id="back">← Coordonnées</button><span></span></div>`;
  return `${card ? `<div style="display:grid;gap:14px;margin-top:26px">
    <button class="btn btn-lime" id="pay" type="button" style="background:#15803D;box-shadow:0 6px 0 #0A4D24;width:100%;justify-content:center">Payer ${S.eur(price(f))} en une fois <span class="arr">→</span></button>
    <button class="btn btn-line" id="pay3" type="button" style="width:100%;justify-content:center">Payer en 3 fois sans frais : 3 × ${(Math.round(price(f) / 3 * 100) / 100).toLocaleString("fr-FR", {minimumFractionDigits: 2, maximumFractionDigits: 2})} € <span class="arr">→</span></button>
    <p class="pp-or" style="margin:0">En 3 fois : sur la page suivante, choisis « Klarna ». 3 prélèvements, un tous les 30 jours, sous réserve d'acceptation par Klarna.</p>
  </div>` : ""}
  <div class="nav-step"><button class="btn btn-ghost" id="back">← Coordonnées</button><span></span></div>
  ${pp ? `<div class="pp-wrap"><p class="pp-or">${card ? "ou" : "Paiement"} avec PayPal, en une fois ou en 4X sans frais</p><div id="pp-btns"></div><div class="pp-msg" data-pp-message data-pp-amount="${price(f)}" data-pp-style-text-color="white"></div></div>` : ""}
  ${ppOn && st.promo.ok ? `<p class="pp-or" style="margin-top:14px">La remise membre Skool s'applique au paiement par carte.</p>` : ""}
  <p class="secure">🔒 Paiement sécurisé${card ? " avec Stripe : carte, ou en 3 fois avec Klarna" : ""}${pp ? (card ? " ou PayPal" : " avec PayPal") : ""}</p>`;
}

/* ---------- PayPal (site sans serveur) ---------- */
let ppLoading = null;
function loadPayPal(){
  if (window.paypal) return Promise.resolve();
  if (!ppLoading) ppLoading = new Promise((res, rej) => {
    const sc = document.createElement("script");
    sc.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(C.paypal.clientId)}&currency=EUR&locale=fr_FR&intent=capture&enable-funding=paylater&components=buttons,messages`;
    sc.onload = res; sc.onerror = rej; document.head.appendChild(sc);
  });
  return ppLoading;
}
function mountPayPal(){
  const box = $("#pp-btns"); if (!box) return;
  const f = S.formula(st.formula), s = S.session(st.session);
  loadPayPal().then(() => {
    if (!$("#pp-btns")) return;
    window.paypal.Buttons({
      style: {layout: "vertical", shape: "pill", label: "pay"},
      onClick: (d, actions) => { if (!$("#cgv").checked) { $("#err").textContent = "Coche la case pour confirmer ta réservation."; return actions.reject(); } return actions.resolve(); },
      createOrder: (d, actions) => actions.order.create({purchase_units: [{
        amount: {currency_code: "EUR", value: price(f).toFixed(2)},
        description: `Workshop IA · ${f.name} · ${S.range(s)}`.slice(0, 127),
        custom_id: `${s.id}${st.promo.ok ? "_MEMBRE" : ""}`.slice(0, 127)}]}),
      onApprove: (d, actions) => actions.order.capture().then(() => { st.result = {status: "paid", id: d.orderID}; go(5); }),
      onError: () => { $("#err").textContent = "Le paiement PayPal n'a pas abouti. Réessaie ou paie par carte."; }
    }).render("#pp-btns");
  }).catch(() => { box.innerHTML = `<p class="mut">PayPal ne répond pas pour le moment.</p>`; });
}

async function applyPromo(){
  if (st.promo.ok) { st.promo = {code: "", ok: false, percent: 0, msg: ""}; render(); return; }
  const code = ($("#promo").value || "").trim().toUpperCase();
  if (!code) { st.promo.msg = "Entre ton code membre."; render(); return; }
  let ok = false, percent = C.promo.percent;
  if (S.static) ok = (C.promo.hashes || []).includes(sha256(code));
  else {
    try {
      const r = await fetch("/api/promo", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({code})});
      const j = await r.json(); ok = !!j.valid; if (j.percent) percent = j.percent;
    } catch (e) { ok = false; }
  }
  st.promo = ok ? {code, ok: true, percent, msg: `Code appliqué : −${percent} % sur ton workshop.`}
                : {code, ok: false, percent: 0, msg: "Ce code n'est pas valide. Copie-le tel quel depuis le Skool."};
  render();
}

/* ---------- confirmation ---------- */
function ics(s, f){
  const d = x => x.replace(/-/g, "");
  const end = S.d(s.end); end.setDate(end.getDate() + 1);
  const txt = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//SKOOL Workshops//FR","BEGIN:VEVENT",`UID:${s.id}@skool-workshops`,`DTSTART;VALUE=DATE:${d(s.start)}`,`DTEND;VALUE=DATE:${d(S.iso(end))}`,`SUMMARY:Workshop IA SKOOL · ${f.name}`,`DESCRIPTION:${C.schedule}`,"END:VEVENT","END:VCALENDAR"].join("\r\n");
  return "data:text/calendar;charset=utf-8," + encodeURIComponent(txt);
}
function stepDone(){
  const f = S.formula(st.formula), s = S.session(st.session), r = st.result || {};
  const paid = r.status === "paid" || r.status === "demo";
  return `<div class="done-box">
    <div class="mascot-slot pink" data-m="duo" data-pose="bravo"></div>
    <span class="kicker" style="justify-content:center">${paid ? "Paiement validé" : "Réservation enregistrée"}</span>
    <h2>C'est réservé${st.info.firstName ? ", " + esc(st.info.firstName) : ""} !</h2>
    <p class="mut" style="max-width:520px;margin:0 auto 24px">${esc(f.name)} · ${S.rangeLong(s)}. ${paid ? "Ton reçu de paiement arrive par e-mail." : "Nous revenons vers toi par e-mail pour finaliser le paiement."} Les accès à la session te seront envoyés avant le début.${!st.promo.ok && f.skoolBonus ? ` Ton bonus (${esc(f.skoolBonus.toLowerCase())}) t'est envoyé par e-mail.` : ""}</p>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <a class="btn btn-lime" href="${ics(s, f)}" download="workshop-skool.ics">Ajouter à mon agenda</a>
      <a class="btn btn-ghost" href="index.html">Retour à l'accueil</a>
    </div>
    ${r.id ? `<p class="mut" style="margin-top:22px;font-size:13px">Référence : ${esc(r.id)}</p>` : ""}
  </div>`;
}

function modal(title, text, actions){
  $("#m-t").textContent = title; $("#m-p").textContent = text;
  $("#m-a").innerHTML = ""; actions.forEach(([label, cls, fn]) => { const b = document.createElement("button"); b.className = "btn btn-sm " + cls; b.textContent = label; b.onclick = () => { $("#modal").classList.remove("on"); fn && fn(); }; $("#m-a").appendChild(b); });
  $("#modal").classList.add("on");
}

async function pay(){
  const f = S.formula(st.formula), s = S.session(st.session), err = $("#err");
  if (!$("#cgv").checked) { err.textContent = "Coche la case pour confirmer ta réservation."; return; }
  if (S.left(s) <= 0) { err.textContent = "Désolé, cette session vient d'être complète. Choisis une autre date."; return; }
  const btn = this instanceof HTMLElement ? this : $("#pay"); btn.disabled = true; btn.textContent = "Un instant…";
  if (window.SKWT) window.SKWT("paiement", btn.id === "pay3" ? "klarna_3x" : "en_une_fois", st.formula);
  if (S.static) {
    const u = new URL(f.paymentLink);
    if (st.info.email) u.searchParams.set("prefilled_email", st.info.email);
    u.searchParams.set("client_reference_id", `${s.id}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`); // aucune donnée perso dans l'adresse
    if (st.promo.ok) u.searchParams.set("prefilled_promo_code", st.promo.code);
    try { sessionStorage.setItem("skw-booking", JSON.stringify({formula: st.formula, session: st.session, info: {firstName: st.info.firstName}, promo: st.promo})); } catch (e) {}
    location.href = u.toString(); return;
  }
  if (S.demo) {
    modal("Aperçu du site", "Sur votre site en ligne, ce bouton ouvre la page de paiement sécurisée. Ici, on simule un paiement réussi.", [
      ["Annuler", "btn-line", () => { btn.disabled = false; btn.innerHTML = `Payer ${S.eur(price(f))} <span class="arr">→</span>`; }],
      ["Simuler le paiement", "btn-dark", () => {
        let local = {}; try { local = JSON.parse(localStorage.getItem("skw-demo") || "{}"); } catch (e) {}
        local[s.id] = (local[s.id] || 0) + 1; try { localStorage.setItem("skw-demo", JSON.stringify(local)); } catch (e) {}
        S.taken[s.id] = (S.taken[s.id] || 0) + 1;
        st.result = {status: "demo", id: "DEMO-" + Date.now().toString(36).toUpperCase()}; go(5);
      }]]);
    return;
  }
  try {
    const r = await fetch("/api/bookings", {method: "POST", headers: {"Content-Type": "application/json"},
      body: JSON.stringify({sessionId: s.id, ...st.info, promoCode: st.promo.ok ? st.promo.code : ""})});
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || "Erreur");
    try { sessionStorage.setItem("skw-booking", JSON.stringify({id: j.id, formula: st.formula, session: st.session, info: st.info})); } catch (e) {}
    if (j.url) { location.href = j.url; return; }
    st.result = j; go(5);
  } catch (e) {
    err.textContent = e.message === "full" ? "Cette session vient d'être complète, choisis une autre date." : "Le paiement n'a pas pu démarrer. Réessaie dans un instant.";
    btn.disabled = false; btn.innerHTML = `Payer ${S.eur(price(f))} <span class="arr">→</span>`;
  }
}

function bind(){
  const P = $("#panel");
  P.querySelectorAll("[data-f]").forEach(b => b.onclick = () => { if (st.formula !== b.dataset.f) { st.session = null; st.month = null; st.themeFilter = ""; } st.formula = b.dataset.f; render(); });
  P.querySelectorAll("[data-s]").forEach(b => b.onclick = () => { st.session = b.dataset.s; const d = S.d(S.session(st.session).start); st.month = new Date(d.getFullYear(), d.getMonth(), 1); render(); });
  P.querySelectorAll("[data-mv]").forEach(b => b.onclick = () => { st.month = new Date(st.month.getFullYear(), st.month.getMonth() + +b.dataset.mv, 1); render(); });
  P.querySelectorAll("[data-th]").forEach(b => b.onclick = () => { st.themeFilter = b.dataset.th; st.month = null; if (st.session && st.themeFilter && S.session(st.session).theme !== st.themeFilter) st.session = null; render(); });
  const n1 = $("#next1"); if (n1) n1.onclick = () => go(2);
  const n2 = $("#next2"); if (n2) n2.onclick = () => go(3);
  const bk = $("#back"); if (bk) bk.onclick = () => { if (st.step === 3) saveForm(); go(st.step - 1); };
  const n3 = $("#next3"); if (n3) n3.onclick = () => {
    saveForm(); const i = st.info, err = $("#err");
    if (!i.firstName || !i.lastName) return err.textContent = "Indique ton prénom et ton nom.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(i.email || "")) return err.textContent = "Ton adresse e-mail ne semble pas valide.";
    go(4);
  };
  const p = $("#pay"); if (p) p.onclick = pay;
  const p3 = $("#pay3"); if (p3) p3.onclick = pay;
  const ap = $("#applyPromo"); if (ap) ap.onclick = applyPromo;
  const pi = $("#promo"); if (pi) pi.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); applyPromo(); } };
}
function saveForm(){ const f = $("#form"); if (!f) return; st.info = Object.fromEntries(new FormData(f).entries()); }

function render(){
  renderSteps(); renderRecap();
  $("#panel").innerHTML = [null, stepFormula, stepDate, stepInfo, stepPay, stepDone][st.step]();
  S.mascots($("#panel")); bind();
  if (st.step === 4) mountPayPal();
  if (window.SKWT && render.tracked !== st.step) { render.tracked = st.step; window.SKWT("etape", st.step, st.formula); } // mesure d'audience anonyme (stats.js)
}

document.addEventListener("skw-ready", async () => {
  S = window.SKW; C = S.C;
  // retour de Stripe (site en ligne) : reserver.html?booking=ID
  const q = new URLSearchParams(location.search);
  if (q.get("merci") && S.session(q.get("merci"))) {
    let saved = {}; try { saved = JSON.parse(sessionStorage.getItem("skw-booking") || "{}"); } catch (e) {}
    st.session = q.get("merci"); st.formula = S.session(st.session).formula;
    st.info = saved.info || {}; if (saved.promo) st.promo = saved.promo;
    st.result = {status: "paid"}; st.step = 5; render(); return;
  }
  if (q.get("booking")) {
    let saved = {}; try { saved = JSON.parse(sessionStorage.getItem("skw-booking") || "{}"); } catch (e) {}
    try {
      const r = await fetch("/api/bookings/" + encodeURIComponent(q.get("booking")));
      const j = await r.json();
      st.formula = j.formula; st.session = j.sessionId; st.info = {firstName: j.firstName}; st.result = j; st.step = 5;
    } catch (e) { Object.assign(st, saved); st.step = saved.session ? 5 : 1; }
    render(); return;
  }
  const h = decodeURIComponent(location.hash.slice(1));
  if (S.formula(h)) { st.formula = h; st.step = 2; }
  else if (S.session(h)) { st.session = h; st.formula = S.session(h).formula; st.step = 2; }
  render();
});
})();
