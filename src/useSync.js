import { useState, useEffect, useRef, useCallback } from "react";
import { savePresets, saveSession } from "./dataStore";

// Cloud sync, wired to the preset stores and the work cycle.
//
// Local-first throughout: every write lands in localStorage first and is
// mirrored upward, so the app behaves identically with sync off, with sync on
// and offline, and with sync on and connected. Nothing here is imported until
// a key is set — the Firebase SDK arrives through a dynamic import, keeping it
// off devices that never turn sync on.

const KEY_STORAGE = "alignedflow-sync-key";
const BACKUP_STORAGE = "alignedflow-presync-backup";

// Long enough that the builder's own 300ms local debounce doesn't become a
// network write per keystroke.
const PUSH_DEBOUNCE_MS = 1500;

// Checked without importing anything Firebase: a build compiled before the
// env vars existed should say so rather than fail on connect.
export const syncConfigured = !!(
  (import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID) ||
  import.meta.env.VITE_FIRESTORE_EMULATOR
);

const readKey = () => { try { return localStorage.getItem(KEY_STORAGE) || ""; } catch (e) { return ""; } };
const writeKey = (k) => { try { k ? localStorage.setItem(KEY_STORAGE, k) : localStorage.removeItem(KEY_STORAGE); } catch (e) { /* unavailable */ } };

// Firestore stores the keys of a map field sorted, so a preset that has been
// through the cloud comes back with its keys in a different order than the
// one that was written — same content, different string. Comparing with a
// plain JSON.stringify therefore saw a change on every round trip, which
// counted this device's own edit as a remote one and remounted the running
// mode for nothing. Serialising keys in a fixed order means only real
// content differences register.
const sortDeep = (v) => Array.isArray(v) ? v.map(sortDeep)
  : (v && typeof v === "object") ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sortDeep(v[k])]))
  : v;
const stableJson = (v) => JSON.stringify(sortDeep(v));

const snapshotOf = (store) => Object.fromEntries(store.presets.map(p => [p.id, stableJson(p)]));

