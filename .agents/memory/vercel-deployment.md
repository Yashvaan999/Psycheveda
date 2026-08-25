---
name: Vercel web deployment
description: Host Expo web build on Vercel with Supabase and Razorpay env vars.
---

# Vercel deployment (Expo web)

## Build

```bash
cd mobile
npm run build   # same as export:web → dist/
```

`mobile/vercel.json` — SPA rewrites for Expo Router deep links.

## Vercel project settings

| Setting | Value |
|---------|--------|
| Root Directory | `mobile` |
| Framework | Other |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install --legacy-peer-deps` |

## Environment variables (Production)

Set in **Vercel → Project → Settings → Environment Variables**:

```env
EXPO_PUBLIC_SUPABASE_URL=https://tqdpjzekotwxnueemacu.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon public from Supabase API settings>
EXPO_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxx
```

Check **Production** (and Preview if needed). **Redeploy** after any env change.

## Supabase Auth (required)

**Authentication → URL configuration:**

| Field | Value |
|-------|--------|
| Site URL | `https://your-app.vercel.app` |
| Redirect URLs | `https://your-app.vercel.app/**` |

Users must log in on the hosted URL after deploy.

## Favicon

`mobile/app.json` → `web.favicon`: `./assets/favicon-v2.png` (Psycheveda icon, not full logo).

Hard-refresh or incognito if browser caches old favicon.

## Deploy checklist

```text
☐ npm run build succeeds locally
☐ Vercel env vars set (all three EXPO_PUBLIC_*)
☐ Vercel redeployed
☐ Supabase Auth URLs = Vercel domain
☐ Supabase secrets: RAZORPAY_KEY_ID + SECRET
☐ create-order + verify-payment deployed
☐ Pay tested on hosted URL (Netbanking or test card)
```

## CLI deploy (alternative)

```bash
cd mobile
npx vercel --prod
```

Set env vars in dashboard afterward if not configured at import time.
