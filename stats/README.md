# Compteur de visites — SKOOL Workshops

Mesure d'audience sans cookie pour cerega.fr/workshop. Les chiffres se lisent dans le tableau de bord « Visites du site Workshops » sur Claude.

- `worker.js` : le compteur (Cloudflare Worker). Il reçoit les événements, calcule une empreinte anonyme du jour (l'IP n'est jamais enregistrée) et écrit dans la base D1 `skool-workshop-stats`.
- `../workshop/assets/stats.js` : le petit script du site qui envoie les événements (page vue, clic « Réserver », étapes de réservation, clic sur Payer). Tant que `ENDPOINT` est vide, il n'envoie rien.

## Mettre le compteur en ligne (une seule fois, 3 minutes)

Dans le tableau de bord Cloudflare :

1. **Workers & Pages → Create → Create Worker** (« Hello World »), nom : `skool-workshop-stats`, puis **Deploy**.
2. **Edit code** : remplacer tout le code par le contenu de `worker.js`, puis **Deploy**.
3. **Settings → Bindings → Add → D1 database** : nom de la variable `DB`, base `skool-workshop-stats`. Enregistrer.
4. Ouvrir l'adresse du Worker (du type `https://skool-workshop-stats.mathias-drte.workers.dev`) : la page doit afficher « SKOOL stats : ok ».

Ou en ligne de commande, depuis ce dossier : `npx wrangler deploy` (le fichier `wrangler.toml` contient déjà le lien vers la base).

## Brancher le site

Dans `workshop/assets/stats.js`, mettre l'adresse du Worker suivie de `/e` :

```js
var ENDPOINT = "https://skool-workshop-stats.mathias-drte.workers.dev/e";
```

puis publier le site.

## Suivre chaque vidéo

Ajouter au lien mis en description de chaque pub : `?utm_source=instagram&utm_content=nom-de-la-video`
(par exemple `cerega.fr/workshop/?utm_source=instagram&utm_content=cinema-1`). La vidéo apparaît alors dans le tableau « Quelle vidéo amène du monde ».
