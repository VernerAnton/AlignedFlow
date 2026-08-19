import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { playStartSound, playStopSound, playMicroBreakSound, playShortBreakSound, playLongBreakSound, playDoneSound } from "./sounds";
import { sendNotification } from "./notifications";
import { computePhaseDim } from "./dataStore";

// Exported so App can size the mode-switcher pill against the same breakpoint.
export function useWindowWidth() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 800);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return w;
}

// ── Content panels ──────────────────────────────────────────────────────────

const WorkContent = ({ phase, items, summary, heading }) => {
  return (
    <div>
      <div style={{ marginBottom: "1.25rem" }}>
        <div style={{ fontSize: "0.62rem", letterSpacing: "0.18em", textTransform: "uppercase", color: phase.color, fontFamily: "'DM Mono', monospace", marginBottom: "0.3rem" }}>{summary}</div>
        <div style={{ fontSize: "1.05rem", color: "#f0ece4", fontFamily: "Georgia, serif", lineHeight: 1.3 }}>{heading}</div>
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

// Shared by micro and short breaks — a tabbed list of label/title/time/steps.
const SimpleBreakContent = ({ phase, exercises, summary, heading }) => {
  const [active, setActive] = useState(0);
  if (!exercises || exercises.length === 0) return null;
  const ex = exercises[active] || exercises[0];
  return (
    <div>
      <div style={{ marginBottom: "1.15rem" }}>
        <div style={{ fontSize: "0.62rem", letterSpacing: "0.18em", textTransform: "uppercase", color: phase.color, fontFamily: "'DM Mono', monospace", marginBottom: "0.3rem" }}>{summary}</div>
        <div style={{ fontSize: "1.05rem", color: "#f0ece4", fontFamily: "Georgia, serif", lineHeight: 1.3 }}>{heading}</div>
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

const LongBreakContent = ({ phase, exercises, summary, heading }) => {
  const [active, setActive] = useState(0);
  if (!exercises || exercises.length === 0) return null;
  const ex = exercises[active] || exercises[0];
  return (
    <div>
      <div style={{ marginBottom: "1.15rem" }}>
        <div style={{ fontSize: "0.62rem", letterSpacing: "0.18em", textTransform: "uppercase", color: phase.color, fontFamily: "'DM Mono', monospace", marginBottom: "0.3rem" }}>{summary}</div>
        <div style={{ fontSize: "1.05rem", color: "#f0ece4", fontFamily: "Georgia, serif", lineHeight: 1.3 }}>{heading}</div>
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

// ── Cycle indicator ──────────────────────────────────────────────────────────

// One diamond per focus block in the current long-break cycle, split into sets
// by a divider at each short break. Filled = done, ringed = current.
// Falls back to a numeric readout once the cycle is too long to draw.
const MAX_DRAWN_BLOCKS = 14;

const CycleIndicator = ({ blocksPerSet, setsUntilLong, done, phases }) => {
  const total = blocksPerSet * setsUntilLong;
  // Tighten up for longer cycles so they still fit a phone's width
  const size = total > 9 ? 6 : 7;
  const gap = total > 9 ? 3 : 4;

  if (total > MAX_DRAWN_BLOCKS) {
    return (
      <span style={{ fontSize: "0.55rem", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)" }}>
        {Math.min(done + 1, total)}<span style={{ color: "rgba(255,255,255,0.2)" }}>/{total}</span>
      </span>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap }}>
      {Array.from({ length: total }, (_, i) => {
        const isDone = i < done;
        const isCurrent = i === done;
        const marks = [
          <div key={`b${i}`} style={{
            width: size, height: size, transform: "rotate(45deg)", flexShrink: 0,
            background: isDone ? phases.work.color : "transparent",
            border: `1px solid ${isDone || isCurrent ? phases.work.color : "rgba(255,255,255,0.22)"}`,
            opacity: isCurrent ? 1 : isDone ? 0.55 : 0.5,
            boxShadow: isCurrent ? `0 0 5px ${phases.work.color}99` : "none",
            transition: "all 0.3s",
          }} />,
        ];
        // Divider after each completed set, except at the very end of the cycle
        const atSetEnd = (i + 1) % blocksPerSet === 0 && i + 1 < total;
        if (atSetEnd) {
          marks.push(<div key={`s${i}`} style={{ width: 1, height: size + 2, background: phases.short.color, opacity: 0.45, margin: "0 1px", flexShrink: 0 }} />);
        }
        return marks;
      })}
      <div style={{ width: 3, height: 3, borderRadius: "50%", background: phases.long.color, opacity: 0.7, marginLeft: 1, flexShrink: 0 }} />
    </div>
  );
};

// ── Rail ─────────────────────────────────────────────────────────────────────

const TimerRail = ({ phase, fillPct, isMobile, totalSeconds, timeLeft }) => {
  const railW = isMobile ? 44 : 52;
  const totalSec = totalSeconds || phase.duration * 60;

  // Tick every 5 minutes for long durations, 1 minute for shorter.
  // Floor rather than ceil: a fractional phase (2m30) must not put a tick
  // above its own start, which would float off the top of the rail.
  const totalMin = Math.floor(totalSec / 60);
  const tickIntervalMin = totalMin > 10 ? 5 : 1;
  const ticks = [];
  if (totalSec < 60) {
    // Sub-minute phases — possible for micro breaks — need finer ticks
    for (let s = Math.floor(totalSec / 30) * 30; s >= 0; s -= 30) ticks.push(s);
  } else {
    for (let m = totalMin; m >= 0; m -= tickIntervalMin) ticks.push(m * 60);
  }
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

// ── Duration formatting ───────────────────────────────────────────────────────

// Minutes → label. Whole minutes stay "25m"; halves read as "2m30", and
// anything under a minute is clearer in seconds outright.
const fmtDuration = (min) => {
  if (min < 1) return `${Math.round(min * 60)}s`;
  const whole = Math.floor(min);
  const sec = Math.round((min - whole) * 60);
  return sec === 0 ? `${whole}m` : `${whole}m${String(sec).padStart(2, "0")}`;
};

// Seconds → clock. The task budget is long enough to need an hours field.
const fmtClock = (s) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  return `${h > 0 ? `${h}:` : ""}${mm}:${String(sec).padStart(2, "0")}`;
};

// ── Task timer ────────────────────────────────────────────────────────────────

// A budget of focus time that runs *across* the loop structure rather than
// inside it: only work-phase seconds count toward it, so breaks — and the
// length of a focus block — are free to be whatever suits the body while the
// task keeps its own clock.
//
// The remaining-time readout is not rendered here — it is published upward and
// drawn as a segment of the mode-switcher pill, so the two read as one control
// cluster instead of a badge floating beside it.

// Shown the moment the budget runs out, over a blurred, frozen app. Portalled
// to the body so the blur covers the mode switcher too — the whole surface
// goes quiet, which is the point of the interruption.
const TaskCompleteOverlay = ({ color, minutes, onContinue }) => createPortal(
  <div style={{
    position: "fixed", inset: 0, zIndex: 100,
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "1.5rem",
    background: "rgba(15,14,12,0.55)",
    backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
    animation: "taskFade 0.5s ease both",
    fontFamily: "Georgia, serif",
  }}>
    <div style={{
      width: "100%", maxWidth: 400, textAlign: "center",
      background: "rgba(15,14,12,0.72)",
      border: `1px solid ${color}44`,
      borderRadius: 10,
      boxShadow: `0 0 60px ${color}22`,
      padding: "2rem 1.6rem 1.7rem",
      animation: "taskRise 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.08s both",
    }}>
      <div style={{ fontSize: "0.58rem", letterSpacing: "0.22em", textTransform: "uppercase", color, fontFamily: "'DM Mono', monospace", marginBottom: "0.85rem" }}>
        Task time is up
      </div>
      <div style={{ fontSize: "1.35rem", lineHeight: 1.3, color: "#f0ece4", marginBottom: "0.7rem" }}>
        {fmtDuration(minutes)} of focus, done.
      </div>
      <div style={{ fontSize: "0.8rem", lineHeight: 1.6, color: "rgba(240,236,228,0.5)", marginBottom: "1.6rem" }}>
        Close this one out and line up what's next. The block you were in picks
        up exactly where it stopped.
      </div>
      <button
        onClick={onContinue}
        style={{
          width: "100%", padding: "0.75rem 1rem",
          border: `1px solid ${color}`, borderRadius: 7,
          background: `${color}28`, color,
          fontFamily: "'DM Mono', monospace", fontSize: "0.7rem",
          letterSpacing: "0.18em", fontWeight: 500, cursor: "pointer",
          transition: "background 0.2s",
        }}
      >
        START NEXT TASK
      </button>
    </div>
  </div>,
  document.body
);

// ── Settings drawer ───────────────────────────────────────────────────────────

// Slider bounds per phase, as [min, max, step] in minutes. Work goes down to
// 5 min so short focus blocks paired with micro breaks are actually reachable.
// Micro moves in half minutes — at that length 30 s is a meaningful difference.
const DURATION_RANGES = { work: [5, 50, 1], micro: [0.5, 5, 0.5], short: [1, 15, 1], long: [1, 35, 1] };

// Task budget bounds, [min, max, step] in minutes. Wide enough for a short
// admin task at one end and a deep-work block at the other.
const TASK_RANGE = [10, 120, 5];

const SettingsDrawer = ({ phases, phaseId, setPhaseId, phase, durations, setDurations, isPlaying, onPlayPause, onReset, microEnabled, toggleMicro, loopsUntilShort, setLoopsUntilShort, setsUntilLong, setSetsUntilLong, blocksPerSet, workCount, muted, toggleMuted, taskEnabled, toggleTaskTimer, taskDuration, setTaskDuration, taskElapsed, onResetTask, showNumbers, toggleShowNumbers }) => {
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

  // With micro breaks off the phase is inert — keep it out of the UI so the
  // default is an ordinary three-phase pomodoro.
  const visiblePhases = Object.values(phases).filter((p) => p.id !== "micro" || microEnabled);

  return (
    <div ref={drawerRef} style={{ position: "fixed", bottom: 0, left: `calc(50% + ${fillOffset / 2}px)`, transform: "translateX(-50%)", zIndex: 20, pointerEvents: open ? "auto" : "none" }}>
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
            pointerEvents: "auto",
            gap: 12,
            padding: "0 0.9rem",
          }}
        >
          <CycleIndicator blocksPerSet={blocksPerSet} setsUntilLong={setsUntilLong} done={workCount} phases={phases} />
          <svg width="14" height="8" viewBox="0 0 14 8" style={{ opacity: 0.35, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.3s", flexShrink: 0 }}>
            <polyline points="1,7 7,1 13,7" fill="none" stroke={open ? phase.color : "rgba(255,255,255,0.7)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Drawer content */}
        {/* Scrolls rather than running off the top of short screens — the
            fourth phase and the second loop control made this reachable. */}
        <div style={{ padding: "0 1.1rem 1.1rem", opacity: open ? 1 : 0, transition: "opacity 0.25s", pointerEvents: open ? "auto" : "none", maxHeight: "calc(100vh - 120px)", overflowY: "auto", msOverflowStyle: "none", scrollbarWidth: "none" }}>

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
            <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
              {visiblePhases.map((p) => (
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
          {visiblePhases.map((p) => {
            const [min, max, step] = DURATION_RANGES[p.id] || [1, 30, 1];
            return (
              <div key={p.id} style={{ marginBottom: "0.7rem" }}>
                <div style={{ fontSize: "0.5rem", letterSpacing: "0.15em", color: "#555", fontFamily: "'DM Mono', monospace", marginBottom: "0.35rem" }}>{p.tag}</div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input type="range" min={min} max={max} step={step} value={durations[p.id]} onChange={(e) => setDurations((d) => ({ ...d, [p.id]: Number(e.target.value) }))} disabled={isPlaying} style={{ flex: 1, accentColor: p.color, colorScheme: "dark" }} />
                  <span style={{ fontSize: "0.6rem", fontFamily: "'DM Mono', monospace", color: p.color, minWidth: "42px" }}>{fmtDuration(durations[p.id])}</span>
                </div>
              </div>
            );
          })}

          {/* Loop structure — inner (micro) and outer (long) */}
          <div style={{ marginTop: "1rem", paddingTop: "0.85rem", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
              <div style={{ fontSize: "0.5rem", letterSpacing: "0.15em", color: "#555", fontFamily: "'DM Mono', monospace" }}>LOOP STRUCTURE</div>
              <button onClick={toggleMicro} disabled={isPlaying} style={{ ...btnBase, padding: "0.28rem 0.65rem", borderRadius: 6, cursor: isPlaying ? "default" : "pointer", color: microEnabled ? phases.micro.color : "rgba(255,255,255,0.25)", fontSize: "0.52rem", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", border: `1px solid ${microEnabled ? phases.micro.color + "44" : "rgba(255,255,255,0.1)"}` }}>
                {microEnabled ? "MICRO ON" : "MICRO OFF"}
              </button>
            </div>

            {microEnabled && (
              <div style={{ marginBottom: "0.7rem" }}>
                <div style={{ fontSize: "0.5rem", letterSpacing: "0.15em", color: "#555", fontFamily: "'DM Mono', monospace", marginBottom: "0.35rem" }}>FOCUS BLOCKS PER SHORT BREAK</div>
                {/* Coloured for the break it schedules, not the phase between
                    blocks — matching the long break slider below. */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input type="range" min={2} max={6} value={loopsUntilShort} onChange={(e) => setLoopsUntilShort(Number(e.target.value))} disabled={isPlaying} style={{ flex: 1, accentColor: phases.short.color, colorScheme: "dark" }} />
                  <span style={{ fontSize: "0.6rem", fontFamily: "'DM Mono', monospace", color: phases.short.color, minWidth: "20px" }}>{loopsUntilShort}</span>
                </div>
              </div>
            )}

            <div style={{ marginBottom: "0.5rem" }}>
              <div style={{ fontSize: "0.5rem", letterSpacing: "0.15em", color: "#555", fontFamily: "'DM Mono', monospace", marginBottom: "0.35rem" }}>SETS UNTIL LONG BREAK</div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input type="range" min={1} max={6} value={setsUntilLong} onChange={(e) => setSetsUntilLong(Number(e.target.value))} disabled={isPlaying} style={{ flex: 1, accentColor: phases.long.color, colorScheme: "dark" }} />
                <span style={{ fontSize: "0.6rem", fontFamily: "'DM Mono', monospace", color: phases.long.color, minWidth: "20px" }}>{setsUntilLong}</span>
              </div>
            </div>

            {/* Plain-language summary of the resulting cycle */}
            <div style={{ fontSize: "0.53rem", lineHeight: 1.6, fontFamily: "'DM Mono', monospace", color: "rgba(255,255,255,0.32)" }}>
              {microEnabled
                ? <>{loopsUntilShort}× ({fmtDuration(durations.work)} focus + {fmtDuration(durations.micro)} micro) → {fmtDuration(durations.short)} short break</>
                : <>{fmtDuration(durations.work)} focus → {fmtDuration(durations.short)} short break</>}
              <br />
              ×{setsUntilLong} → {fmtDuration(durations.long)} long break
              <span style={{ color: "rgba(255,255,255,0.2)" }}> · {blocksPerSet * setsUntilLong} focus blocks per cycle</span>
            </div>
          </div>

          {/* Task timer — deliberately its own section, below the loop
              structure it cuts across. Coloured as work, since work-phase
              seconds are the only thing it counts. */}
          <div style={{ marginTop: "1rem", paddingTop: "0.85rem", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: taskEnabled ? "0.7rem" : 0 }}>
              <div style={{ fontSize: "0.5rem", letterSpacing: "0.15em", color: "#555", fontFamily: "'DM Mono', monospace" }}>TASK TIMER</div>
              <button onClick={toggleTaskTimer} disabled={isPlaying} style={{ ...btnBase, padding: "0.28rem 0.65rem", borderRadius: 6, cursor: isPlaying ? "default" : "pointer", color: taskEnabled ? phases.work.color : "rgba(255,255,255,0.25)", fontSize: "0.52rem", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", border: `1px solid ${taskEnabled ? phases.work.color + "44" : "rgba(255,255,255,0.1)"}` }}>
                {taskEnabled ? "TASK ON" : "TASK OFF"}
              </button>
            </div>

            {taskEnabled && (
              <>
                <div style={{ marginBottom: "0.6rem" }}>
                  <div style={{ fontSize: "0.5rem", letterSpacing: "0.15em", color: "#555", fontFamily: "'DM Mono', monospace", marginBottom: "0.35rem" }}>FOCUS TIME PER TASK</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <input type="range" min={TASK_RANGE[0]} max={TASK_RANGE[1]} step={TASK_RANGE[2]} value={taskDuration} onChange={(e) => setTaskDuration(Number(e.target.value))} disabled={isPlaying} style={{ flex: 1, accentColor: phases.work.color, colorScheme: "dark" }} />
                    <span style={{ fontSize: "0.6rem", fontFamily: "'DM Mono', monospace", color: phases.work.color, minWidth: "42px" }}>{fmtDuration(taskDuration)}</span>
                  </div>
                </div>

                {/* Not disabled mid-session — this is how the budget is
                    displayed, not how it behaves, so it is always safe. */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.55rem" }}>
                  <div style={{ fontSize: "0.5rem", letterSpacing: "0.15em", color: "#555", fontFamily: "'DM Mono', monospace" }}>COUNTDOWN</div>
                  <button onClick={toggleShowNumbers} style={{ ...btnBase, padding: "0.28rem 0.65rem", borderRadius: 6, color: showNumbers ? phases.work.color : "rgba(255,255,255,0.25)", fontSize: "0.52rem", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", border: `1px solid ${showNumbers ? phases.work.color + "44" : "rgba(255,255,255,0.1)"}` }}>
                    {showNumbers ? "NUMBERS ON" : "NUMBERS OFF"}
                  </button>
                </div>

                {/* Width-capped: the drawer sizes to its content, and an
                    unconstrained line of prose would widen the whole panel. */}
                {!showNumbers && (
                  <div style={{ fontSize: "0.53rem", lineHeight: 1.6, fontFamily: "'DM Mono', monospace", color: "rgba(255,255,255,0.32)", marginBottom: "0.55rem", maxWidth: 235 }}>
                    Shows just the word TASK in the pill — hover or tap it to read the time.
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ fontSize: "0.53rem", lineHeight: 1.6, fontFamily: "'DM Mono', monospace", color: "rgba(255,255,255,0.32)" }}>
                    {fmtClock(taskElapsed)} of {fmtDuration(taskDuration)} focus done
                  </div>
                  {/* Enabled mid-session on purpose — switching task early is
                      the common case, and it should not need a pause. */}
                  <button onClick={onResetTask} style={{ ...btnBase, padding: "0.26rem 0.6rem", borderRadius: 6, color: "rgba(255,255,255,0.4)", fontSize: "0.52rem", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", flexShrink: 0 }}>NEW TASK</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Root ──────────────────────────────────────────────────────────────────────

export default function AlignedFlow({ config, setConfig, onTaskStatus }) {
  const [phaseId, setPhaseId] = useState("work");
  const [durations, setDurations] = useState(() => config.durations || { work: 25, micro: 2, short: 5, long: 15 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(() => (config.durations?.work || 25) * 60);
  // Focus blocks completed within the current long-break cycle (resets at each long break)
  const [workCount, setWorkCount] = useState(0);
  const [microEnabled, setMicroEnabled] = useState(() => config.microEnabled ?? false);
  const [loopsUntilShort, setLoopsUntilShort] = useState(() => config.loopsUntilShort ?? 3);
  const [setsUntilLong, setSetsUntilLong] = useState(() => config.setsUntilLong ?? 4);
  const [muted, setMuted] = useState(() => config.muted ?? false);
  // Task timer — a focus-time budget that spans the loops. taskElapsed counts
  // only work-phase seconds; it is intentionally not persisted, matching the
  // rest of the runtime timer state, so a reload starts the task fresh.
  const [taskEnabled, setTaskEnabled] = useState(() => config.taskTimerEnabled ?? false);
  const [taskDuration, setTaskDuration] = useState(() => config.taskDuration ?? 50);
  const [taskShowNumbers, setTaskShowNumbers] = useState(() => config.taskShowNumbers ?? true);
  const [taskElapsed, setTaskElapsed] = useState(0);
  const [taskDone, setTaskDone] = useState(false);
  const taskEnabledRef = useRef(config.taskTimerEnabled ?? false);
  const mutedRef = useRef(config.muted ?? false);
  const toggleMuted = () => { setMuted(m => { const next = !m; mutedRef.current = next; return next; }); };

  const toggleMicro = () => {
    const next = !microEnabled;
    setMicroEnabled(next);
    // The cycle length changes underneath, so restart the count rather than
    // leaving the indicator pointing at a block that no longer exists.
    setWorkCount(0); workCountRef.current = 0;
    // Micro disappears from the phase list when off — don't strand the user on it.
    if (!next && phaseId === "micro") handlePhaseChange("work");
  };

  const toggleTaskTimer = () => {
    const next = !taskEnabled;
    setTaskEnabled(next);
    taskEnabledRef.current = next;
    // A budget only means something from the moment it is set, so both
    // switching on and switching off start the count over.
    setTaskElapsed(0);
    setTaskDone(false);
  };

  const toggleShowNumbers = () => setTaskShowNumbers((v) => !v);

  // Starts the budget over without touching the phase timer — the loops carry
  // on undisturbed while the task they are serving changes.
  const onResetTask = () => {
    setTaskElapsed(0);
    setTaskDone(false);
  };

  // With micro breaks off, every focus block ends in a short break — the
  // original single-loop behaviour.
  const blocksPerSet = microEnabled ? loopsUntilShort : 1;
  const blocksUntilLong = blocksPerSet * setsUntilLong;

  // Persist settings changes back to config
  useEffect(() => {
    setConfig(prev => ({ ...prev, pomodoro: { ...prev.pomodoro, durations, microEnabled, loopsUntilShort, setsUntilLong, muted, taskTimerEnabled: taskEnabled, taskDuration, taskShowNumbers } }));
  }, [durations, microEnabled, loopsUntilShort, setsUntilLong, muted, taskEnabled, taskDuration, taskShowNumbers]);

  const PHASES = useMemo(() => {
    const p = config.phases || { work: { color: "#4A90D9", tag: "FOCUS", label: "Work Session" }, micro: { color: "#e8899e", tag: "MICRO", label: "Micro Break" }, short: { color: "#3aaa7a", tag: "SHORT BREAK", label: "Micro-Reset" }, long: { color: "#9b72cf", tag: "LONG BREAK", label: "Long Break" } };
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

  // Reset timeLeft when duration for the current phase changes (slider is disabled while playing)
  useEffect(() => {
    if (!isPlaying) {
      setTimeLeft(durations[phaseId] * 60);
    }
  }, [durations[phaseId]]);

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
            // Work is the only phase the task budget is spent on — breaks of
            // every length leave it untouched.
            if (taskEnabledRef.current && phaseIdRef.current === "work") setTaskElapsed((s) => s + delta);
            lastTickRef.current += delta * 1000; // Keep remainder for next tick
          }
        } else {
          lastTickRef.current = now;
          setTimeLeft((t) => Math.max(0, t - 1));
          if (taskEnabledRef.current && phaseIdRef.current === "work") setTaskElapsed((s) => s + 1);
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
      // Two nested loops: micro breaks between focus blocks, a short break at
      // the end of each set, a long break once the last set of the cycle ends.
      const newCount = workCountRef.current + 1;
      const cycleDone = newCount >= blocksUntilLong;
      const setDone = newCount % blocksPerSet === 0;
      const nextPhase = cycleDone ? "long" : setDone ? "short" : "micro";
      // The counter tracks position inside one long-break cycle, so it rolls
      // over when the long break is reached.
      const nextCount = cycleDone ? 0 : newCount;
      setWorkCount(nextCount); workCountRef.current = nextCount;
      setPhaseId(nextPhase); phaseIdRef.current = nextPhase;
      setTimeLeft(durationsRef.current[nextPhase] * 60);
      if (nextPhase === "long") {
        playLongBreakSound(mutedRef.current);
        sendNotification("Long Break", "Time for extended recovery");
      } else if (nextPhase === "short") {
        playShortBreakSound(mutedRef.current);
        sendNotification("Short Break", "Do the reset exercises");
      } else {
        playMicroBreakSound(mutedRef.current);
        sendNotification("Micro Break", "Look away, stand up, breathe");
      }
    } else {
      // Break finished → back to work
      setPhaseId("work"); phaseIdRef.current = "work";
      setTimeLeft(durationsRef.current.work * 60);
      playStartSound(mutedRef.current);
      sendNotification("Work Session", "Time to focus!");
    }
  }, [timeLeft, isPlaying]);

  // ── Task budget exhausted ─────────────────────────────────────────────
  // Fires wherever it lands inside a focus block — that is the whole point of
  // the feature, so the block is frozen rather than run to its end. Pausing
  // here also stops the phase from auto-advancing if the budget happens to run
  // out exactly on 0:00; resuming lets that transition happen as usual.
  //
  // Only while the current phase is work, though — if the budget and the
  // focus block happen to end on the exact same tick, the "hit 0" effect
  // above has already flipped phaseIdRef to a break by the time this runs
  // (it's defined earlier, and effects fire in that order within one commit),
  // so this simply skips showing the popup right before a break anyway. The
  // budget stays spent — nothing increments it further while on a break — and
  // this fires for real ~1s after work resumes, once the next tick pushes
  // taskElapsed past the total again with phaseIdRef back to "work".
  const taskTotalSec = taskDuration * 60;
  useEffect(() => {
    if (!taskEnabled || taskDone || !isPlaying) return;
    if (taskElapsed < taskTotalSec) return;
    if (phaseIdRef.current !== "work") return;
    setIsPlaying(false); isPlayingRef.current = false;
    setTaskDone(true);
    playDoneSound(mutedRef.current);
    sendNotification("Task time is up", `${fmtDuration(taskDuration)} of focus done — on to the next task`);
  }, [taskElapsed, taskEnabled, taskDone, isPlaying, taskTotalSec]);

  // Hand the budget to App, which draws it into the mode-switcher pill. Sent
  // even while switched off so the pill keeps the last figures to animate the
  // segment closed with, rather than blanking mid-collapse.
  useEffect(() => {
    if (!onTaskStatus) return;
    onTaskStatus({
      active: taskEnabled,
      showNumbers: taskShowNumbers,
      time: fmtClock(Math.max(0, taskTotalSec - taskElapsed)),
      // Used as the chip's solid background when the countdown is off — its
      // only remaining job now that the chip no longer inverts text onto it.
      color: PHASES.work.color,
    });
  }, [taskEnabled, taskShowNumbers, taskElapsed, taskTotalSec, PHASES.work.color, onTaskStatus]);

  // Dismissing the overlay resets the budget and picks the frozen block back
  // up mid-stride, so the loop structure is never reshaped by the task.
  const onTaskContinue = () => {
    setTaskElapsed(0);
    setTaskDone(false);
    setIsPlaying(true); isPlayingRef.current = true;
    playStartSound(mutedRef.current);
  };

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
      // Universal start/stop cues — fire in every phase (work, short, long)
      if (!p) playStartSound(mutedRef.current);
      else playStopSound(mutedRef.current);
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
      <style dangerouslySetInnerHTML={{ __html: `.pomo-card::-webkit-scrollbar{display:none}
@keyframes taskFade { from { opacity: 0 } to { opacity: 1 } }
@keyframes taskRise { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: none } }` }} />

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
      <div onClick={onPlayPause} style={{ position: "relative", zIndex: 5, minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: isMobile ? `2.5rem 1.25rem 5rem ${railW - 6 + 20}px` : `3.5rem 2rem 5rem ${railW - 7 + 32}px`, cursor: "pointer" }}>
        <div style={{ width: "100%", maxWidth: "520px" }}>
          {/* Content card — clicks here don't toggle timer */}
          <div className="pomo-card" onClick={(e) => e.stopPropagation()} style={{ background: "rgba(15,14,12,0.82)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px", padding: isMobile ? "1.25rem 1.15rem 1.1rem" : "1.75rem 1.75rem 1.5rem", boxShadow: `0 0 40px ${phase.color}10`, cursor: "default", maxHeight: isMobile ? "calc(100vh - 7.5rem)" : "calc(100vh - 8.5rem)", overflowY: "auto", msOverflowStyle: "none", scrollbarWidth: "none" }}>
            {phaseId === "work" && <WorkContent phase={phase} items={config.workItems} summary={config.workSummary} heading={config.workHeading} />}
            {phaseId === "micro" && <SimpleBreakContent phase={phase} exercises={config.microBreakExercises} summary={config.microBreakSummary} heading={config.microBreakHeading} />}
            {phaseId === "short" && <SimpleBreakContent phase={phase} exercises={config.shortBreakExercises} summary={config.shortBreakSummary} heading={config.shortBreakHeading} />}
            {phaseId === "long" && <LongBreakContent phase={phase} exercises={config.longBreakExercises} summary={config.longBreakSummary} heading={config.longBreakHeading} />}
          </div>
        </div>
      </div>

      <SettingsDrawer phases={PHASES} phaseId={phaseId} setPhaseId={handlePhaseChange} phase={phase} durations={durations} setDurations={setDurations} isPlaying={isPlaying} onPlayPause={onPlayPause} onReset={onReset} microEnabled={microEnabled} toggleMicro={toggleMicro} loopsUntilShort={loopsUntilShort} setLoopsUntilShort={setLoopsUntilShort} setsUntilLong={setsUntilLong} setSetsUntilLong={setSetsUntilLong} blocksPerSet={blocksPerSet} workCount={workCount} muted={muted} toggleMuted={toggleMuted} taskEnabled={taskEnabled} toggleTaskTimer={toggleTaskTimer} taskDuration={taskDuration} setTaskDuration={setTaskDuration} taskElapsed={taskElapsed} onResetTask={onResetTask} showNumbers={taskShowNumbers} toggleShowNumbers={toggleShowNumbers} />

      {taskDone && <TaskCompleteOverlay color={PHASES.work.color} minutes={taskDuration} onContinue={onTaskContinue} />}
    </div>
  );
}
