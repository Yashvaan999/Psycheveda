---
name: Expo Router server SSR + Supabase
description: Why setting Expo web output to "server" crashes a Supabase-based app during SSR and how to fix it.
---

# Expo Router `output: "server"` SSR breaks Supabase client

Setting `web.output: "server"` in `app.json` (needed to enable Expo Router API
routes, e.g. `app/*+api.js`) makes Expo **server-render every page in Node**, not
just the API routes. During that Node render the module-level Supabase client is
constructed, which fails twice:

1. **Realtime WebSocket** — Supabase's realtime client throws on construction when
   no global `WebSocket` exists (Node <22). Error: "Node.js 20 detected without
   native WebSocket support."
2. **AsyncStorage `window`** — Supabase eagerly recovers the persisted session on
   init, calling `@react-native-async-storage/async-storage`, which references
   `window` (undefined in Node). Error: `ReferenceError: window is not defined`.

Either one yields a 500 and a black-screen `_error.bundle` on the web preview.

**Fix (in the supabase client module):** detect server via `typeof window === 'undefined'`, then:
- shim `globalThis.WebSocket` with a throwing dummy class (never instantiated since realtime is never connected on the server), and
- pass an in-memory `storage` object plus `autoRefreshToken:false` / `persistSession:false` for the auth config when on the server. Keep `AsyncStorage` + persistence on the client.

**Why:** the app never uses realtime or a real session during SSR, so neutralizing
both on the server side is safe and keeps client behavior unchanged.

**How to apply:** any RN/Expo web app that uses Supabase AND needs API routes
(`output:"server"`). If you only need a static site, avoid `output:"server"` entirely.
