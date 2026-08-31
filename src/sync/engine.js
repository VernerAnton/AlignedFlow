// The sync engine: what gets written where, how a device joins an existing
// key, and how remote changes come back. Deliberately free of React — App
// drives it through a thin hook, and the emulator tests drive it directly.

import { getDocs, onSnapshot, setDoc, deleteDoc, writeBatch, serverTimestamp } from "firebase/firestore";
import { getDb, presetsCol, presetDoc, stateDoc, COLLECTION } from "./firestore";

// Identifies this browser in written documents. Only ever read by a human
// looking at the console wondering which device wrote something — the echo
// guard below uses Firestore's own metadata, not this.
const DEVICE_KEY = "alignedflow-device-id";
export function deviceId() {
  let id = null;
  try { id = localStorage.getItem(DEVICE_KEY); } catch (e) { /* unavailable */ }
  if (!id) {
    id = `d_${Math.random().toString(36).slice(2, 8)}`;
    try { localStorage.setItem(DEVICE_KEY, id); } catch (e) { /* unavailable */ }
  }
  return id;
}

// A preset document is the preset itself plus write metadata. The id lives in
// the document path, so it is stripped from the body to avoid two sources of
// truth for it.
const toDoc = (preset) => {
  const { id, ...body } = preset;
  return { ...body, updatedAt: serverTimestamp(), updatedBy: deviceId() };
};
const fromDoc = (id, data) => {
  const { updatedAt, updatedBy, ...body } = data;
  return { id, ...body };
};

// ── Reading the current remote state ──

export async function fetchAll(key) {
  const out = {};
  for (const kind of Object.keys(COLLECTION)) {
    const snap = await getDocs(presetsCol(key, kind));
    out[kind] = snap.docs.map(d => fromDoc(d.id, d.data()));
  }
  return out;
}

// ── Joining a key ──
//
// Two situations, and they need different answers:
//
//   · The key is empty       → this device seeds it. Nothing can be lost.
//   · The key already has    → this device is joining devices that are already
//     routines                 in sync. Its own presets are almost certainly
//                              the same routines with different ids, because
//                              every device generated its own ids when it
//                              migrated from the pre-preset config. Merging
//                              blindly would give every device duplicates of
//                              everything.
//
// So the second case is the caller's decision, not this module's: "adopt" takes
// the cloud's routines, "merge" adds this device's on top. Either way the
// caller has already stashed a local backup — see useSync.
export async function connect(key, local, strategy = "adopt") {
  const remote = await fetchAll(key);
  const remoteEmpty = !remote.work.length && !remote.evening.length;

  if (remoteEmpty) {
    await pushAll(key, local);
    return { seeded: true, presets: { work: local.work.presets, evening: local.evening.presets } };
  }

  if (strategy === "merge") {
    const batch = writeBatch(getDb());
    const merged = {};
    for (const kind of Object.keys(COLLECTION)) {
      const have = new Set(remote[kind].map(p => p.id));
      const extra = local[kind].presets.filter(p => !have.has(p.id));
      for (const p of extra) batch.set(presetDoc(key, kind, p.id), toDoc(p));
      merged[kind] = [...remote[kind], ...extra];
    }
    await batch.commit();
    return { seeded: false, presets: merged };
  }

  return { seeded: false, presets: remote };
}

// Used only when seeding an empty key: every local preset, plus where this
// device currently is, so the first device's state is the starting point.
export async function pushAll(key, local) {
  const batch = writeBatch(getDb());
  for (const kind of Object.keys(COLLECTION)) {
    for (const p of local[kind].presets) batch.set(presetDoc(key, kind, p.id), toDoc(p));
  }
  batch.set(stateDoc(key, "selection"), {
    work: local.work.activeId, evening: local.evening.activeId,
    updatedAt: serverTimestamp(), updatedBy: deviceId(),
  });
  batch.set(stateDoc(key, "session"), {
    ...(local.session || { phaseId: "work", workCount: 0 }),
    updatedAt: serverTimestamp(), updatedBy: deviceId(),
  });
  await batch.commit();
}

// ── Writing ──

export const pushPreset = (key, kind, preset) => setDoc(presetDoc(key, kind, preset.id), toDoc(preset));
export const removePresetDoc = (key, kind, id) => deleteDoc(presetDoc(key, kind, id));

export const pushSelection = (key, sel) =>
  setDoc(stateDoc(key, "selection"), { ...sel, updatedAt: serverTimestamp(), updatedBy: deviceId() });

// The cycle position — which phase, and how many focus blocks into the run to
// the long break. Shared on purpose: the point is that four blocks spread over
// a laptop and a desktop still add up to one long break.
export const pushSession = (key, session) =>
  setDoc(stateDoc(key, "session"), {
    phaseId: session?.phaseId ?? "work",
    workCount: session?.workCount ?? 0,
    updatedAt: serverTimestamp(), updatedBy: deviceId(),
  });

// ── Listening ──
//
// Firestore reports our own writes back to us immediately, before the server
// has them (latency compensation). Those echoes carry hasPendingWrites, and
// acting on them would mean treating this device's own edit as a remote change
// — remounting the running timer for a change it just made itself. Skipped.
function isEcho(snapshot) {
  return snapshot.metadata.hasPendingWrites;
}

export function subscribe(key, handlers) {
  const unsubs = [];

  for (const kind of Object.keys(COLLECTION)) {
    unsubs.push(onSnapshot(presetsCol(key, kind), (snap) => {
      if (isEcho(snap)) return;
      handlers.onPresets?.(kind, snap.docs.map(d => fromDoc(d.id, d.data())));
    }, handlers.onError));
  }

  unsubs.push(onSnapshot(stateDoc(key, "selection"), (snap) => {
    if (isEcho(snap) || !snap.exists()) return;
    const d = snap.data();
    handlers.onSelection?.({ work: d.work, evening: d.evening });
  }, handlers.onError));

  unsubs.push(onSnapshot(stateDoc(key, "session"), (snap) => {
    if (isEcho(snap) || !snap.exists()) return;
    const d = snap.data();
    handlers.onSession?.({ phaseId: d.phaseId, workCount: d.workCount });
  }, handlers.onError));

  return () => unsubs.forEach(fn => fn());
}
