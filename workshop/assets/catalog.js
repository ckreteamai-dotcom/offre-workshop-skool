/* =====================================================================
   CATALOGUE DES WORKSHOPS — seule source de vérité (site + serveur)
   Pour changer un prix, une date ou un nombre de places : c'est ici.
   ===================================================================== */
window.SKOOL_CATALOG = {
  brand: "SKOOL Workshops",
  socialReach: "50 000+",
  currency: "EUR",

  /* Réduction membres du Skool.
     Sans serveur : le code n'est jamais écrit en clair, seule son empreinte (hashes) est dans le site.
     Le vrai calcul de la remise est fait par Stripe (code promo identique à créer dans Stripe).
     Avec serveur : le code est vérifié par le serveur (variable PROMO_CODE du fichier .env). */
  promo: { percent: 40, label: "Code membre Skool", hashes: ["04d70563009e8aaa094b5df6ceb883af4aed55386a549a21e8be4c74b2f639a5"] },

  /* PAIEMENT (site sans serveur, ex. GitHub Pages)
     - Carte : un lien de paiement Stripe par formule (champ paymentLink de chaque formule),
       avec « Autoriser les codes promotionnels » activé et le code membre créé dans Stripe (−40 %).
     - PayPal (dont le paiement en 4X) : l'identifiant client PayPal (Client ID, public). */
  paypal: { clientId: "" },

  formulas: [
    {
      id: "perfectionnement",
      page: "workshop-ia-workflow-production-2-jours.html",
      name: "Construire un workflow de production IA",
      nav: "2 jours",
      short: "2 jours",
      days: 2,
      price: 490,
      capacity: 5,
      level: "Intermédiaire",
      color: "lime",
      mascot: "le-m",
      tagline: "Du brief à l'export : une méthode de production IA qui tient la route.",
      pitch: "Deux jours pour construire, de A à Z, un workflow de production IA solide : choix des outils, découpage, organisation, versions et exports. Tu repars avec une méthode documentée, prête à servir sur tous tes projets.",
      deliverable: "Un workflow documenté et réutilisable sur tes propres projets.",
      skoolBonus: "1 semaine de Skool offerte",
      includes: [
        "2 jours en live, en tout petit groupe",
        "5 participants maximum",
        "On part d'un vrai brief, jusqu'à l'export",
        "Versions, retours et exports maîtrisés",
        "Ton workflow documenté et réutilisable"
      ],
      // Stripe Payment Link (optionnel) : collez l'URL ici si vous n'utilisez pas la clé Stripe côté serveur
      paymentLink: "https://buy.stripe.com/fZu00l6Jc5KFb7E7O36Ri01"
    },
    {
      id: "debutant",
      page: "workshop-ia-realiser-film-5-jours.html",
      name: "Réaliser et livrer un film IA",
      nav: "5 jours",
      short: "5 jours · 1 semaine",
      days: 5,
      price: 990,
      capacity: 10,
      level: "Intermédiaire",
      color: "violet",
      mascot: "cerega",
      tagline: "Une semaine pour sortir un vrai film IA, fini et livré.",
      pitch: "Cinq jours pour réaliser un film IA de A à Z, du brief à la livraison : direction artistique, storyboard, images clés, animation, montage et son. Pub, clip ou court-métrage : tu choisis, on le finit ensemble.",
      deliverable: "Un film IA finalisé de 30 à 60 secondes : pub, clip ou court-métrage, au choix.",
      skoolBonus: "1 mois de Skool offert",
      includes: [
        "5 jours en live, du lundi au vendredi",
        "10 participants maximum",
        "DA, storyboard, images, animation, son",
        "Retours et finitions avant livraison",
        "Ton film IA de 30 à 60 secondes, fini"
      ],
      paymentLink: "https://buy.stripe.com/fZu9AV2sWa0VgrY0lB6Ri02"
    },
    {
      id: "complet",
      page: "laboratoire-realisation-ia-10-jours.html",
      name: "Laboratoire intensif de réalisation IA",
      nav: "10 jours",
      short: "10 jours · 2 semaines",
      days: 10,
      price: 1390,
      capacity: 10,
      level: "Tous niveaux motivés",
      color: "pink",
      mascot: "duo",
      tagline: "Deux semaines, trois films : le labo pour passer réalisateur IA.",
      pitch: "Une première semaine pour poser ta méthode et tester deux approches de réalisation sur deux mini-films, puis une deuxième semaine pour réaliser ton court-métrage, du découpage à la projection finale.",
      deliverable: "Trois films (deux mini-films et un court-métrage) et tes workflows.",
      skoolBonus: "1 an de Skool offert",
      includes: [
        "Semaine 1 : DA, storyboard, workflow",
        "2 mini-films de 30 à 60 secondes",
        "Semaine 2 : ton court-métrage de 3 à 5 min",
        "Tu repars avec 3 films et tes workflows",
        "10 participants maximum"
      ],
      paymentLink: "https://buy.stripe.com/4gMeVf9VogpjcbI2tJ6Ri03",
      best: true
    }
  ],

  // Thèmes (ancienne formule 2 jours) : plus utilisés pour l'instant
  themes: [],

  // Horaires indicatifs affichés sur le site
  schedule: "10h – 13h et 14h – 17h (heure de Paris), en ligne",

  /* Sessions : start/end au format AAAA-MM-JJ.
     taken = places déjà vendues. Sans serveur, à mettre à jour à la main après chaque vente
     (les alertes « plus que X places » se basent dessus). Avec serveur, il est ignoré. */
  sessions: [
    { id: "db-2026-12-07", formula: "debutant",         start: "2026-12-07", end: "2026-12-11", taken: 0 },
    { id: "pf-2026-12-17", formula: "perfectionnement", start: "2026-12-17", end: "2026-12-18", taken: 0 },
    { id: "cp-2027-01-04", formula: "complet",          start: "2027-01-04", end: "2027-01-15", taken: 0 }
  ]
};
