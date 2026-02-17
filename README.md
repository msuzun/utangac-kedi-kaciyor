# utangac-kedi-kaciyor

Next.js (App Router) + Kaboom.js ile hazırlanmış mini HTML5 oyun projesi.

## Kurulum

```bash
npm install
```

## Geliştirme

```bash
npm run dev
```

Tarayıcıda: `http://localhost:3000`

## Production build

```bash
npm run build
npm run start
```

## Dosya yapısı

```text
app/
  page.tsx
  globals.css
  game/
    page.tsx
    GameClient.tsx
    game.ts
next.config.js
package.json
```

## Vercel notu

`app/page.tsx` ve `app/game/page.tsx` içinde `dynamic = "force-static"` tanımlı; bu sayede route'lar statik üretime uygundur.
