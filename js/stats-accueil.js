/* =====================================================================
   MESURE D'AUDIENCE — page d'accueil cerega.fr (formation en ligne)
   Même compteur Cloudflare que les pages workshops. Sans cookie, rien
   stocké dans le navigateur, aucune donnée personnelle envoyée.
   Envoie : la page vue (avec d'où vient le visiteur), les clics vers
   le Skool (événement « etape », libellé « clic-skool ») et les clics
   vers le WhatsApp (événement « whatsapp »).
   Respecte « Do Not Track » et « Global Privacy Control ».
   Si le compteur ne répond pas, la page fonctionne normalement.
   ===================================================================== */
(function () {
  if (window.__cgStats) return; window.__cgStats = true;
  var ENDPOINT = "https://skool-workshop-stats.mathias-drte.workers.dev/e";
  if (!navigator.sendBeacon) return;
  if (navigator.doNotTrack === "1" || window.doNotTrack === "1" || navigator.globalPrivacyControl === true) return;

  var q = new URLSearchParams(location.search);
  var refHost = "";
  try { if (document.referrer) refHost = new URL(document.referrer).hostname; } catch (e) {}

  function send(b) {
    b.p = location.pathname;
    try { navigator.sendBeacon(ENDPOINT, new Blob([JSON.stringify(b)], {type: "text/plain"})); } catch (err) {}
  }

  send({e: "pageview", r: refHost, us: q.get("utm_source") || "", uc: q.get("utm_campaign") || "",
        ut: q.get("utm_content") || "", fb: q.has("fbclid") ? 1 : 0});

  document.addEventListener("click", function (ev) {
    var a = ev.target && ev.target.closest ? ev.target.closest("a[href]") : null;
    if (!a) return;
    var h = a.getAttribute("href") || "";
    if (h.indexOf("skool.com") > -1) send({e: "etape", l: "clic-skool"});
    else if (h.indexOf("chat.whatsapp.com") > -1) send({e: "whatsapp", l: "clic-whatsapp"});
  }, true);
})();
