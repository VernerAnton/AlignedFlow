# AlignedFlow — Handover Notes V2

> **Context**: This handover replaces the V1 handover. Everything listed under "What needs building" in V1 has been built. Both modes are feature-complete and ready for production deployment.

## What this project is

A two-mode wellness app built in React JSX. Designed for deployment on Vercel as a single app with route-based mode switching.

- **Mode 1 — Pomodoro (AlignedFlow_v2_mobile.jsx)**: Workday timer with posture/exercise reminders. Three phases (Work, Short Break, Long Break) with auto-progression. All controls live in a bottom drawer — the main screen is just the content card and the waterline timer.
- **Mode 2 — Evening Routine (AlignedFlow_evening.jsx)**: Stretching routine timer. 16 exercises across 4 sections (Standing → Floor → Seated → Lying). Card-stack UI with bilateral switch indicator for per-side exercises.

## Design philosophy

**No numerical timers on screen.** The background fill IS the timer — it drains downward during exercises and rises during transitions. You glance at how much color is left to know where you are. The timer rail on the side gives precision if you want it. This is spatial, not numerical.

## Design language (shared across both modes)

- Dark background: `#0f0e0c`
- Warm muted accent colors per section/phase
- **Background-as-timer**: entire screen fill represents time remaining
- **Waterline**: 2px crisp line (full width, GPU-composited via `transform: translateY`) + soft gradient glow above it
- **Smooth waterline**: driven by `requestAnimationFrame` at 60fps, interpolating between integer seconds. No CSS transitions on position — RAF handles all movement. Color transitions (`background 0.6s`) still use CSS
- **Timer rail**: Pomodoro = left side, Evening = right side (mirror layout between modes)
- Rail dimensions: 44px mobile / 52px desktop, ticks inset 2-98%
- Fill extends to meet the rail's vertical line
- DM Mono for UI text, Georgia for titles
- Squared buttons with `borderRadius: 6`

## Smooth waterline — how it works (both modes)

The timer ticks in integer seconds via `setInterval`. `timeLeft` is an integer. But the visual fill (`smoothFillPct`) is a continuous 0-100 value updated at 60fps by a RAF loop.

When each integer second ticks:
1. `segmentFromRef` = fill position for current `timeLeft`
2. `segmentToRef` = fill position for `timeLeft - 1`
3. `segmentStartRef` = `performance.now()`
4. RAF loop interpolates between from→to using `(elapsed / segmentDurationRef)` as the 0→1 fraction

Key behaviors:
- **Pause**: freezes at current `smoothFillPct` (no jump to integer position)
- **Resume**: interpolates from current visual position to next tick target
- **Reset**: animates back to 100% over 600ms with cubic ease-out (`resetAnimatingRef` flag lets RAF run even when not playing)
- `segmentDurationRef` is normally 1000ms, shortened to 600ms for reset, 250ms for card rewind

---

## Evening Routine — Complete Feature List

### Card stack
- Active card centered, shifted above vertical center (25% on mobile, 15% desktop)
- Peek cards above and below — bottom peek is 72px on mobile (shows full title), 58px desktop
- Smooth card transitions: 0.85s default, expo-out easing (`cubic-bezier(0.16, 1, 0.3, 1)`)
- Forward animation: card rises from bottom. Backward: card descends from top
- Cards have `maxWidth: 560px`, centered on desktop
- `TOP_INSET` reduced to 16px on mobile for higher card placement

### Section colors
- Standing: `#c4956a` (amber)
- Floor: `#b8785a` (copper)
- Seated: `#b06878` (rose)
- Lying: `#8e6a99` (dusty plum)
- Colors transition smoothly (0.6s) when section changes
- Each section has three color variants: `color`, `dim` (exercise fill), `transDim` (transition fill)

### Timer phases
- `idle` → `exercise` → `transition` → `exercise` → ... → `done`
- During transitions: waterline RISES (0→100%) instead of draining — visually distinct from exercises
- Transition countdown pill floats above card using `cardRect` positioning
- Transition time configurable: 5-20s via settings popover, default 10s

### Bilateral switch indicator (per-side exercises)

**Exercises with `bilateral: true`**: IDs 1, 3, 4, 6, 7, 8, 9, 10, 11, 12

**Duration math**: `getEffectiveDuration(ex)` adds `SWITCH_BUFFER` (8s) on top of the exercise's base duration. A "60 sec per side" exercise becomes 128 seconds total (60 + 8 + 60). The displayed timing stays "60 sec per side" — honest to the actual stretch time.

**Switch window**: computed by `getSwitchWindow(ex)`. At the midpoint of the effective duration, a centered 8-second window defines `subPhase`:
- `timeLeft > switchWindow.start` → "side1"
- `timeLeft > switchWindow.end` → "switching" (8 seconds)
- `timeLeft <= switchWindow.end` → "side2"

**Two-phase switch animation**:
1. **First 3 seconds** (pulse only): Card content dims to 15% opacity with 1px blur. "SWITCH SIDES" text appears centered (0.9rem, DM Mono). Card border stays at default. Pulsing glow halo radiates from the card.
2. **Last 5 seconds** (pulse + rings): 5 concentric rings appear around the card. Each second, the outermost ring dissolves outward (scales up + fades via `ringDissolve` CSS keyframe). Rings count down visually from 5 to 0.

