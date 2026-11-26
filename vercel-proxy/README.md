# LPUQuick Minimal Vercel Proxy

This directory hosts a minimal, static-less Vercel external rewrite entry point targeting the existing Cloudflare Worker origin:

`Visitor -> Free Vercel domain -> Cloudflare Workers (https://lpuquick.nivasnaidu07.workers.dev) -> Isolated Sandbox Supabase`

## Setup (Authorized Vercel Team Only)

1. Import `Nivas67/LPUQuick` on branch `feat/cloudflare-workers` into Vercel.
2. Set **Root Directory** to `vercel-proxy`.
3. Keep **Framework Preset** as `Other` (`"framework": null`, `"buildCommand": null`, `"outputDirectory": "static"`).
4. Zero backend code, zero `node_modules`, and zero Vercel Functions are deployed here.

## Required Cloudflare Access Prerequisite

Before visitors or payment webhooks can load through the Vercel proxy without hitting a `302` SSO login redirect to `*.cloudflareaccess.com`, update Cloudflare Zero Trust Access on `lpuquick.nivasnaidu07.workers.dev` so public customer routes (`/`, `/api/*`, `/sandbox-payment-return`, static assets) are reachable publicly while keeping `/admin*` (or Access policies) protected per your security requirements.
