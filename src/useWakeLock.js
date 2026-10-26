import { useEffect, useRef, useCallback } from "react";

// Keeps the screen on while `active`. An evening card can sit waiting for a
// tap, and a phone that locks itself in the meantime has to be unlocked before
// it can be tapped — which is the opposite of hands-free.
//
// Best effort throughout: unsupported browsers, low-power mode and iOS quirks
// all refuse the lock, and none of that is worth surfacing.
//
// Returns `reacquire`, for callers to run inside a tap. The browser drops the
// lock whenever the app is hidden, and a home-screen app on iOS can refuse the
// request made on becoming visible again (WebKit bug 255363) while still
// granting one made from a user gesture. It may run before the tap's own state
// change has made `active` true, so it skips that check up front.
export default function useWakeLock(active) {
  const sentinelRef = useRef(null);
  const pendingRef = useRef(false);
  const activeRef = useRef(active);
  activeRef.current = active;

  const request = useCallback(async (fromGesture = false) => {
    if ((!fromGesture && !activeRef.current) || sentinelRef.current || pendingRef.current) return;
    if (typeof navigator === "undefined" || !("wakeLock" in navigator)) return;
    if (document.visibilityState !== "visible") return;
    pendingRef.current = true;
    try {
      const sentinel = await navigator.wakeLock.request("screen");
      sentinelRef.current = sentinel;
      sentinel.addEventListener("release", () => {
        if (sentinelRef.current === sentinel) sentinelRef.current = null;
      });
      // Not active. A gesture's request can resolve before the tap's own
      // state change has rendered, and dropping it there would leave only the
      // effect's non-gesture request — the one iOS may refuse. So it gets a
      // moment to catch up before being let go.
      const dropIfIdle = () => {
        if (!activeRef.current && sentinelRef.current === sentinel) {
          sentinelRef.current = null;
          sentinel.release().catch(() => {});
        }
      };
      if (!activeRef.current) {
        if (fromGesture) setTimeout(dropIfIdle, 1000);
        else dropIfIdle();
      }
    } catch {
      // Refused; the next visibility change or tap tries again.
    } finally {
      pendingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!active) {
      const s = sentinelRef.current;
      sentinelRef.current = null;
      s?.release().catch(() => {});
      return;
    }
    request();
    const onVisible = () => { if (document.visibilityState === "visible") request(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [active, request]);

  useEffect(() => () => {
    const s = sentinelRef.current;
    sentinelRef.current = null;
    s?.release().catch(() => {});
  }, []);

  return useCallback(() => request(true), [request]);
}
