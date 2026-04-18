import { useState, useEffect, useRef, useMemo } from "react";
import { playWorkSound, playShortBreakSound, playLongBreakSound } from "./sounds";
import { sendNotification } from "./notifications";
import { computePhaseDim } from "./dataStore";

function useWindowWidth() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 800);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return w;
}

// ── Content panels ──────────────────────────────────────────────────────────

const WorkContent = ({ phase, items }) => {
  return (
    <div>
      <div style={{ marginBottom: "1.25rem" }}>
        <div style={{ fontSize: "0.62rem", letterSpacing: "0.18em", textTransform: "uppercase", color: phase.color, fontFamily: "'DM Mono', monospace", marginBottom: "0.3rem" }}>Posture setup</div>
        <div style={{ fontSize: "1.05rem", color: "#f0ece4", fontFamily: "Georgia, serif", lineHeight: 1.3 }}>Check in before you start</div>
      </div>
      {items.map((item) => (
        <div key={item.id} style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start", padding: "0.55rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ width: "8px", height: "8px", background: `${phase.color}55`, transform: "rotate(45deg)", flexShrink: 0, marginTop: "0.38rem" }} />
          <div>
            <div style={{ fontSize: "0.86rem", color: "#f0ece4", lineHeight: 1.5 }}>{item.primary}</div>
            {item.note && <div style={{ fontSize: "0.72rem", color: "#4a4a4a", fontFamily: "'DM Mono', monospace", marginTop: "0.15rem", letterSpacing: "0.03em" }}>{item.note}</div>}
          </div>
        </div>
      ))}
    </div>
  );
};

