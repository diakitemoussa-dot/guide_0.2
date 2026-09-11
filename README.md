# guide_0.2 — Holo-Guide Kabakoo

Expérience immersive du MakerSpace Kabakoo — AR Web basée sur 8th Wall.

## Accès en ligne (GitHub Pages)
Une fois déployé : `https://diakitemoussa-dot.github.io/guide_0.2/`

## Lancer en local
Ouvre simplement `index.html` avec un serveur statique (requis pour AR / 8th Wall) :

```bash
npx serve .
# ou
python -m http.server 8000
```

Puis ouvre `http://localhost:8000`

## Stack
- 8th Wall Engine + Landing Page
- `external/runtime/runtime.js`
- `bundle.js` + `index.html` + `index.css` / `app.css`
- Assets 3D : `assets/` (robot.glb, scan.glb, etc.)
- Cibles image : `image-targets/` (bokoso)

## Déploiement GitHub Pages
Le dépôt utilise GitHub Pages (branch `main` / root). Toute mise à jour de `main` est publiée automatiquement.

## Auteur
Kabakoo Académie — Holo-Guide