export function useSync({ work, evening, setWork, setEvening, runtime, applyRemoteSession, onRemoteApplied }) {
  const [key, setKey] = useState(readKey);
  // off · connecting · connected · error, plus "joining" while waiting for the
  // user to say how this device should join a key that already has routines.
  const [status, setStatus] = useState(() => (readKey() ? "connecting" : "off"));
  const [error, setError] = useState(null);
  const [pendingJoin, setPendingJoin] = useState(null);

  const engineRef = useRef(null);
  const unsubRef = useRef(null);
  const pushTimer = useRef(null);
  // What the cloud is believed to hold. Local state is diffed against this to
  // decide what to push, and it is updated when a remote change is applied so
  // an incoming edit is never echoed straight back.
  const syncedRef = useRef({ work: {}, evening: {} });
  const selectionRef = useRef({ work: null, evening: null });
  // A cycle position that arrived while this device was running. Applied when
  // the timer stops.
  const heldSessionRef = useRef(null);
  // Latest stores, for callbacks that must not close over a stale render.
  const storesRef = useRef({ work, evening });
  storesRef.current = { work, evening };
  const runtimeRef = useRef(runtime);
  runtimeRef.current = runtime;
  // A remote change to the preset that is running right now cannot be applied
  // mid-block — it would reset the timer under you. Held here until the timer
  // stops. A local settings change in the meantime discards it: you have just
  // expressed a newer intent than the one waiting.
  const heldRef = useRef({ work: null, evening: null });

  const loadEngine = useCallback(async () => {
    if (!engineRef.current) engineRef.current = await import("./sync/engine");
    return engineRef.current;
  }, []);

  // ── Applying what comes back ──

  const applyPresets = useCallback((kind, presets, activeChanged = true) => {
    if (!presets.length) return; // an empty collection means "not seeded", not "delete everything"
    const setStore = kind === "work" ? setWork : setEvening;
    setStore(prev => {
      const activeId = presets.some(p => p.id === prev.activeId) ? prev.activeId : presets[0].id;
      const next = { ...prev, presets, activeId };
      savePresets(kind, next);
      return next;
    });
    syncedRef.current[kind] = Object.fromEntries(presets.map(p => [p.id, stableJson(p)]));
    // The running mode mirrors its preset into once-only state, so a changed
    // active preset has to remount it — App keys the mode on this.
    if (activeChanged) onRemoteApplied?.(kind);
  }, [setWork, setEvening, onRemoteApplied]);

  const onPresets = useCallback((kind, presets) => {
    const rt = runtimeRef.current;
    const store = storesRef.current[kind];
    const incomingActive = presets.find(p => p.id === store.activeId);
    const currentActive = store.presets.find(p => p.id === store.activeId);
    const activeChanged = incomingActive && currentActive &&
      stableJson(incomingActive) !== stableJson(currentActive);

    if (activeChanged && rt?.[kind]?.isPlaying) {
      heldRef.current[kind] = presets;
      return;
    }
    applyPresets(kind, presets, activeChanged);
  }, [applyPresets]);

  const onSelection = useCallback((sel) => {
    selectionRef.current = sel;
    if (sel.work) setWork(prev => (prev.activeId === sel.work || !prev.presets.some(p => p.id === sel.work))
      ? prev : { ...prev, activeId: sel.work });
    if (sel.evening) setEvening(prev => (prev.activeId === sel.evening || !prev.presets.some(p => p.id === sel.evening))
      ? prev : { ...prev, activeId: sel.evening });
  }, [setWork, setEvening]);

  // The cycle position is adopted only while this device is idle. A running
  // device is the one actually doing the blocks, so it is the source of truth
  // and an idle machine in another room cannot move its count.
  const onSession = useCallback((session) => {
    if (runtimeRef.current?.work?.isPlaying) { heldSessionRef.current = session; return; }
    saveSession(session);
    applyRemoteSession?.(session);
  }, [applyRemoteSession]);

  // Whatever was held back lands the moment the timer stops.
  useEffect(() => {
    for (const kind of ["work", "evening"]) {
      if (heldRef.current[kind] && !runtime?.[kind]?.isPlaying) {
        const presets = heldRef.current[kind];
        heldRef.current[kind] = null;
        applyPresets(kind, presets);
      }
    }
    if (heldSessionRef.current && !runtime?.work?.isPlaying) {
      const s = heldSessionRef.current;
      heldSessionRef.current = null;
      saveSession(s);
      applyRemoteSession?.(s);
    }
  }, [runtime?.work?.isPlaying, runtime?.evening?.isPlaying, applyPresets, applyRemoteSession]);

  // ── Connecting ──

  const start = useCallback(async (k, strategy) => {
    setStatus("connecting"); setError(null);
    try {
      const engine = await loadEngine();
      const local = { work: storesRef.current.work, evening: storesRef.current.evening };
      const result = await engine.connect(k, local, strategy);

      if (!result.seeded && strategy === "adopt") {
        // Everything this device held before adopting the cloud's routines,
        // kept where it can be recovered even though the cloud copy is now
        // what is on screen.
        try { localStorage.setItem(BACKUP_STORAGE, JSON.stringify({ at: new Date().toISOString(), ...local })); } catch (e) { /* full */ }
      }
      applyPresets("work", result.presets.work);
      applyPresets("evening", result.presets.evening);

      unsubRef.current?.();
      unsubRef.current = engine.subscribe(k, {
        onPresets, onSelection, onSession,
        onError: (e) => { setStatus("error"); setError(e?.message || "Lost connection"); },
      });
      writeKey(k); setKey(k);
      setPendingJoin(null);
      setStatus("connected");
    } catch (e) {
      setStatus("error");
      setError(e?.code === "permission-denied"
        ? "Key rejected — check it matches the one in your Firestore rules."
        : (e?.message || "Could not connect"));
    }
  }, [loadEngine, applyPresets, onPresets, onSelection, onSession]);

  // Entering a key: if it already holds routines, the user decides whether this
  // device adopts them or adds its own, because merging blindly would give
  // every device duplicates of routines it already has under different ids.
  const connect = useCallback(async (k) => {
    const trimmed = (k || "").trim();
    if (!trimmed) { setError("Enter a sync key"); return; }
    if (!syncConfigured) { setError("This build has no Firebase configuration — see docs/firebase-setup.md"); setStatus("error"); return; }
    setStatus("connecting"); setError(null);
    try {
      const engine = await loadEngine();
      const remote = await engine.fetchAll(trimmed);
      const count = remote.work.length + remote.evening.length;
      if (count > 0) {
        setPendingJoin({ key: trimmed, work: remote.work.length, evening: remote.evening.length });
        setStatus("joining");
        return;
      }
      await start(trimmed, "adopt");
    } catch (e) {
      setStatus("error");
      setError(e?.code === "permission-denied"
        ? "Key rejected — check it matches the one in your Firestore rules."
        : (e?.message || "Could not reach Firestore"));
    }
  }, [loadEngine, start]);

  const resolveJoin = useCallback((strategy) => {
    if (!pendingJoin) return;
    start(pendingJoin.key, strategy);
  }, [pendingJoin, start]);

  const cancelJoin = useCallback(() => { setPendingJoin(null); setStatus("off"); }, []);

  const disconnect = useCallback(() => {
    unsubRef.current?.(); unsubRef.current = null;
    clearTimeout(pushTimer.current);
    writeKey(""); setKey(""); setStatus("off"); setError(null); setPendingJoin(null);
    syncedRef.current = { work: {}, evening: {} };
  }, []);

  // Reconnect on load if a key was saved.
  useEffect(() => {
    const saved = readKey();
    if (!saved) { setStatus("off"); return; }
    if (!syncConfigured) { setStatus("error"); setError("This build has no Firebase configuration"); return; }
    start(saved, "merge"); // an already-paired device keeps everything it has
    return () => { unsubRef.current?.(); unsubRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Pushing local changes ──
  //
  // Diffed against what the cloud is believed to hold, so only the preset that
  // actually changed is written, and a preset deleted here is deleted there
  // rather than being restored by the next snapshot.
  useEffect(() => {
    if (status !== "connected" || !key) return;
    clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(async () => {
      try {
        const engine = await loadEngine();
        for (const [kind, store] of [["work", work], ["evening", evening]]) {
          const now = snapshotOf(store);
          const was = syncedRef.current[kind];
          for (const [id, json] of Object.entries(now)) {
            if (was[id] !== json) await engine.pushPreset(key, kind, JSON.parse(json));
          }
          for (const id of Object.keys(was)) {
            if (!(id in now)) await engine.removePresetDoc(key, kind, id);
          }
          syncedRef.current[kind] = now;
        }
        const sel = { work: work.activeId, evening: evening.activeId };
        if (sel.work !== selectionRef.current.work || sel.evening !== selectionRef.current.evening) {
          selectionRef.current = sel;
          await engine.pushSelection(key, sel);
        }
      } catch (e) {
        setError(e?.message || "Could not save to the cloud");
      }
    }, PUSH_DEBOUNCE_MS);
    return () => clearTimeout(pushTimer.current);
  }, [work, evening, status, key, loadEngine]);

  // The cycle position, pushed as it moves. Not debounced with the presets
  // above: it changes only at phase boundaries, and it is the thing another
  // device most wants promptly.
  const pushedSession = useRef(null);
  useEffect(() => {
    if (status !== "connected" || !key) return;
    const s = runtime?.work?.session;
    if (!s) return;
    const json = JSON.stringify(s);
    if (json === pushedSession.current) return;
    pushedSession.current = json;
    loadEngine().then(engine => engine.pushSession(key, s)).catch(() => { /* queued offline */ });
  }, [runtime?.work?.session, status, key, loadEngine]);

  return { status, key, error, pendingJoin, connect, disconnect, resolveJoin, cancelJoin, configured: syncConfigured };
}