const ExerciseTabs = ({ exercises, active, setActive, phase }) => (
  <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.15rem", flexWrap: "wrap" }}>
    {exercises.map((e, i) => (
      <button key={i} onClick={() => setActive(i)} style={{ padding: "0.28rem 0.7rem", borderRadius: "4px", border: `1px solid ${i === active ? phase.color : "rgba(255,255,255,0.1)"}`, background: i === active ? `${phase.color}20` : "transparent", color: i === active ? phase.color : "#666", fontSize: "0.67rem", fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em", cursor: "pointer", transition: "all 0.15s" }}>
        {e.label}
      </button>
    ))}
  </div>
);

const StepList = ({ steps, phase }) => steps.map((step, i) => (
  <div key={i} style={{ display: "flex", gap: "0.8rem", marginBottom: "0.5rem", alignItems: "flex-start" }}>
    <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: `${phase.color}22`, border: `1px solid ${phase.color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", color: phase.color, flexShrink: 0, fontFamily: "'DM Mono', monospace" }}>{i + 1}</div>
    <span style={{ fontSize: "0.85rem", color: "#ccc8be", lineHeight: 1.65 }}>{step}</span>
  </div>
));

const ShortBreakContent = ({ phase, exercises }) => {
  const [active, setActive] = useState(0);
  const ex = exercises[active];
  return (
    <div>
      <div style={{ marginBottom: "1.15rem" }}>
        <div style={{ fontSize: "0.62rem", letterSpacing: "0.18em", textTransform: "uppercase", color: phase.color, fontFamily: "'DM Mono', monospace", marginBottom: "0.3rem" }}>3 exercises · under 60 seconds</div>
        <div style={{ fontSize: "1.05rem", color: "#f0ece4", fontFamily: "Georgia, serif", lineHeight: 1.3 }}>Do these in sequence</div>
      </div>
      <ExerciseTabs exercises={exercises} active={active} setActive={setActive} phase={phase} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.9rem" }}>
        <div style={{ fontSize: "0.87rem", fontWeight: 600, color: "#f0ece4", fontFamily: "Georgia, serif" }}>{ex.title}</div>
        <div style={{ fontSize: "0.67rem", fontFamily: "'DM Mono', monospace", color: phase.color }}>{ex.time}</div>
      </div>
      <StepList steps={ex.steps} phase={phase} />
    </div>
  );
};

const LongBreakContent = ({ phase, exercises }) => {
  const [active, setActive] = useState(0);
  const ex = exercises[active];
  return (
    <div>
      <div style={{ marginBottom: "1.15rem" }}>
        <div style={{ fontSize: "0.62rem", letterSpacing: "0.18em", textTransform: "uppercase", color: phase.color, fontFamily: "'DM Mono', monospace", marginBottom: "0.3rem" }}>2 exercises · 7 minutes total</div>
        <div style={{ fontSize: "1.05rem", color: "#f0ece4", fontFamily: "Georgia, serif", lineHeight: 1.3 }}>The rehab work</div>
      </div>
      <ExerciseTabs exercises={exercises} active={active} setActive={setActive} phase={phase} />
      <div style={{ marginBottom: "0.85rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.2rem" }}>
          <div style={{ fontSize: "0.87rem", fontWeight: 600, color: "#f0ece4", fontFamily: "Georgia, serif" }}>{ex.title}</div>
          <div style={{ fontSize: "0.67rem", fontFamily: "'DM Mono', monospace", color: phase.color }}>{ex.time}</div>
        </div>
        <div style={{ fontSize: "0.72rem", color: "#555", fontFamily: "'DM Mono', monospace" }}>{ex.subtitle}</div>
      </div>
      <StepList steps={ex.steps} phase={phase} />
      {ex.note && (
        <div style={{ marginTop: "0.85rem", padding: "0.7rem 0.9rem", background: "rgba(255,255,255,0.03)", borderRadius: "4px", borderLeft: `2px solid ${phase.color}44`, fontSize: "0.77rem", color: "#777", lineHeight: 1.7, fontStyle: "italic" }}>
          {ex.note}
        </div>
      )}
    </div>
  );
};

// ── Rail ─────────────────────────────────────────────────────────────────────

const TimerRail = ({ phase, fillPct, isMobile, totalSeconds, timeLeft }) => {
  const railW = isMobile ? 44 : 52;
  const totalSec = totalSeconds || phase.duration * 60;

  // Tick every 5 minutes for long durations, 1 minute for shorter
  const totalMin = Math.ceil(totalSec / 60);
  const tickIntervalMin = totalMin > 20 ? 5 : totalMin > 10 ? 5 : totalMin > 5 ? 1 : 1;
  const ticks = [];
  for (let m = totalMin; m >= 0; m -= tickIntervalMin) ticks.push(m * 60);
  if (ticks[ticks.length - 1] !== 0) ticks.push(0);

  const fmt = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    if (m === 0 && sec === 0) return "0";
    if (sec === 0) return `${m}m`;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: `${railW}px`, zIndex: 10 }}>
      <div style={{ position: "absolute", right: isMobile ? 5 : 6, top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.1)" }} />

      {ticks.map((t) => {
        const raw = (t / totalSec) * 100;
        const pos = 2 + raw * 0.96;
        const isActive = Math.abs(raw - fillPct) < 4;
        const isPast = raw > fillPct;
        return (
          <div key={t} style={{ position: "absolute", top: `${100 - pos}%`, left: 0, display: "flex", alignItems: "center", gap: 3, transform: "translateY(-50%)" }}>
            <div style={{ width: isMobile ? 6 : 10, height: 1, background: isActive ? phase.color : "rgba(255,255,255,0.22)", opacity: isPast ? 0.3 : 1 }} />
            <span style={{ fontSize: isMobile ? "0.5rem" : "0.57rem", fontFamily: "'DM Mono', monospace", color: isActive ? phase.color : "rgba(255,255,255,0.28)", opacity: isPast ? 0.4 : 1, whiteSpace: "nowrap", letterSpacing: "0.04em", textAlign: "left" }}>
              {fmt(t)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ── Settings drawer ───────────────────────────────────────────────────────────

const SettingsDrawer = ({ phases, phaseId, setPhaseId, phase, durations, setDurations, isPlaying, onPlayPause, onReset, loopsUntilLong, setLoopsUntilLong, muted, toggleMuted }) => {
  const [open, setOpen] = useState(false);
  const drawerRef = useRef(null);
  const drawerWidth = useWindowWidth();
  const drawerMobile = drawerWidth < 600;
  const fillOffset = drawerMobile ? 38 : 45;

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const btnBase = { border: "1px solid rgba(255,255,255,0.18)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" };

  return (
    <div ref={drawerRef} style={{ position: "fixed", bottom: 0, left: `calc(50% + ${fillOffset / 2}px)`, transform: "translateX(-50%)", zIndex: 20 }}>
      {/* Drawer panel */}
      <div style={{
        background: "rgba(15,14,12,0.98)",
        backdropFilter: "blur(16px)",
        border: `1px solid rgba(255,255,255,0.12)`,
        borderRadius: "10px 10px 0 0",
        transform: open ? "translateY(0)" : "translateY(calc(100% - 32px))",
        transition: "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        overflow: "hidden",
      }}>
        {/* Chevron handle */}
        <div
          onClick={() => setOpen(!open)}
          style={{
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <svg width="14" height="8" viewBox="0 0 14 8" style={{ opacity: 0.35, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.3s" }}>
            <polyline points="1,7 7,1 13,7" fill="none" stroke={open ? phase.color : "rgba(255,255,255,0.7)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Drawer content */}
        <div style={{ padding: "0 1.1rem 1.1rem", opacity: open ? 1 : 0, transition: "opacity 0.25s", pointerEvents: open ? "auto" : "none" }}>

          {/* Play/Pause + Reset controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem" }}>
            <button onClick={onReset} style={{ ...btnBase, padding: "0.42rem 0.85rem", borderRadius: 6, color: "rgba(255,255,255,0.45)", fontSize: "0.62rem", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em" }}>RESET</button>
            <button onClick={onPlayPause} style={{ ...btnBase, flex: 1, padding: "0.48rem 1rem", borderRadius: 6, border: `1px solid ${phase.color}`, background: `${phase.color}28`, color: phase.color, fontSize: "0.7rem", fontFamily: "'DM Mono', monospace", letterSpacing: "0.14em", fontWeight: 500 }}>
              {isPlaying ? "PAUSE" : "START"}
            </button>
          </div>

          {/* Sound toggle */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.75rem" }}>
            <button onClick={toggleMuted} style={{ ...btnBase, padding: "0.32rem 0.7rem", borderRadius: 6, color: muted ? "rgba(255,255,255,0.25)" : phase.color, fontSize: "0.55rem", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", border: `1px solid ${muted ? "rgba(255,255,255,0.1)" : phase.color + "44"}` }}>
              {muted ? "SOUND OFF" : "SOUND ON"}
            </button>
          </div>

          {/* Phase selector — manual override */}
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ fontSize: "0.5rem", letterSpacing: "0.15em", color: "#555", fontFamily: "'DM Mono', monospace", marginBottom: "0.5rem" }}>PHASE</div>
            <div style={{ display: "flex", gap: "0.35rem" }}>
              {Object.values(phases).map((p) => (
                <button key={p.id} onClick={() => setPhaseId(p.id)} disabled={isPlaying} style={{
                  padding: "0.4rem 0.8rem",
                  borderRadius: "5px",
                  border: `1px solid ${phaseId === p.id ? p.color : "rgba(255,255,255,0.12)"}`,
                  background: phaseId === p.id ? `${p.color}22` : "transparent",
                  color: phaseId === p.id ? p.color : isPlaying ? "#333" : "#666",
                  fontSize: "0.62rem",
                  fontFamily: "'DM Mono', monospace",
                  letterSpacing: "0.06em",
                  cursor: isPlaying ? "default" : "pointer",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                }}>
                  {p.tag}
                </button>
              ))}
            </div>
          </div>

          {/* Duration settings */}
          {Object.values(phases).map((p) => (
            <div key={p.id} style={{ marginBottom: "0.7rem" }}>
              <div style={{ fontSize: "0.5rem", letterSpacing: "0.15em", color: "#555", fontFamily: "'DM Mono', monospace", marginBottom: "0.35rem" }}>{p.tag}</div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input type="range" min={p.id === "work" ? 15 : 1} max={p.id === "work" ? 50 : p.id === "long" ? 30 : 15} value={durations[p.id]} onChange={(e) => setDurations((d) => ({ ...d, [p.id]: Number(e.target.value) }))} disabled={isPlaying} style={{ flex: 1, accentColor: p.color, colorScheme: "dark" }} />
                <span style={{ fontSize: "0.6rem", fontFamily: "'DM Mono', monospace", color: p.color, minWidth: "32px" }}>{durations[p.id]}m</span>
              </div>
            </div>
          ))}

          {/* Loops until long break */}
          <div style={{ marginBottom: "0.3rem" }}>
            <div style={{ fontSize: "0.5rem", letterSpacing: "0.15em", color: "#555", fontFamily: "'DM Mono', monospace", marginBottom: "0.35rem" }}>SESSIONS UNTIL LONG BREAK</div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input type="range" min={2} max={8} value={loopsUntilLong} onChange={(e) => setLoopsUntilLong(Number(e.target.value))} disabled={isPlaying} style={{ flex: 1, accentColor: phases.long.color, colorScheme: "dark" }} />
              <span style={{ fontSize: "0.6rem", fontFamily: "'DM Mono', monospace", color: phases.long.color, minWidth: "20px" }}>{loopsUntilLong}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Root ──────────────────────────────────────────────────────────────────────

export default function AlignedFlow({ config, setConfig }) {
  const [phaseId, setPhaseId] = useState("work");
  const [durations, setDurations] = useState(() => config.durations || { work: 25, short: 5, long: 15 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(() => (config.durations?.work || 25) * 60);
  const [workCount, setWorkCount] = useState(0); // counts completed work sessions
  const [loopsUntilLong, setLoopsUntilLong] = useState(() => config.loopsUntilLong ?? 4);
  const [muted, setMuted] = useState(() => config.muted ?? false);
  const mutedRef = useRef(config.muted ?? false);
  const toggleMuted = () => { setMuted(m => { const next = !m; mutedRef.current = next; return next; }); };

  // Persist settings changes back to config
  useEffect(() => {
    setConfig(prev => ({ ...prev, pomodoro: { ...prev.pomodoro, durations, loopsUntilLong, muted } }));
  }, [durations, loopsUntilLong, muted]);

  const PHASES = useMemo(() => {
    const p = config.phases || { work: { color: "#4A90D9", tag: "FOCUS", label: "Work Session" }, short: { color: "#3aaa7a", tag: "SHORT BREAK", label: "Micro-Reset" }, long: { color: "#9b72cf", tag: "LONG BREAK", label: "Long Break" } };
    return Object.fromEntries(
      Object.entries(p).map(([id, ph]) => [id, { id, ...ph, colorDim: computePhaseDim(ph.color) }])
    );
  }, [config.phases]);

  const phase = PHASES[phaseId];
  const width = useWindowWidth();
  const isMobile = width < 600;
  const railW = isMobile ? 44 : 52;

  const totalDuration = durations[phaseId] * 60; // in seconds

  // Refs for timer closure safety
  const phaseIdRef = useRef("work");
  const durationsRef = useRef(durations);
  const workCountRef = useRef(0);
  const isPlayingRef = useRef(false);
  useEffect(() => { phaseIdRef.current = phaseId; }, [phaseId]);
  useEffect(() => { durationsRef.current = durations; }, [durations]);
  useEffect(() => { workCountRef.current = workCount; }, [workCount]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  // ── Smooth fill interpolation (ported from evening mode) ───────────────
  const [smoothFillPct, setSmoothFillPct] = useState(100);
  const segmentStartRef = useRef(null);
  const segmentFromRef = useRef(100);
  const segmentToRef = useRef(100);
  const segmentDurationRef = useRef(1000); // ms — normally 1s, shorter for reset animation
  const resetAnimatingRef = useRef(false);
  const rafRef = useRef(null);

  const computeFill = (tl, dur) => dur > 0 ? (tl / dur) * 100 : 0;

  // Countdown tick using Web Worker and Date.now() for background accuracy
  const workerRef = useRef(null);
  const lastTickRef = useRef(null);

  useEffect(() => {
    if (!isPlaying) {
      if (workerRef.current) {
        workerRef.current.postMessage('stop');
      }
      lastTickRef.current = null;
      return;
    }

    if (!workerRef.current) {
      workerRef.current = new Worker(new URL('./timerWorker.js', import.meta.url));
      workerRef.current.onmessage = () => {
        const now = Date.now();
        if (lastTickRef.current) {
          const delta = Math.floor((now - lastTickRef.current) / 1000);
          if (delta > 0) {
            setTimeLeft((t) => Math.max(0, t - delta));
            lastTickRef.current += delta * 1000; // Keep remainder for next tick
          }
        } else {
          lastTickRef.current = now;
          setTimeLeft((t) => Math.max(0, t - 1));
        }
      };
    }

    lastTickRef.current = Date.now();
    workerRef.current.postMessage('start');

    return () => {
      if (workerRef.current) {
        workerRef.current.postMessage('stop');
      }
    };
  }, [isPlaying]);

  // Cleanup worker on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  // When timeLeft changes, set up interpolation segment
  useEffect(() => {
    if (resetAnimatingRef.current) return; // don't override reset animation
    const currentFill = computeFill(timeLeft, totalDuration);
    const nextFill = computeFill(Math.max(0, timeLeft - 1), totalDuration);

    if (!isPlayingRef.current) {
      segmentStartRef.current = null;
      segmentFromRef.current = currentFill;
      segmentToRef.current = currentFill;
      setSmoothFillPct(currentFill);
      return;
    }

    segmentDurationRef.current = 1000;
    segmentStartRef.current = performance.now();
    segmentFromRef.current = currentFill;
    segmentToRef.current = nextFill;
  }, [timeLeft, phaseId]);

  // Snap on pause/resume
  useEffect(() => {
    if (resetAnimatingRef.current) return;
    if (!isPlaying) {
      // Freeze waterline exactly where it is visually — no jump
      segmentStartRef.current = null;
      segmentFromRef.current = smoothFillPct;
      segmentToRef.current = smoothFillPct;
    } else {
      // Resuming — interpolate from current visual position to next tick
      const nextFill = computeFill(Math.max(0, timeLeft - 1), totalDuration);
      segmentDurationRef.current = 1000;
      segmentStartRef.current = performance.now();
      segmentFromRef.current = smoothFillPct;
      segmentToRef.current = nextFill;
    }
  }, [isPlaying]);

  // RAF loop — drives smooth fill and reset animation
  useEffect(() => {
    const tick = () => {
      if (segmentStartRef.current !== null && (isPlayingRef.current || resetAnimatingRef.current)) {
        const elapsed = performance.now() - segmentStartRef.current;
        const t = Math.min(1, elapsed / segmentDurationRef.current);
        // Ease-out for reset animation, linear for normal ticking
        const eased = resetAnimatingRef.current ? 1 - Math.pow(1 - t, 3) : t;
        const interpolated = segmentFromRef.current + (segmentToRef.current - segmentFromRef.current) * eased;
        setSmoothFillPct(interpolated);
        // When reset animation completes, stop
        if (t >= 1 && resetAnimatingRef.current) {
          resetAnimatingRef.current = false;
          segmentStartRef.current = null;
          segmentFromRef.current = 100;
          segmentToRef.current = 100;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  // Handle hitting 0 — auto-progression
  useEffect(() => {
    if (timeLeft !== 0 || !isPlaying) return;

    if (phaseIdRef.current === "work") {
      const newCount = workCountRef.current + 1;
      setWorkCount(newCount); workCountRef.current = newCount;
      // Every Nth work session → long break, otherwise short break
      const nextPhase = newCount % loopsUntilLong === 0 ? "long" : "short";
      setPhaseId(nextPhase); phaseIdRef.current = nextPhase;
      setTimeLeft(durationsRef.current[nextPhase] * 60);
      if (nextPhase === "long") {
        playLongBreakSound(mutedRef.current);
        sendNotification("Long Break", "Time for extended recovery");
      } else {
        playShortBreakSound(mutedRef.current);
        sendNotification("Short Break", "Do the reset exercises");
      }
    } else {
      // Break finished → back to work
      setPhaseId("work"); phaseIdRef.current = "work";
      setTimeLeft(durationsRef.current.work * 60);
      playWorkSound(mutedRef.current);
      sendNotification("Work Session", "Time to focus!");
    }
  }, [timeLeft, isPlaying]);

  // Manual phase change (from drawer)
  const handlePhaseChange = (id) => {
    setPhaseId(id); phaseIdRef.current = id;
    setTimeLeft(durations[id] * 60);
    setIsPlaying(false);
    // Animate waterline back to 100%
    resetAnimatingRef.current = true;
    segmentDurationRef.current = 600;
    segmentStartRef.current = performance.now();
    segmentFromRef.current = smoothFillPct;
    segmentToRef.current = 100;
  };

  const onPlayPause = () => {
    setIsPlaying((p) => {
      // Play work sound when starting (not resuming from pause mid-phase)
      if (!p && phaseIdRef.current === "work") {
        playWorkSound(mutedRef.current);
      }
      return !p;
    });
  };

  const onReset = () => {
    setIsPlaying(false);
    setTimeLeft(durations[phaseId] * 60);
    // Animate waterline back to 100% over 600ms with ease-out
    resetAnimatingRef.current = true;
    segmentDurationRef.current = 600;
    segmentStartRef.current = performance.now();
    segmentFromRef.current = smoothFillPct;
    segmentToRef.current = 100;
  };

  const fillPct = smoothFillPct;

  return (
    <div style={{ position: "relative", minHeight: "100%", background: "#0f0e0c", fontFamily: "Georgia, serif", overflow: "hidden" }}>

      {/* Background fill — tap to play/pause */}
      <div onClick={onPlayPause} style={{ position: "absolute", bottom: 0, left: isMobile ? railW - 6 : railW - 7, right: 0, height: `${fillPct}%`, background: phase.colorDim, transition: "background 0.6s ease", cursor: "pointer", zIndex: 0 }} />
      {/* Unfilled area above waterline — also tap target */}
      <div onClick={onPlayPause} style={{ position: "absolute", top: 0, left: isMobile ? railW - 6 : railW - 7, right: 0, bottom: `${fillPct}%`, cursor: "pointer", zIndex: 0 }} />
      {/* Waterline glow */}
      <div style={{ position: "absolute", left: isMobile ? railW - 6 : railW - 7, right: 0, bottom: `${fillPct}%`, height: "80px", background: `linear-gradient(to top, ${phase.color}18, transparent)`, transform: "translateY(40px)", transition: "background 0.6s", pointerEvents: "none", zIndex: 1 }} />
      {/* Crisp waterline — full width, GPU-composited via transform */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 2, background: phase.color, opacity: 0.75, transform: `translateY(${(100 - fillPct) * window.innerHeight / 100}px)`, transition: "background 0.6s", pointerEvents: "none", zIndex: 2 }} />

      <TimerRail phase={phase} fillPct={fillPct} isMobile={isMobile} totalSeconds={totalDuration} timeLeft={timeLeft} />

      {/* Main content — tap empty area to play/pause */}
      <div onClick={onPlayPause} style={{ position: "relative", zIndex: 5, minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: isMobile ? `1.25rem 1.25rem 5rem ${railW - 6 + 20}px` : `2rem 2rem 5rem ${railW - 7 + 32}px`, cursor: "pointer" }}>
        <div style={{ width: "100%", maxWidth: "520px" }}>
          {/* Content card — clicks here don't toggle timer */}
          <div onClick={(e) => e.stopPropagation()} style={{ background: "rgba(15,14,12,0.82)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px", padding: isMobile ? "1.25rem 1.15rem 1.1rem" : "1.75rem 1.75rem 1.5rem", boxShadow: `0 0 40px ${phase.color}10`, cursor: "default" }}>
            {phaseId === "work" && <WorkContent phase={phase} items={config.workItems} />}
            {phaseId === "short" && <ShortBreakContent phase={phase} exercises={config.shortBreakExercises} />}
            {phaseId === "long" && <LongBreakContent phase={phase} exercises={config.longBreakExercises} />}
          </div>
        </div>
      </div>

      <SettingsDrawer phases={PHASES} phaseId={phaseId} setPhaseId={handlePhaseChange} phase={phase} durations={durations} setDurations={setDurations} isPlaying={isPlaying} onPlayPause={onPlayPause} onReset={onReset} loopsUntilLong={loopsUntilLong} setLoopsUntilLong={setLoopsUntilLong} muted={muted} toggleMuted={toggleMuted} />
    </div>
  );
}
