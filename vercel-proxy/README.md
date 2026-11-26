# LPUQuick Minimal Vercel Proxy

This directory hosts a minimal, static-less Vercel external rewrite entry point targeting the existing Cloudflare Worker origin:

`Visitor -> https://lpuquick.vercel.app -> Cloudflare Workers (https://lpuquick.nivasnaidu07.workers.dev) -> Isolated Sandbox Supabase`

## Deployed Project Details

- **Vercel Team:** `nivx` (`team_sqxa7yJ06dAU04P5Wivvslkx`)
- **Project Name:** `lpuquick` (`prj_kDJJuPsNCZ3CxCgbkaoDS1POEatJ`)
- **Production URL:** `https://lpuquick.vercel.app`
- **Team Staging Alias:** `https://lpuquick-nivx.vercel.app`
- **Framework Preset:** `Other` (`"framework": null`, `"buildCommand": null`, `"outputDirectory": "static"`)
- **Backend Duplication:** Zero backend code, zero `node_modules`, and zero Vercel Functions are deployed in this project.
- **Rewrite Cache Opt-Out:** Uses `x-vercel-enable-rewrite-caching: 0` on `/`, `/index.html`, `/sw.js`, `/api/:path*`, `/admin*`, `/ad-new*`, `/partner*`, and `/sandbox-payment*` so post–April 6, 2026 default external rewrite caching never serves stale HTML, service worker scripts, or API responses.

## CLI Deployment Commands

```bash
cd vercel-proxy
vercel link --scope nivx --project lpuquick
vercel --prod
```

If connecting GitHub later, attach `Nivas67/LPUQuick` on branch `feat/cloudflare-workers` (never `main`) with **Root Directory** set to `vercel-proxy`.

## Cloudflare Origin Deployment Command

```bash
npx wrangler login
npx wrangler deploy
```

## Required Cloudflare Zero Trust Access Configuration (No Blanket Bypass)

Currently `lpuquick.nivasnaidu07.workers.dev` enforces Cloudflare Zero Trust Access globally across `/*` (`302` to `broad-fire-8659.cloudflareaccess.com`), which blocks storefront visitors and payment gateway webhooks from reaching the Worker through `https://lpuquick.vercel.app`.

**Important:** In Cloudflare Zero Trust Self-Hosted Applications, leaving Path empty or setting `/` matches `/*` (the entire domain), so adding a `Bypass -> Everyone` rule on `/` would bypass security globally. Do **not** add a blanket `Everyone` bypass or disable security globally.

Instead, configure **path-scoped `Allow` Self-Hosted Access Applications** in **Cloudflare Zero Trust → Access → Applications** (after scoping off the global `workers.dev` Access toggle on `lpuquick`):

- **Protected by Cloudflare Access (`Allow` authorized admin/partner policies only):**
  - `lpuquick.nivasnaidu07.workers.dev/admin` and `/admin/*`
  - `lpuquick.nivasnaidu07.workers.dev/ad-new` and `/ad-new/*`
  - `lpuquick.nivasnaidu07.workers.dev/partner` and `/partner/*`
  - `lpuquick.nivasnaidu07.workers.dev/admin-preview` (plus `/preview-admin`, `/mobile-admin`, `/ad-new-preview`, `/ad-new/preview`, `/ad-new_preview`)
  - `lpuquick.nivasnaidu07.workers.dev/api/admin/*` and `/api/partner/*` and `/api/orders/admin/*`
  - `lpuquick.nivasnaidu07.workers.dev/api/checkout` and `/api/checkout/place`
  - `lpuquick.nivasnaidu07.workers.dev/api/auth/signin`, `/api/auth/signup`, `/api/auth/google`, `/api/auth/send-otp`, `/api/auth/verify-otp`, `/api/auth/profile/*`
- **Publicly reachable through `https://lpuquick.vercel.app` (still guarded by Express CORS/CSRF/CSP/rate-limit, sandbox isolation, HMAC session tokens, and HMAC-SHA256 webhook signatures):**
  - Customer storefront (`/`, `/index.html`, `/sw.js`, `/manifest.json`, `/css/*`, `/js/*`, `/assets/*`, `/img/*`, `/uploads/*`, `/sandbox-payment-return`)
  - Public sandbox catalog/cart/payment APIs (`/api/health`, `/api/realtime/config`, `/api/checkout/settings`, `/api/hostels/active`, `/api/client/status`, `/api/order-mode/status`, `/api/home*`, `/api/banners`, `/api/categories*`, `/api/products*`, `/api/search`, `/api/cart*`, `/api/auth/check-status/*`, `/api/auth/update-address`, `/api/orders/*`, `/api/payments/sandbox/*`, and HMAC-signed `POST /api/payments/webhook`)

*(Note: when an Access-protected path such as `/admin/` triggers Cloudflare Access SSO, Cloudflare redirects back to `lpuquick.nivasnaidu07.workers.dev` and issues `CF_Authorization` for `workers.dev`.)*
