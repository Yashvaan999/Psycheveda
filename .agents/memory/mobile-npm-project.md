---
name: mobile/ is a separate npm project
description: Where npm packages must be installed in this repo and how to get past the peer-dep conflict.
---

# Installing npm packages for the Expo app

The actual app is the Expo project in `mobile/` (its own `package.json`; the
workflow runs `cd mobile && npx expo start`). The Replit package-management
tool (`installLanguagePackages`) installs into the **workspace root**
`package.json` / `node_modules`, NOT into `mobile/`. A package installed that way
will be missing at runtime ("Unable to resolve module X").

**To install a runtime dependency for the app:** run npm inside `mobile/`:
`cd mobile && npm install --no-audit --legacy-peer-deps --save <pkg>`.

`--legacy-peer-deps` is required: the project has a pre-existing peer conflict
(expo-router wants a specific expo-linking version) that makes plain
`npm install` fail with ERESOLVE.

**Why:** monorepo-ish layout where the managed tool targets root but the app is a
subdir. **How to apply:** any time the app needs a new npm dependency (e.g. the
`openai` package used by the server API route).
