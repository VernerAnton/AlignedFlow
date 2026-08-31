// Firestore connection. Everything Firebase-specific lives behind this module
// so the engine beside it stays a plain data layer.
//
// Nothing here is imported unless a sync key is set — App lazy-imports the
// engine, which imports this — so the ~90 KB of Firebase SDK never lands on a
// device running local-only.

import { initializeApp, getApps } from "firebase/app";
import {
  initializeFirestore, persistentLocalCache, persistentSingleTabManager,
  connectFirestoreEmulator, collection, doc,
} from "firebase/firestore";

const CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Whether this build was compiled with Firebase credentials at all. Vite bakes
// VITE_* in at build time, so a deploy made before the variables were added has
// none — and the app should say "not configured" rather than fail on connect.
export function isConfigured() {
  return !!(CONFIG.apiKey && CONFIG.projectId) || !!import.meta.env.VITE_FIRESTORE_EMULATOR;
}

let db = null;

export function getDb() {
  if (db) return db;
  const app = getApps().length ? getApps()[0] : initializeApp(CONFIG);
  // The persistent cache is what makes offline work: writes queue on disk and
  // replay when the connection returns, and reads are served locally meanwhile.
  // Single-tab manager rather than multi-tab — this is a PWA opened once per
  // device, and the multi-tab coordinator costs more than it buys here.
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentSingleTabManager() }),
  });
  const emu = import.meta.env.VITE_FIRESTORE_EMULATOR;
  if (emu) {
    const [host, port] = emu.split(":");
    connectFirestoreEmulator(db, host, Number(port));
  }
  return db;
}

// ── Paths ──
//
// One document per preset rather than one per store: two devices editing
// different routines at the same time must not have last-write-wins throw one
// of the edits away, and per-document granularity is what prevents that.
//
//   users/{key}/work-presets/{presetId}
//   users/{key}/evening-presets/{presetId}
//   users/{key}/state/selection   → which preset is active in each mode
//   users/{key}/state/session     → where the work cycle is
//
// Selection and session are separate documents even though both are "where am
// I right now": session changes at every phase boundary while selection barely
// changes, and splitting them keeps a busy write from clobbering a rare one.

export const COLLECTION = { work: "work-presets", evening: "evening-presets" };

export const presetsCol = (key, kind) => collection(getDb(), "users", key, COLLECTION[kind]);
export const presetDoc = (key, kind, id) => doc(getDb(), "users", key, COLLECTION[kind], id);
export const stateDoc = (key, name) => doc(getDb(), "users", key, "state", name);
