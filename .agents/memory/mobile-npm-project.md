---
name: mobile/ is a separate npm project
description: Where npm packages must be installed in this repo and how to get past the peer-dep conflict.
---

# Installing npm packages for the Expo app

The production app lives in **`mobile/`** (own `package.json`).

**Local web dev:**

```bash
cd mobile && npm install --legacy-peer-deps && npm run web
```

→ **http://localhost:5001** (`expo start --web --port 5001`)

**Replit** may still use port 5000 in `.replit` workflow — adjust if preview conflicts with macOS AirPlay.

The workspace **root** `package.json` is a separate Vite stub — do not install mobile runtime deps there.

## Install a new package

```bash
cd mobile && npm install --no-audit --legacy-peer-deps --save <pkg>
```

`--legacy-peer-deps` is required (expo-router / expo-linking peer conflict).

## Progress-related deps (already present)

- `@supabase/supabase-js` — data + auth
- `react-native-svg` — TrackModal sparkline
- `@react-native-async-storage/async-storage` — Supabase session

Update `architecture.md` when adding libraries that change tracking or auth.
