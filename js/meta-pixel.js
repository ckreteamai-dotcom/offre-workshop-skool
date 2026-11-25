/* Pixel Meta (1922688461306329) — chargé uniquement après accord du visiteur (règles CNIL).
   Page d'accueil cerega.fr uniquement. Événements : PageView, ClicWhatsApp et ClicSkool. */
(function () {
  if (window.__cgPixel) return; window.__cgPixel = true;
  var ID = "1922688461306329", KEY = "cg-consent-meta";
  var choice = null; try { choice = localStorage.getItem(KEY); } catch (e) {}

  function load() {
    if (window.fbq) return;
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    window.fbq("init", ID);
    window.fbq("track", "PageView");
  }
  function ev(type, name, params) { if (window.fbq && choice === "yes") window.fbq(type, name, params || {}); }

  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a) return;
    var href = a.getAttribute("href") || "";
    var label = (a.textContent || "").replace(/\s+/g, " ").trim().slice(0, 60);
    if (href.indexOf("chat.whatsapp.com") > -1) ev("trackCustom", "ClicWhatsApp", {bouton: label, page: location.pathname});
    else if (href.indexOf("skool.com") > -1) ev("trackCustom", "ClicSkool", {bouton: label, page: location.pathname});
  }, true);

  function save(v) { choice = v; try { localStorage.setItem(KEY, v); } catch (e) {} }
  function banner() {
    var css = document.createElement("style");
    css.textContent = "#cg-consent{position:fixed;left:12px;right:12px;bottom:12px;z-index:2147483000;max-width:560px;margin:0 auto;background:#111;color:#fff;border:1px solid rgba(255,255,255,.18);border-radius:16px;padding:16px;font:14px/1.45 Inter,system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.4)}#cg-consent p{margin:0 0 12px}#cg-consent div{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap}#cg-consent button{font:600 14px Inter,system-ui,sans-serif;min-height:44px;padding:10px 18px;border-radius:999px;cursor:pointer;border:1px solid rgba(255,255,255,.35);background:transparent;color:#fff}#cg-consent button.ok{background:#fff;color:#111;border-color:#fff}";
    document.head.appendChild(css);
    var box = document.createElement("div");
    box.id = "cg-consent"; box.setAttribute("role", "dialog"); box.setAttribute("aria-label", "Cookies");
    box.innerHTML = "<p>On aimerait mesurer l'efficacité de nos publicités Instagram et Facebook avec le pixel Meta (cookies). Tu es d'accord ?</p><div><button type='button' class='no'>Refuser</button><button type='button' class='ok'>Accepter</button></div>";
    box.querySelector(".no").onclick = function () { save("no"); box.remove(); };
    box.querySelector(".ok").onclick = function () { save("yes"); box.remove(); load(); };
    document.body.appendChild(box);
  }

  if (choice === "yes") load();
  else if (choice !== "no") {
    if (document.body) banner(); else document.addEventListener("DOMContentLoaded", banner);
  }
})();
