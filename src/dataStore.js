// ── Data store: defaults, persistence, color computation, export/import ──

const STORAGE_KEY = "alignedflow-config";

export function computeSectionColors(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return {
    color: hex,
    dim: `rgba(${r},${g},${b},0.26)`,
    transDim: `rgba(${r},${g},${b},0.11)`,
  };
}

export function computePhaseDim(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},0.32)`;
}

export const DEFAULT_CONFIG = {
  version: 1,
  evening: {
    sections: [
      { name: "Standing", color: "#c4956a" },
      { name: "Floor", color: "#b8785a" },
      { name: "Seated", color: "#b06878" },
      { name: "Lying", color: "#8e6a99" },
    ],
    exercises: [
      { id: 1, section: "Standing", title: "Reverse Prayer / Pyramid", timing: "60 sec per side", duration: 120, bilateral: true,
        steps: ["Hands clasped behind back — palms together, fingers pointing up", "For pyramid: one foot forward, hinge at the hip into the fold", "Strong stretch across the front of the chest and shoulders", "Move into pyramid when reverse prayer alone stops feeling sufficient"] },
      { id: 2, section: "Standing", title: "Uttanasana with Shoulder Bind", timing: "90 sec", duration: 90,
        steps: ["Standing forward fold, hands clasped behind the back", "Let arms fall overhead as you fold — gravity opens the shoulders", "Knees can have a slight bend", "Head heavy, neck fully released"] },
      { id: 3, section: "Standing", title: "Forward Fold — Bent Knee", timing: "60 sec per side", duration: 120, bilateral: true,
        steps: ["One knee bent, other leg straight — targets calf and posterior chain", "Fold as deep as comfortable, let gravity do the work", "Progression: Half Hanuman when this stops feeling effective"] },
      { id: 4, section: "Floor", title: "Thoracic Rotation — Quadruped", timing: "90 sec (8 slow reps per side)", duration: 90, bilateral: true,
        steps: ["Hands and knees, one hand behind the head", "Rotate elbow toward the ceiling, then toward the opposite knee", "Opens mid-thoracic spine — creates space for the shoulder work that follows", "Move slowly, pause at end range"] },
      { id: 5, section: "Floor", title: "Camel–Child Flow", timing: "3 min (6 rounds)", duration: 180,
        steps: ["From kneeling, rise into camel — hands on lower back or reaching for heels", "Open the chest, let the head follow naturally — do not force neck extension", "Hold camel 20–30 sec, then fold back into child's pose", "Rest until ready, then rise back into camel", "Rhythmic, not rushed — let the spine decompress between positions"] },
      { id: 6, section: "Floor", title: "Belly Shoulder & Chest Stretch", timing: "120 sec per side", duration: 240, bilateral: true,
        steps: ["Lie on stomach, one arm straight out to the side (~90°), palm down", "Slowly roll the chest away from that arm", "Let gravity load the shoulder — no forcing", "Feel: front of shoulder, chest, armpit area", "A line of sensation down the arm is acceptable"] },
      { id: 7, section: "Floor", title: "Side-Lying Chest Opener", timing: "90 sec per side", duration: 180, bilateral: true,
        steps: ["Lie on side, bottom arm straight out in front, palm down", "Knees slightly bent for stability", "Slowly rotate chest open toward the ceiling", "Bottom shoulder stays heavy, arm stays down", "Rotate chest away from the arm — don't force the arm down"] },
      { id: 8, section: "Floor", title: "Lizard Pose", timing: "90 sec per side", duration: 180, bilateral: true,
        steps: ["Low lunge with front foot outside the hand", "Sink hips toward the floor, let hip flexor open passively", "Stay on hands or drop to forearms for a deeper hold", "Progression: Reclined Hero when lizard stops feeling sufficient"] },
      { id: 9, section: "Floor", title: "Pigeon Pose", timing: "120 sec per side", duration: 240, bilateral: true,
        steps: ["Front shin across the mat, back leg extended", "Fold forward as far as comfortable — chest toward the floor", "Completely passive hold, let gravity do the work", "No effort here — this is full release"] },
      { id: 10, section: "Seated", title: "Eagle Arms", timing: "60 sec per side", duration: 120, bilateral: true,
        steps: ["Seated, arms crossed at elbows, wrap forearms and bring palms together", "Lift elbows slightly — stretch across upper back and posterior shoulder", "Right side priority — right shoulder protracts more from mouse use"] },
      { id: 11, section: "Seated", title: "Gomukhasana Arms", timing: "60 sec per side", duration: 120, bilateral: true,
        steps: ["One arm reaching down the back, other arm reaching up and clasping", "Use a strap or towel if hands don't meet", "Right arm down first — targets front of right shoulder specifically", "Strong stretch, hold steady and breathe into it"] },
      { id: 12, section: "Seated", title: "Seated Spinal Twist", timing: "60 sec per side", duration: 120, bilateral: true,
        steps: ["One leg extended, other foot planted outside the opposite knee", "Twist toward the bent knee, use arm as lever against the knee", "Long spine throughout — do not collapse into the twist", "Breathe into rotation, deepen slightly on each exhale"] },
      { id: 13, section: "Seated", title: "Padmasana Forward Fold", timing: "2 min", duration: 120,
        steps: ["Seated cross-legged or full lotus if comfortable", "Hands behind the neck, curl upper body forward, elbows toward the floor", "Completely calm — this is the transition into the passive section"] },
      { id: 14, section: "Seated", title: "Massage Gun", timing: "7 min", duration: 420,
        steps: ["Neck and upper traps: medium pressure, keep moving, focus on hard areas", "Shoulder front (where chest meets shoulder) — right side priority, do both", "Shoulder back: behind the joint, not on the spine", "Right: 60–90s front + 60–90s back · Left: 30–45s front + 30–45s back", "Slow glides, calm breathing, no digging"] },
      { id: 15, section: "Lying", title: "Foam Roller — Thoracic Extension", timing: "2 min", duration: 120,
        steps: ["Place roller across the upper back", "Lie back with arms crossed or overhead", "Small extensions over the roller", "Move up and down to hit different thoracic segments", "Do not roll the lower back or neck"] },
      { id: 16, section: "Lying", title: "Peanut Ball — Skull Base", timing: "5 min", duration: 300,
        steps: ["Lie on back, peanut ball where skull meets neck", "Small nods and gentle turns", "Pause on tight spots and breathe", "Fully passive — let the weight of your head do the work"] },
    ],
    switchBuffer: 8,
    transitionTime: 10,
    muted: false,
  },
  pomodoro: {
    phases: {
      work: { color: "#4A90D9", tag: "FOCUS", label: "Work Session" },
      micro: { color: "#e8899e", tag: "MICRO", label: "Micro Break" },
      short: { color: "#3aaa7a", tag: "SHORT BREAK", label: "Micro-Reset" },
      long: { color: "#9b72cf", tag: "LONG BREAK", label: "Long Break" },
    },
    workItems: [
      { id: "a", primary: "Collarbones wide, shoulders heavy", note: "the single cue that triggers everything else" },
      { id: "b", primary: "Monitor: top edge at / below eye level, arm's length away" },
      { id: "c", primary: "Keyboard & mouse: elbows under shoulders, not reaching forward" },
      { id: "d", primary: "Forearms: roughly half resting on desk", note: "highest-leverage adjustment" },
      { id: "e", primary: "Neutral neck: double chin, then release 20–30%" },
      { id: "f", primary: "Phone: at eye level for anything over 30 seconds" },
    ],
    microBreakSummary: "3 quick resets · pick one",
    shortBreakSummary: "3 exercises · under 60 seconds",
    longBreakSummary: "2 exercises · 7 minutes total",
    microBreakExercises: [
      { label: "Eyes", title: "20-20-20 gaze reset", time: "20 sec", steps: ["Look at something roughly 6 m away", "Soften the focus — let the eyes go lazy", "Blink slowly five times"] },
      { label: "Stand", title: "Stand & unload", time: "20 sec", steps: ["Stand up fully, reach both arms overhead", "Roll the shoulders back once, let them drop heavy", "Shift weight side to side twice"] },
      { label: "Breath", title: "Three-breath reset", time: "20 sec", steps: ["Inhale through the nose for 4", "Exhale slowly through the mouth for 6", "Three rounds — jaw and tongue loose"] },
    ],
    shortBreakExercises: [
      { label: "Reset A", title: "Shoulder sequence", time: "20 sec", steps: ["Shrug both shoulders up to ears", "Roll them back — squeeze shoulder blades together", "Drop them down completely, let them fall heavy", "Repeat once more", "Widen collarbones, settle 10–20% back", "3 slow belly breaths"] },
      { label: "Reset B", title: "Neck de-bracing", time: "15 sec", steps: ["Sit tall, chin level", "Glide head straight back — subtle double chin, face stays level", "5 small nods from that retracted position", "Hold the last one 5 seconds, then release fully"] },
      { label: "Stretch", title: "Levator scapulae — right priority", time: "20 sec", steps: ["Sit tall, actively drop right shoulder down and back", "Tilt head left and slightly forward — 45° between left and down", "Feel stretch from right shoulder-neck junction upward", "Right side: 20 sec · Left side: 12 sec", "Release, reset before returning to work"] },
    ],
    longBreakExercises: [
      { label: "DCF", title: "DCF Wall Protocol", subtitle: "Deep Cervical Flexor — primary rehab exercise", time: "5 min · 10 reps", steps: ["Stand or sit with back of skull touching the wall", "Chin level — not lifted, not tucked", "Gently nod chin toward throat — double chin movement. Skull stays on wall.", "Hold 10 seconds. Sternocleidomastoid must stay soft.", "Release fully. Rest 5 seconds.", "Repeat for 10 reps."], note: "If the rope-like muscle on the side of your neck activates, the movement is too large. Reduce it." },
      { label: "Pec minor", title: "Pec Minor Doorframe Stretch", subtitle: "The structural intervention — do not skip this", time: "90 sec", steps: ["Stand in doorframe — forearms on frame at shoulder height, elbows at 90°", "Step one foot through the doorway, gently lean forward", "Feel stretch across chest — not in shoulder joint", "Hold 30 sec, breathing slowly", "Raise arms to Y-shape (~135°) — 30 sec", "Return to 90° for final 30 sec"], note: "No doorframe: corner of a room with both hands on walls, same movement." },
    ],
    durations: { work: 25, micro: 2, short: 5, long: 15 },
    // Micro breaks are off by default — a standard pomodoro out of the box.
    // Turning them on is what introduces the inner loop.
    microEnabled: false,
    loopsUntilShort: 3,  // focus blocks per short break (inner loop, micro on only)
    setsUntilLong: 4,    // sets per long break (outer loop; == focus blocks when micro is off)
    muted: false,
  },
};

// ── Migration ──

// Brings a stored/imported pomodoro config up to the current shape in place.
// Configs written before micro breaks existed carry a flat `loopsUntilLong`
// (focus blocks until a long break). Since those configs also predate the
// micro toggle they land with micro off, where a set is exactly one focus
// block — so the old count carries straight over and the cadence is
// unchanged. Only a config that already opted into micro breaks needs the
// count split across the two loops.
export function migratePomodoro(p) {
  const d = DEFAULT_CONFIG.pomodoro;
  if (!p.phases) p.phases = structuredClone(d.phases);
  else if (!p.phases.micro) p.phases.micro = { ...d.phases.micro };

  if (!p.microBreakSummary) p.microBreakSummary = d.microBreakSummary;
  if (!p.shortBreakSummary) p.shortBreakSummary = d.shortBreakSummary;
  if (!p.longBreakSummary) p.longBreakSummary = d.longBreakSummary;
  if (!Array.isArray(p.microBreakExercises)) p.microBreakExercises = structuredClone(d.microBreakExercises);

  if (!p.durations) p.durations = { ...d.durations };
  else if (p.durations.micro == null) p.durations.micro = d.durations.micro;

  if (p.microEnabled == null) p.microEnabled = d.microEnabled;
  if (p.loopsUntilShort == null) p.loopsUntilShort = d.loopsUntilShort;
  if (p.setsUntilLong == null) {
    if (p.loopsUntilLong == null) {
      p.setsUntilLong = d.setsUntilLong;
    } else if (p.microEnabled) {
      p.setsUntilLong = Math.max(1, Math.round(p.loopsUntilLong / p.loopsUntilShort));
    } else {
      p.setsUntilLong = p.loopsUntilLong;
    }
  }
  delete p.loopsUntilLong; // superseded by loopsUntilShort × setsUntilLong
  return p;
}

// ── Persistence ──

export function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === 1) {
        migratePomodoro(parsed.pomodoro);
        return parsed;
      }
    }
  } catch (e) {
    // corrupted — fall back to defaults
  }
  return structuredClone(DEFAULT_CONFIG);
}

export function saveConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    // localStorage full or unavailable — silent fail
  }
}

// ── Export / Import ──

export function exportConfig(config) {
  const json = JSON.stringify(config, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const date = new Date().toISOString().slice(0, 10);
  a.download = `alignedflow-config-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function validateAndParseConfig(jsonString) {
  try {
    const c = JSON.parse(jsonString);
    if (!c || typeof c !== "object") return { ok: false, error: "Not a valid JSON object" };
    if (c.version !== 1) return { ok: false, error: "Unsupported config version" };
    if (!c.evening || !c.pomodoro) return { ok: false, error: "Missing evening or pomodoro section" };
    if (!Array.isArray(c.evening.sections)) return { ok: false, error: "Missing evening sections" };
    if (!Array.isArray(c.evening.exercises)) return { ok: false, error: "Missing evening exercises" };
    for (const ex of c.evening.exercises) {
      if (!ex.id || !ex.section || !ex.title || !ex.duration || !Array.isArray(ex.steps))
        return { ok: false, error: `Invalid evening exercise: ${ex.title || ex.id || "unknown"}` };
    }
    if (!Array.isArray(c.pomodoro.workItems)) return { ok: false, error: "Missing pomodoro work items" };
    if (!Array.isArray(c.pomodoro.shortBreakExercises)) return { ok: false, error: "Missing short break exercises" };
    if (!Array.isArray(c.pomodoro.longBreakExercises)) return { ok: false, error: "Missing long break exercises" };
    migratePomodoro(c.pomodoro);
    return { ok: true, config: c };
  } catch (e) {
    return { ok: false, error: "Invalid JSON" };
  }
}

// ── Utilities ──

export function nextId(existingIds) {
  const nums = existingIds.map(Number).filter((n) => !isNaN(n));
  return nums.length ? Math.max(...nums) + 1 : 1;
}
