import { useState, useEffect, useRef, useMemo } from "react";
import { playPulseTone, playRingTone, playSide2Chime, playExerciseCompleteSound, playDoneSound } from "./sounds";
import { sendNotification } from "./notifications";
import { computeSectionColors } from "./dataStore";

const SWITCH_RING_COUNT = 5;

function getEffectiveDuration(ex, switchBuffer) {
  return ex.bilateral ? ex.duration + switchBuffer : ex.duration;
}

function getSwitchWindow(ex, switchBuffer) {
  if (!ex.bilateral) return null;
  const eff = getEffectiveDuration(ex, switchBuffer);
  const midpoint = Math.floor(eff / 2);
  return {
    start: midpoint + Math.floor(switchBuffer / 2),
    end: midpoint - Math.ceil(switchBuffer / 2),
  };
}

function useWindowSize() {
  const [s, setS] = useState({ w: typeof window !== "undefined" ? window.innerWidth : 800, h: typeof window !== "undefined" ? window.innerHeight : 700 });
  useEffect(() => {
    const fn = () => setS({ w: window.innerWidth, h: window.innerHeight });
    fn();
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return s;
}

// ── Rail ────────────────────────────────────────────────────────────────────

function TimerRail({ timeLeft, totalDuration, isMobile, color }) {
  const railW = isMobile ? 44 : 52;

  const tickInterval = totalDuration > 120 ? 60 : totalDuration > 60 ? 30 : totalDuration > 20 ? 10 : 5;
  const ticks = [];
  for (let t = totalDuration; t >= 0; t -= tickInterval) ticks.push(t);
  if (ticks[ticks.length - 1] !== 0) ticks.push(0);

  const fmt = (s) => {
    if (totalDuration > 60) {
      const m = Math.floor(s / 60), r = s % 60;
      return r === 0 ? `${m}m` : `${m}:${String(r).padStart(2, "0")}`;
    }
    return `${s}s`;
  };

  return (
    <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: railW, zIndex: 10 }}>
      <div style={{ position: "absolute", left: isMobile ? 5 : 6, top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.1)" }} />


      {ticks.map((t) => {
        const raw = (1 - t / totalDuration) * 100;
        const pos = 2 + raw * 0.96;
        const isPast = t > timeLeft;
        const isActive = Math.abs(t - timeLeft) <= tickInterval * 0.6;
        return (
          <div key={t} style={{ position: "absolute", top: `${pos}%`, right: 0, display: "flex", alignItems: "center", flexDirection: "row-reverse", gap: 3, transform: "translateY(-50%)" }}>
            <div style={{ width: isMobile ? 6 : 10, height: 1, background: isActive ? color : "rgba(255,255,255,0.22)", opacity: isPast ? 0.3 : 1 }} />
            <span style={{ fontSize: isMobile ? "0.5rem" : "0.57rem", fontFamily: "'DM Mono', monospace", color: isActive ? color : "rgba(255,255,255,0.28)", opacity: isPast ? 0.4 : 1, whiteSpace: "nowrap", letterSpacing: "0.04em", textAlign: "right" }}>
              {fmt(t)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Card ────────────────────────────────────────────────────────────────────

// Pulse keyframe for the card during switching
const pulseKeyframes = `
@keyframes ringDissolve {
  0% { opacity: 0.45; transform: scale(1); }
  50% { opacity: 0.2; transform: scale(1.06); }
  100% { opacity: 0; transform: scale(1.12); }
}
`;

function SwitchRings({ switchSecsLeft, color, cardRect, isMobile, railW }) {
  // Only show rings in the last SWITCH_RING_COUNT seconds
  if (switchSecsLeft > SWITCH_RING_COUNT || switchSecsLeft <= 0 || !cardRect) return null;

  // switchSecsLeft counts down: 5, 4, 3, 2, 1
  // Ring index 0 = innermost (closest to card), SWITCH_RING_COUNT-1 = outermost
  // A ring is visible if its index < switchSecsLeft
  // The ring currently dissolving is index === switchSecsLeft - 1

  // Elliptical spacing: tight horizontally (sides near rail/screen edge), wide vertically
  const spreadX = isMobile ? 7 : 10;
  const spreadY = isMobile ? 14 : 18;

  return (
    <>
      {Array.from({ length: SWITCH_RING_COUNT }, (_, ringIndex) => {
        const isVisible = ringIndex < switchSecsLeft;
        const isDissolvingNow = ringIndex === switchSecsLeft - 1;
        const sx = (ringIndex + 1) * spreadX;
        const sy = (ringIndex + 1) * spreadY;

        if (!isVisible && !isDissolvingNow) return null;

        // Elliptical border-radius to match the oval spread
        const brX = 10 + sx * 0.3;
        const brY = 10 + sy * 0.3;

        return (
          <div
            key={`ring-${ringIndex}-${switchSecsLeft}`}
            style={{
              position: "fixed",
              top: cardRect.top - sy,
              left: cardRect.left - sx,
              width: cardRect.width + sx * 2,
              height: cardRect.height + sy * 2,
              borderRadius: `${brY}px / ${brX}px`,
              border: `1px solid ${color}`,
              opacity: isDissolvingNow ? 0 : (0.45 - ringIndex * 0.06),
              animation: isDissolvingNow ? "ringDissolve 0.85s ease-out forwards" : "none",
              pointerEvents: "none",
              transition: isDissolvingNow ? "none" : "opacity 0.3s ease",
              zIndex: 4,
            }}
          />
        );
      })}
    </>
  );
}

function ExerciseCard({ ex, color, sideLabel, totalCount }) {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", padding: "1.4rem 1.4rem 1.1rem", overflow: "hidden" }}>
      <div style={{ flexShrink: 0, marginBottom: "0.85rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.4rem" }}>
          <span style={{ fontSize: "0.6rem", letterSpacing: "0.16em", textTransform: "uppercase", color: color, fontFamily: "'DM Mono', monospace" }}>{ex.section}</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
            {sideLabel && (
              <span style={{
                fontSize: "0.5rem", letterSpacing: "0.12em", textTransform: "uppercase",
                fontFamily: "'DM Mono', monospace", color: `${color}99`,
                padding: "0.1rem 0.4rem", border: `1px solid ${color}30`, borderRadius: 4,
                transition: "opacity 0.4s ease",
              }}>
                {sideLabel}
              </span>
            )}
            <span style={{ fontSize: "0.6rem", fontFamily: "'DM Mono', monospace", color: "rgba(255,255,255,0.2)", letterSpacing: "0.06em" }}>{String(ex.id).padStart(2, "0")} / {String(totalCount).padStart(2, "0")}</span>
          </div>
        </div>
        <div style={{ fontSize: "1.1rem", color: "#f0ece4", fontFamily: "Georgia, serif", lineHeight: 1.25, marginBottom: "0.35rem" }}>{ex.title}</div>
        <div style={{ fontSize: "0.63rem", fontFamily: "'DM Mono', monospace", color: `${color}bb`, letterSpacing: "0.05em" }}>{ex.timing}</div>
      </div>
      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: "0.85rem", flexShrink: 0 }} />
      <div style={{ flex: 1, overflow: "auto" }}>
        {ex.steps.map((step, i) => (
          <div key={i} style={{ display: "flex", gap: "0.7rem", alignItems: "flex-start", marginBottom: "0.48rem" }}>
            <div style={{ width: 8, height: 8, background: `${color}55`, transform: "rotate(45deg)", flexShrink: 0, marginTop: "0.37rem" }} />
            <span style={{ fontSize: "0.83rem", color: "#ccc8be", lineHeight: 1.65 }}>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Root ────────────────────────────────────────────────────────────────────

export default function EveningRoutine({ config }) {
  const exercises = config.exercises;
  const switchBuffer = config.switchBuffer;

  const sectionColorMap = useMemo(() => {
    const map = {};
    config.sections.forEach(s => { map[s.name] = computeSectionColors(s.color); });
    return map;
  }, [config.sections]);
  const getColors = (section) => sectionColorMap[section] || computeSectionColors("#c4956a");

  const { w: windowW, h: windowH } = useWindowSize();
  const isMobile = windowW < 600;
  const railW = isMobile ? 44 : 52;

  const PEEK_STRIP = isMobile ? 72 : 58;       // how much prev/next card shows
  const TOP_INSET = isMobile ? 16 : PEEK_STRIP + 10;  // less top padding on mobile
  const BTN_CLEARANCE = 90;                      // space for floating controls
  const BOT_INSET = PEEK_STRIP + BTN_CLEARANCE;  // space reserved at bottom
  const containerH = windowH;
  const MAX_CARD_H = containerH - TOP_INSET - BOT_INSET;
  const CARD_TOP = TOP_INSET;                    // where active card starts

  // Session state
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState("idle"); // idle | exercise | transition | done
  const [timeLeft, setTimeLeft] = useState(getEffectiveDuration(exercises[0], switchBuffer));
  const [isPlaying, setIsPlaying] = useState(false);

  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);
  const toggleMuted = () => { setMuted(m => { const next = !m; mutedRef.current = next; return next; }); };

  // Bilateral sub-phase — derived from timeLeft for bilateral exercises
  // "side1" | "switching" | "side2" | null (for non-bilateral)
  const curEx = exercises[index];
  const switchWindow = getSwitchWindow(curEx, switchBuffer);
  const subPhase = (() => {
    if (!curEx.bilateral || phase !== "exercise") return null;
    if (!switchWindow) return null;
    if (timeLeft > switchWindow.start) return "side1";
    if (timeLeft > switchWindow.end) return "switching";
    return "side2";
  })();

  // How many seconds left in the switch (for ring display)
  const switchSecsLeft = subPhase === "switching" && switchWindow
    ? timeLeft - switchWindow.end
    : 0;

  // ── Sound effects for bilateral switch ────────────────────────────────
  const prevSubPhaseRef = useRef(null);

  // Pulse + ring tones — fire once per second tick during switching
  useEffect(() => {
    if (!isPlaying || phase !== "exercise" || subPhase !== "switching") return;
    if (switchSecsLeft > SWITCH_RING_COUNT) {
      playPulseTone(mutedRef.current);
    } else if (switchSecsLeft > 0) {
      playRingTone(mutedRef.current);
    }
  }, [timeLeft]);

  // Side-2 chime — fires once when switching ends
  useEffect(() => {
    if (prevSubPhaseRef.current === "switching" && subPhase === "side2") {
      playSide2Chime(mutedRef.current);
    }
    prevSubPhaseRef.current = subPhase;
  }, [subPhase]);

  // Track the active card's bounding rect for ring positioning
  const [cardRect, setCardRect] = useState(null);
  const cardRectRef = useRef(null);

  // Animation — we track the "visual index" separately from the logical index.
  // On navigate: logical index updates instantly, visual index animates to match.
  const [animOffset, setAnimOffset] = useState(0); // -1, 0, 1 — offset from logical index
  const isAnimRef = useRef(false);
  const cardRef = useRef(null);
  const [measuredH, setMeasuredH] = useState(300);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Refs for timer closure safety
  const indexRef = useRef(0);
  const phaseRef = useRef("idle");

  useEffect(() => { indexRef.current = index; }, [index]);

  useEffect(() => {
    // Don't re-measure during switching — the overlay can cause sub-pixel reflow
    if (subPhase === "switching") return;
    if (cardRef.current) {
      setMeasuredH(cardRef.current.offsetHeight);
      const r = cardRef.current.getBoundingClientRect();
      setCardRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      cardRectRef.current = { top: r.top, left: r.left, width: r.width, height: r.height };
    }
  }, [index]);

  // Update card rect on resize or animation settle
  useEffect(() => {
    const updateRect = () => {
      if (cardRef.current) {
        const r = cardRef.current.getBoundingClientRect();
        setCardRect({ top: r.top, left: r.left, width: r.width, height: r.height });
        cardRectRef.current = { top: r.top, left: r.left, width: r.width, height: r.height };
      }
    };
    window.addEventListener("resize", updateRect);
    // Update after card transitions settle, and re-measure periodically during switching
    const t = setTimeout(updateRect, 1000);
    const interval = subPhase === "switching" ? setInterval(updateRect, 500) : null;
    return () => {
      window.removeEventListener("resize", updateRect);
      clearTimeout(t);
      if (interval) clearInterval(interval);
    };
  }, [index, subPhase]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);


  const slide = (dir, speed) => {
    const spd = speed || 900;
    if (isAnimRef.current) return;
    isAnimRef.current = true;
    setIsTransitioning(true);
    transitionSpeedRef.current = spd;
    setAnimOffset(dir === "fwd" ? 1 : -1);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setAnimOffset(0);
      });
    });
    setTimeout(() => { isAnimRef.current = false; setIsTransitioning(false); }, spd);
  };

  // Rewind state for rolodex reset
  const rewindingRef = useRef(false);
  const rewindIntervalRef = useRef(null);
  const transitionSpeedRef = useRef(900); // default card transition ms

  // ── Smooth fill interpolation ───────────────────────────────────────────
  // The integer timeLeft drives display and phase logic.
  // smoothFillPct is a continuous 0-100 value updated at 60fps for the waterline.
  // We track the real clock time when each second-segment starts, then interpolate
  // within that segment using performance.now().
  const [smoothFillPct, setSmoothFillPct] = useState(100);
  const segmentStartRef = useRef(null);    // performance.now() when current second started
  const segmentFromRef = useRef(100);      // fillPct at start of current second-segment
  const segmentToRef = useRef(100);        // fillPct at end of current second-segment
  const segmentDurationRef = useRef(1000); // ms — normally 1s, shorter for reset animation
  const resetAnimatingRef = useRef(false);
  const rafRef = useRef(null);
  const isPlayingRef = useRef(false);
  const [pulseOpacity, setPulseOpacity] = useState(0);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  // Compute what fillPct should be for a given timeLeft value
  const computeFill = (tl, ph, dur) => {
    if (ph === "idle") return 100;
    if (ph === "transition") return dur > 0 ? (1 - tl / dur) * 100 : 100;
    return dur > 0 ? (tl / dur) * 100 : 0;
  };

  // Countdown tick — still integer seconds for display
  useEffect(() => {
    if (!isPlaying || phase === "idle" || phase === "done") return;
    const id = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [isPlaying, phase, index]);

  // When timeLeft changes (new second tick), set up the next interpolation segment
  useEffect(() => {
    if (resetAnimatingRef.current) return;
    const dur = phaseRef.current === "transition" ? config.transitionTime : getEffectiveDuration(exercises[indexRef.current], switchBuffer);
    const currentFill = computeFill(timeLeft, phaseRef.current, dur);
    const nextFill = computeFill(Math.max(0, timeLeft - 1), phaseRef.current, dur);

    if (!isPlayingRef.current || phaseRef.current === "idle" || phaseRef.current === "done") {
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
  }, [timeLeft, phase]);

  // Also snap when pausing/resuming or changing phase
  useEffect(() => {
    if (resetAnimatingRef.current) return;
    if (!isPlaying) {
      segmentStartRef.current = null;
      segmentFromRef.current = smoothFillPct;
      segmentToRef.current = smoothFillPct;
    } else {
      const dur = phaseRef.current === "transition" ? config.transitionTime : getEffectiveDuration(exercises[indexRef.current], switchBuffer);
      const nextFill = computeFill(Math.max(0, timeLeft - 1), phaseRef.current, dur);
      segmentDurationRef.current = 1000;
      segmentStartRef.current = performance.now();
      segmentFromRef.current = smoothFillPct;
      segmentToRef.current = nextFill;
    }
  }, [isPlaying]);

  // RAF loop — runs continuously, interpolates fill + computes pulse
  useEffect(() => {
    const tick = () => {
      if (segmentStartRef.current !== null && (isPlayingRef.current || resetAnimatingRef.current)) {
        const elapsed = performance.now() - segmentStartRef.current;
        const t = Math.min(1, elapsed / segmentDurationRef.current);
        const eased = resetAnimatingRef.current ? 1 - Math.pow(1 - t, 3) : t;
        const interpolated = segmentFromRef.current + (segmentToRef.current - segmentFromRef.current) * eased;
        setSmoothFillPct(interpolated);
        // Pulse: sine curve over each second
        const pulse = (Math.sin(t * Math.PI * 2 - Math.PI / 2) + 1) / 2;
        setPulseOpacity(pulse);
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

  // Handle hitting 0
  useEffect(() => {
    if (timeLeft !== 0 || !isPlaying || phaseRef.current === "idle" || phaseRef.current === "done") return;
    if (phaseRef.current === "exercise") {
      const next = indexRef.current + 1;
      if (next >= exercises.length) {
        setIsPlaying(false); setPhase("done"); phaseRef.current = "done";
        playDoneSound(mutedRef.current);
        sendNotification("Evening Routine Complete", "All exercises finished. Sleep well.");
      } else {
        slide("fwd");
        setIndex(next); indexRef.current = next;
        setPhase("transition"); phaseRef.current = "transition";
        setTimeLeft(config.transitionTime);
        playExerciseCompleteSound(mutedRef.current);
      }
    } else if (phaseRef.current === "transition") {
      setPhase("exercise"); phaseRef.current = "exercise";
      setTimeLeft(getEffectiveDuration(exercises[indexRef.current], switchBuffer));
    }
  }, [timeLeft, isPlaying]);

  const onPlayPause = () => {
    if (phase === "done") return;
    if (!isPlaying && phase === "idle") {
      setPhase("exercise"); phaseRef.current = "exercise";
      setTimeLeft(getEffectiveDuration(exercises[index], switchBuffer));
    }
    setIsPlaying((p) => !p);
  };

  const onReset = () => {
    setIsPlaying(false);
    setPhase("idle"); phaseRef.current = "idle";

    // If already at first card, just reset timer
    if (indexRef.current === 0) {
      setTimeLeft(getEffectiveDuration(exercises[0], switchBuffer));
      resetAnimatingRef.current = true;
      segmentDurationRef.current = 600;
      segmentStartRef.current = performance.now();
      segmentFromRef.current = smoothFillPct;
      segmentToRef.current = 100;
      return;
    }

    // Start rolodex rewind — flip backwards through cards
    if (rewindingRef.current) return; // already rewinding
    rewindingRef.current = true;
    isAnimRef.current = false; // unlock in case a transition was in progress

    const REWIND_STEP = 280; // ms per card
    const REWIND_ANIM = 250; // card transition speed during rewind

    // Animate waterline back to 100% over the full rewind duration
    const cardsToRewind = indexRef.current;
    resetAnimatingRef.current = true;
    segmentDurationRef.current = cardsToRewind * REWIND_STEP + REWIND_ANIM;
    segmentStartRef.current = performance.now();
    segmentFromRef.current = smoothFillPct;
    segmentToRef.current = 100;

    const step = () => {
      if (indexRef.current <= 0) {
        // Done rewinding
        clearInterval(rewindIntervalRef.current);
        rewindIntervalRef.current = null;
        rewindingRef.current = false;
        transitionSpeedRef.current = 900; // restore default
        setTimeLeft(getEffectiveDuration(exercises[0], switchBuffer));
        return;
      }
      const p = indexRef.current - 1;
      isAnimRef.current = false; // force unlock for next slide
      slide("bwd", REWIND_ANIM);
      setIndex(p); indexRef.current = p;
    };

    // First step immediately
    step();
    // Then step every REWIND_STEP ms
    rewindIntervalRef.current = setInterval(step, REWIND_STEP);
  };

  const onNext = () => {
    if (index >= exercises.length - 1 || isAnimRef.current || rewindingRef.current) return;
    const n = index + 1;
    slide("fwd"); setIndex(n); indexRef.current = n;
    if (isPlaying) { setPhase("exercise"); phaseRef.current = "exercise"; }
    else setPhase("idle");
    setTimeLeft(getEffectiveDuration(exercises[n], switchBuffer));
  };

  const onPrev = () => {
    if (index <= 0 || isAnimRef.current || rewindingRef.current) return;
    const p = index - 1;
    slide("bwd"); setIndex(p); indexRef.current = p;
    if (isPlaying) { setPhase("exercise"); phaseRef.current = "exercise"; }
    else setPhase("idle");
    setTimeLeft(getEffectiveDuration(exercises[p], switchBuffer));
  };

  const totalDuration = phase === "transition" ? config.transitionTime : getEffectiveDuration(exercises[index], switchBuffer);
  // smoothFillPct is used for the waterline — continuous 60fps interpolation
  // Integer fillPct still needed for rail (which should snap to seconds)
  const fillPct = smoothFillPct;

  // Section-based colors
  const sectionColors = getColors(exercises[index].section);
  const COLOR = sectionColors.color;
  const bgColor = phase === "transition" ? sectionColors.transDim : sectionColors.dim;

  const btnBase = { border: "1px solid rgba(255,255,255,0.18)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" };

  return (
    <div style={{ position: "relative", height: "100%", background: "#0f0e0c", overflow: "hidden", fontFamily: "Georgia, serif" }}>
      <style dangerouslySetInnerHTML={{ __html: pulseKeyframes }} />

      {/* Fill background — drains as time passes (position driven by RAF, color transitions via CSS) */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: isMobile ? railW - 6 : railW - 7, height: `${fillPct}%`, background: bgColor, transition: "background 0.6s", pointerEvents: "none", zIndex: 0 }} />
      {/* Waterline glow */}
      <div style={{ position: "absolute", left: 0, right: isMobile ? railW - 6 : railW - 7, bottom: `${fillPct}%`, height: "80px", background: `linear-gradient(to top, ${COLOR}18, transparent)`, transform: "translateY(40px)", transition: "background 0.6s", pointerEvents: "none", zIndex: 1 }} />

      {/* Crisp waterline — full width */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 2, background: COLOR, opacity: 0.75, transform: `translateY(${(100 - fillPct) * containerH / 100}px)`, transition: "background 0.6s", pointerEvents: "none", zIndex: 2 }} />

      <TimerRail timeLeft={timeLeft} totalDuration={totalDuration} isMobile={isMobile} color={COLOR} />

      {/* Card stack */}
      <div style={{ position: "absolute", top: 0, left: 0, right: railW, height: containerH, overflow: subPhase === "switching" ? "visible" : "hidden", zIndex: 5 }}>

        {/* Done screen */}
        {phase === "done" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "0.62rem", letterSpacing: "0.2em", textTransform: "uppercase", color: COLOR, fontFamily: "'DM Mono', monospace", marginBottom: "0.6rem" }}>Complete</div>
              <div style={{ fontSize: "1.4rem", color: "#f0ece4", marginBottom: "0.4rem" }}>Evening routine done.</div>
              <div style={{ fontSize: "0.78rem", color: "#3a3a3a", fontFamily: "'DM Mono', monospace" }}>Sleep well.</div>
            </div>
          </div>
        )}

        {/* Transition countdown pill — positioned above the active card */}
        {phase === "transition" && cardRect && (
          <div style={{ position: "fixed", top: cardRect.top - 36, left: "50%", transform: "translateX(-50%)", zIndex: 15, pointerEvents: "none" }}>
            <div style={{ fontSize: "0.58rem", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", color: `${COLOR}88`, padding: "0.25rem 0.75rem", border: `1px solid ${COLOR}28`, borderRadius: 20, background: "rgba(15,14,12,0.88)", whiteSpace: "nowrap" }}>
              Get into position — {timeLeft}s
            </div>
          </div>
        )}

        {/* Cards */}
        {[-1, 0, 1, 2].map((rel) => {
          const ci = index + rel;
          if (ci < 0 || ci >= exercises.length) return null;
          const isCurrent = rel === 0;

          // Effective position includes animation offset
          const effectiveRel = rel + animOffset;

          // Opacity: smooth gradient based on effective position
          let opac;
          if (Math.abs(effectiveRel) < 0.01) opac = 1;
          else if (effectiveRel < 0) opac = Math.max(0, 0.35 + effectiveRel * 0.35);
          else if (effectiveRel <= 1) opac = 0.35 - (effectiveRel - 1) * 0.15;
          else opac = 0;

          // Scale: active card is 1, peek cards are slightly smaller
          const scale = Math.abs(effectiveRel) < 0.01 ? 1 : 0.97;

          // Y position based on effective position
          // On mobile: position card in upper third to reduce dead space above
          // On desktop: slight shift above center
          const upShift = isMobile ? measuredH * 0.25 : measuredH * 0.15;
          const centerY = Math.max(CARD_TOP, (containerH - measuredH) / 2 - upShift);
          let ty;
          if (Math.abs(effectiveRel) < 0.01) {
            ty = centerY;
          } else if (effectiveRel < 0) {
            // above: lerp from center to peek-top
            const peekTop = -(measuredH - PEEK_STRIP);
            ty = centerY + effectiveRel * (centerY - peekTop);
          } else if (effectiveRel <= 1) {
            // below: lerp from center to peek-bottom
            const peekBot = containerH - BOT_INSET + 10;
            ty = centerY + effectiveRel * (peekBot - centerY);
          } else {
            // off-screen below
            ty = containerH + 40;
          }

          const dur = isTransitioning ? `${transitionSpeedRef.current / 1000}s` : "0s";
          const ease = "cubic-bezier(0.16, 1, 0.3, 1)"; // expo out — fast start, gentle land

          const isSwitching = isCurrent && subPhase === "switching";

          return (
            <div key={ci} ref={isCurrent ? cardRef : null} style={{
              position: "absolute", top: 0,
              left: isMobile ? 21 : 22,
              right: isMobile ? 14 : 22,
              maxWidth: 560,
              ...((!isMobile) && { left: 7, right: 0, marginLeft: "auto", marginRight: "auto" }),
              maxHeight: isCurrent ? MAX_CARD_H : undefined,
              overflowY: isCurrent ? "auto" : "hidden",
              transform: `translateY(${ty}px) scale(${scale})`,
              transformOrigin: "center top",
              transition: `transform ${dur} ${ease}, opacity ${dur} ${ease}`,
              opacity: opac,
              zIndex: 10 - Math.abs(rel),
              pointerEvents: isCurrent ? "auto" : "none",
              overflow: isSwitching ? "visible" : "hidden",
            }}>
              {/* Glow overlay — opacity driven by RAF loop, synced to ring dissolves */}
              {isSwitching && (
                <div style={{
                  position: "absolute", inset: 0, borderRadius: 10,
                  boxShadow: `0 0 30px 10px ${COLOR}, 0 0 60px 22px ${COLOR}80, 0 0 95px 38px ${COLOR}40`,
                  opacity: 0.1 + pulseOpacity * 0.8,
                  pointerEvents: "none", zIndex: -1,
                }} />
              )}
              {/* Inner wrapper handles visual styling — keeps positioning container clean */}
              <div style={{
                background: "rgba(15,14,12,0.86)",
                backdropFilter: "blur(8px)",
                border: `1px solid ${isCurrent ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.04)"}`,
                borderRadius: 10,
                boxShadow: isCurrent && !isSwitching ? `0 0 40px ${COLOR}15, 0 2px 20px rgba(0,0,0,0.3)` : "0 2px 12px rgba(0,0,0,0.2)",
                overflow: "hidden",
              }}>
              {/* Exercise content — dims during switch */}
              <div style={{
                opacity: isSwitching ? 0.15 : 1,
                transition: "opacity 0.5s ease",
                filter: isSwitching ? "blur(1px)" : "none",
              }}>
                <ExerciseCard
                  ex={exercises[ci]}
                  color={getColors(exercises[ci].section).color}
                  totalCount={exercises.length}
                  sideLabel={isCurrent && exercises[ci].bilateral && phase === "exercise"
                    ? (subPhase === "side1" ? "Side 1" : subPhase === "side2" ? "Side 2" : null)
                    : null
                  }
                />
              </div>

              {/* SWITCH SIDES overlay */}
              {isSwitching && (
                <div style={{
                  position: "absolute", inset: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  pointerEvents: "none", zIndex: 5,
                }}>
                  <div style={{
                    fontSize: "0.9rem", letterSpacing: "0.3em", textTransform: "uppercase",
                    fontFamily: "'DM Mono', monospace", color: COLOR, opacity: 0.9,
                  }}>
                    Switch Sides
                  </div>
                </div>
              )}
              </div>{/* end inner wrapper */}
            </div>
          );
        })}
      </div>

      {/* Switch rings — outside card stack to avoid overflow:hidden clipping */}
      {subPhase === "switching" && cardRect && (
        <SwitchRings
          switchSecsLeft={switchSecsLeft}
          color={COLOR}
          cardRect={cardRect}
          isMobile={isMobile}
          railW={railW}
        />
      )}

      {/* Floating controls — centered horizontally within the fill area (left edge to rail) */}
      <div style={{ position: "fixed", bottom: "1.5rem", left: (windowW - railW) / 2, transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: isMobile ? 7 : 9, zIndex: 20 }}>

        {/* ← prev */}
        <button onClick={onPrev} disabled={index === 0} style={{ ...btnBase, width: 38, height: 38, borderRadius: 6, background: "rgba(15,14,12,0.88)", backdropFilter: "blur(8px)", color: index === 0 ? "#2a2a2a" : "rgba(255,255,255,0.55)", fontSize: "1.1rem", cursor: index === 0 ? "default" : "pointer" }}>‹</button>

        {/* Reset */}
        <button onClick={onReset} style={{ ...btnBase, padding: "0.42rem 0.85rem", borderRadius: 6, background: "rgba(15,14,12,0.88)", backdropFilter: "blur(8px)", color: "rgba(255,255,255,0.45)", fontSize: "0.62rem", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em" }}>RESET</button>

        {/* Play / Pause — primary action, slightly more prominent */}
        <button onClick={onPlayPause} disabled={phase === "done"} style={{ ...btnBase, padding: isMobile ? "0.48rem 1.2rem" : "0.52rem 1.6rem", borderRadius: 6, border: `1px solid ${phase === "done" ? "rgba(255,255,255,0.08)" : COLOR}`, background: phase === "done" ? "rgba(15,14,12,0.7)" : `${COLOR}28`, backdropFilter: "blur(8px)", color: phase === "done" ? "#2a2a2a" : COLOR, fontSize: "0.7rem", fontFamily: "'DM Mono', monospace", letterSpacing: "0.14em", fontWeight: 500, cursor: phase === "done" ? "default" : "pointer" }}>
          {isPlaying ? "PAUSE" : phase === "done" ? "DONE" : "PLAY"}
        </button>

        {/* → next */}
        <button onClick={onNext} disabled={index >= exercises.length - 1} style={{ ...btnBase, width: 38, height: 38, borderRadius: 6, background: "rgba(15,14,12,0.88)", backdropFilter: "blur(8px)", color: index >= exercises.length - 1 ? "#2a2a2a" : "rgba(255,255,255,0.55)", fontSize: "1.1rem", cursor: index >= exercises.length - 1 ? "default" : "pointer" }}>›</button>

        {/* Sound toggle */}
        <button onClick={toggleMuted} style={{ ...btnBase, width: 38, height: 38, borderRadius: 6, background: "rgba(15,14,12,0.88)", backdropFilter: "blur(8px)", border: `1px solid ${muted ? "rgba(255,255,255,0.15)" : COLOR + "44"}`, color: muted ? "rgba(255,255,255,0.2)" : COLOR, fontSize: "0.85rem", position: "relative" }}>
          {muted ? "🔕" : "🔔"}
        </button>
      </div>
    </div>
  );
}