**Glow halo**: A separate overlay div (`position: absolute, inset: 0, borderRadius: 10`) with a pre-rendered full-intensity `box-shadow` (3 layers). Its `opacity` is driven by `pulseOpacity` — a sine curve derived from the same RAF loop fraction (`t`) that drives the waterline. The pulse peaks at `t = 0.5` (mid-second) and troughs at `t = 0/1` (second boundaries where rings dissolve). This means glow and rings are perfectly synchronized — one clock drives everything.

**Ring shape**: Elliptical spacing — tight horizontally (7px mobile / 10px desktop per ring), wide vertically (14px / 18px). Prevents rings from hitting screen edge or rail on mobile while giving visual breathing room top/bottom. Border-radius uses elliptical CSS (`borderRadius: Ypx / Xpx`).

**Card stack overflow**: Switches to `overflow: visible` during switching so the glow halo extends past the card stack container and over the rail.

**Side labels**: "Side 1" / "Side 2" pill appears in the card header during bilateral exercises (before/after switching, not during).

### Rolodex rewind on reset
When reset is pressed and index > 0, cards flip backwards one by one:
- `REWIND_STEP`: 280ms between each card
- `REWIND_ANIM`: 250ms card transition speed (vs normal 850ms)
- `transitionSpeedRef` controls card CSS transition duration dynamically
- `rewindingRef` flag blocks next/prev/play during rewind
- Each step force-unlocks `isAnimRef` before calling `slide("bwd", 250)`
- Waterline rises smoothly back to 100% over the full rewind duration
- When index reaches 0, default transition speed (900ms) is restored

### Navigation buttons
- Centered horizontally within fill area: `left: (windowW - railW) / 2` (not viewport center)
- Fixed at `bottom: 1.5rem`
- Play/Pause, Prev, Next, Reset, Settings gear

### Sound effect hooks (for production — not yet wired)
Three commented audio cue points in the code:
1. **PULSE TONE**: Once per second during first 3 seconds of switching. ~220Hz sine, 80ms, volume 0.15
2. **RING TONE**: Once per second during last 5 seconds (ring dissolves). ~440Hz sine, 100ms, volume 0.2
3. **SIDE-2 CHIME**: Single chime when switching ends. Two-note rising tone (330→440Hz), 150ms each, volume 0.25

---

## Pomodoro Mode — Complete Feature List

### Timer engine
- Countdown in seconds, `timeLeft` drives phase logic
- Same RAF smooth fill as evening mode (60fps interpolation)
- Same pause/resume/reset smoothness (freeze at visual position, animate reset)

### Phases and auto-progression
- **Work** (blue `#4A90D9`): Default 25min. Posture checklist content card
- **Short Break** (green `#3aaa7a`): Default 5min. Three exercise tabs (Reset A, Reset B, Stretch)
- **Long Break** (purple `#9b72cf`): Default 15min. Two exercise tabs (DCF Wall Protocol, Pec Minor Stretch)
- Auto-progression: Work → Short Break. Every Nth work session → Long Break (N configurable, default 4). Any break → Work
- `workCount` tracks completed work sessions

### Controls — all in the bottom drawer
- **START/PAUSE button**: Phase-colored, prominent
- **RESET button**: Muted, next to start
- **Phase selector**: Manual override (disabled during playback)
- **Duration sliders**: Work (15-50min), Short Break (1-15min), Long Break (1-30min)
- **Sessions until long break**: Slider, 2-8, default 4
- Drawer uses chevron handle, click-outside-to-close

### Background tap to play/pause
- `onClick` on the content wrapper div toggles `isPlaying`
- Content card has `stopPropagation` so clicking exercises doesn't pause
- Drawer sits at `zIndex: 20`, unaffected

### Timer rail — LEFT side (mirror of evening mode)
- Rail on left, vertical line on right side of rail
- Ticks extend rightward from left edge
- Labels left-aligned
- Fill and waterline glow inset from left (rail side)
- Content padding has extra space on left for the rail

### Content card
- Centered vertically, max-width 520px
- Semi-transparent dark background with backdrop blur
- Phase-specific content (posture setup for work, exercises for breaks)
- Exercise tabs for break phases with step-by-step instructions

---

## Deployment plan

### Recommended: Vercel + Next.js or Vite

1. Set up with `npm create vite@latest alignedflow -- --template react` or Next.js
2. Both JSX files become route components:
   - `/` or `/work` → `AlignedFlow_v2_mobile.jsx`
   - `/evening` → `AlignedFlow_evening.jsx`
3. Add a mode switcher (tab bar, swipe gesture, or URL-based routing)
4. Push to GitHub, connect to Vercel, auto-deploy

### Things to add in production
- **Sound effects**: Wire up the three audio cue hooks in the evening mode (see commented blocks near `SWITCH_BUFFER` constant). Use Web Audio API (`AudioContext`) or Howler.js
- **Mode switcher**: Navigation between pomodoro and evening modes. Consider a minimal tab at the top or a swipe gesture
- **PWA support**: Service worker for offline use, manifest for "Add to Home Screen"
- **Persistent settings**: Save duration preferences, transition time, and sessions-until-long-break to localStorage
- **Wake lock**: Use `navigator.wakeLock` API to prevent screen from sleeping during exercises

## File locations
- `AlignedFlow_evening.jsx` — evening routine (feature-complete)
- `AlignedFlow_v2_mobile.jsx` — pomodoro workday timer (feature-complete)
