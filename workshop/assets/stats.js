/* =====================================================================
   MESURE D'AUDIENCE — SKOOL Workshops
   Sans cookie et sans rien stocker dans le navigateur. Aucune donnée
   personnelle (ni nom, ni e-mail, ni adresse IP) n'est envoyée ou gardée.
   Envoie : la page vue, d'où vient le visiteur (site ou lien de pub),
   et les étapes clés (clic « Réserver », étape de réservation, paiement).
   Respecte « Do Not Track » et « Global Privacy Control ».
   ===================================================================== */
(function () {
  // Adresse du compteur (Worker Cloudflare « skool-workshop-stats »). Vide = rien n'est envoyé.
  var ENDPOINT = "https://skool-workshop-stats.mathias-drte.workers.dev/e";
  if (!ENDPOINT || !navigator.sendBeacon) { window.SKWT = function () {}; return; }
  if (navigator.doNotTrack === "1" || window.doNotTrack === "1" || navigator.globalPrivacyControl === true) { window.SKWT = function () {}; return; }

  var q = new URLSearchParams(location.search);
  var utm = {us: q.get("utm_source") || "", uc: q.get("utm_campaign") || "", ut: q.get("utm_content") || ""};
  var fromAd = q.has("fbclid");
  var refHost = "";
  try { if (document.referrer) refHost = new URL(document.referrer).hostname; } catch (e) {}

  function send(e, l, f, extra) {
    var b = {e: e, p: location.pathname};
    if (l != null && l !== "") b.l = String(l);
    if (f) b.f = String(f);
    if (extra) for (var k in extra) if (extra[k]) b[k] = extra[k];
    try { navigator.sendBeacon(ENDPOINT, new Blob([JSON.stringify(b)], {type: "text/plain"})); } catch (err) {}
  }

  // utilisé par book.js pour les étapes de réservation
  window.SKWT = function (e, l, f) { send(e, l, f); };

  send("pageview", "", "", {r: refHost, us: utm.us, uc: utm.uc, ut: utm.ut, fb: fromAd ? 1 : 0});

  document.addEventListener("click", function (ev) {
    var a = ev.target && ev.target.closest ? ev.target.closest("a[href]") : null;
    if (!a) return;
    var h = a.getAttribute("href") || "";
    if (/reserver\.html/.test(h) && !/reserver\.html$/.test(location.pathname)) send("reserver", location.pathname);
    else if (/chat\.whatsapp\.com/.test(h)) send("whatsapp", location.pathname);
  }, true);
})();
