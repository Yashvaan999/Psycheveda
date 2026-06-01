import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const url =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  Constants?.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL;
const anonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  Constants?.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

// During web SSR (Expo Router `output: "server"`) the client is created in a
// Node.js context with no browser globals. Two things break:
//  1) Supabase's realtime client throws on construction without a WebSocket.
//  2) AsyncStorage touches `window` when recovering the persisted session.
// We never use realtime or a session on the server, so we shim WebSocket and
// swap to an in-memory storage with session persistence/refresh disabled.
const isServer = typeof window === 'undefined';

if (isServer && typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = class {
    constructor() {
      throw new Error('WebSocket is not available during server-side rendering.');
    }
  };
}

const memoryStore = {};
const serverStorage = {
  getItem: async (key) => (key in memoryStore ? memoryStore[key] : null),
  setItem: async (key, value) => {
    memoryStore[key] = value;
  },
  removeItem: async (key) => {
    delete memoryStore[key];
  },
};

export const supabase = createClient(url, anonKey, {
  auth: {
    storage: isServer ? serverStorage : AsyncStorage,
    autoRefreshToken: !isServer,
    persistSession: !isServer,
    detectSessionInUrl: false,
  },
});
