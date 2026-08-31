// ── Data store: defaults, presets, persistence, colors, export/import ──

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
    // Eyebrow (small caps) + heading (serif) shown above each phase's content.
    // Work's eyebrow was hardcoded until now; the others reused the "summary"
    // name from before headings existed, so it stays for compatibility.
    workSummary: "Posture setup",
    workHeading: "Check in before you start",
    microBreakSummary: "3 quick resets · pick one",
    microBreakHeading: "Pick one, then straight back",
    shortBreakSummary: "3 exercises · under 60 seconds",
    shortBreakHeading: "Do these in sequence",
    longBreakSummary: "2 exercises · 7 minutes total",
    longBreakHeading: "The rehab work",
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
    // Task timer — a budget of focus time that runs across the loops rather
    // than inside them. Off by default; the loop structure alone is the
    // out-of-the-box behaviour.
    taskTimerEnabled: false,
    taskDuration: 50,    // minutes of work-phase time per task
    // With numbers off the pill segment becomes a bar that drains instead of a
    // countdown, for when a visible clock is more pressure than help.
    taskShowNumbers: true,
    muted: false,
  },
};

// ── Migration ──

// Brings a stored/imported pomodoro preset body up to the current shape in
// place. Configs written before micro breaks existed carry a flat
// `loopsUntilLong` (focus blocks until a long break). Since those configs also
// predate the micro toggle they land with micro off, where a set is exactly
// one focus block — so the old count carries straight over and the cadence is
// unchanged. Only a config that already opted into micro breaks needs the
// count split across the two loops.
export function migratePomodoro(p) {
  const d = DEFAULT_CONFIG.pomodoro;
  // Every phase must exist and be complete: the runtime looks phases up by id
  // and would render nothing for a missing one. A preset written by hand or by
  // an AI often names only the phases it meant to change.
  p.phases = Object.fromEntries(
    Object.entries(d.phases).map(([id, def]) => [id, { ...def, ...(p.phases?.[id] || {}) }])
  );

  if (!p.workSummary) p.workSummary = d.workSummary;
  if (!p.workHeading) p.workHeading = d.workHeading;
  if (!p.microBreakSummary) p.microBreakSummary = d.microBreakSummary;
  if (!p.microBreakHeading) p.microBreakHeading = d.microBreakHeading;
  if (!p.shortBreakSummary) p.shortBreakSummary = d.shortBreakSummary;
  if (!p.shortBreakHeading) p.shortBreakHeading = d.shortBreakHeading;
  if (!p.longBreakSummary) p.longBreakSummary = d.longBreakSummary;
  if (!p.longBreakHeading) p.longBreakHeading = d.longBreakHeading;
  // The four content lists likewise: a preset that only sets timings is a
  // legitimate thing to ask an AI for, and it should inherit the rest rather
  // than render an empty panel.
  for (const key of ["workItems", "microBreakExercises", "shortBreakExercises", "longBreakExercises"]) {
    if (!Array.isArray(p[key])) p[key] = structuredClone(d[key]);
  }

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
  if (p.taskTimerEnabled == null) p.taskTimerEnabled = d.taskTimerEnabled;
  if (p.taskDuration == null) p.taskDuration = d.taskDuration;
  if (p.taskShowNumbers == null) p.taskShowNumbers = d.taskShowNumbers;

  delete p.loopsUntilLong; // superseded by loopsUntilShort × setsUntilLong
  return p;
}

// The evening equivalent. Evening has never changed shape, so this only fills
// gaps left by a hand-written or AI-written preset that omitted the settings.
export function migrateEvening(e) {
  const d = DEFAULT_CONFIG.evening;
  if (!Array.isArray(e.sections)) e.sections = structuredClone(d.sections);
  if (!Array.isArray(e.exercises)) e.exercises = [];
  if (e.switchBuffer == null) e.switchBuffer = d.switchBuffer;
  if (e.transitionTime == null) e.transitionTime = d.transitionTime;
  if (e.muted == null) e.muted = d.muted;
  return e;
}

const MIGRATE = { work: migratePomodoro, evening: migrateEvening };

// ── Presets ──
//
// A preset is one complete routine: everything a mode needs to run, plus an
// id and a name. Work and evening keep entirely separate lists in separate
// localStorage keys, so importing or resetting one can never reach the other.
//
// Presets hold full copies rather than referencing a shared exercise library.
// That keeps an exported preset genuinely self-contained — the file you hand
// to (or get back from) an AI is the whole routine, with nothing to resolve.

export const PRESETS_VERSION = 2;

const LEGACY_KEY  = "alignedflow-config";
const STORE_KEYS  = { work: "alignedflow-work-presets", evening: "alignedflow-evening-presets" };
const SESSION_KEY = "alignedflow-session";

export const KINDS = ["work", "evening"];
export const KIND_LABELS = { work: "work", evening: "evening" };

// The body of a preset is everything except the id/name wrapper, so defaults
// come straight from the shipped config.
const DEFAULT_BODY = { work: () => structuredClone(DEFAULT_CONFIG.pomodoro), evening: () => structuredClone(DEFAULT_CONFIG.evening) };

export function defaultPresetBody(kind) {
  return DEFAULT_BODY[kind]();
}

export function makePresetId() {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

// Names are how presets are told apart in the switcher, so a duplicate name is
// worse than an ugly one — " 2", " 3" … until it is unique.
export function uniquePresetName(name, presets, ignoreId = null) {
  const taken = new Set(presets.filter(p => p.id !== ignoreId).map(p => p.name));
  if (!taken.has(name)) return name;
  let n = 2;
  while (taken.has(`${name} ${n}`)) n++;
  return `${name} ${n}`;
}

function makeStore(kind, body, name = "Default") {
  const preset = { id: makePresetId(), name, ...MIGRATE[kind](body) };
  return { version: PRESETS_VERSION, activeId: preset.id, presets: [preset] };
}

// Guarantees a usable store out of anything: repairs a missing/empty preset
// list and an activeId pointing at a preset that no longer exists, so a
// corrupted key degrades to defaults rather than a blank screen.
function normalizeStore(kind, store) {
  if (!store || typeof store !== "object" || !Array.isArray(store.presets) || !store.presets.length) {
    return makeStore(kind, defaultPresetBody(kind));
  }
  store.version = PRESETS_VERSION;
  store.presets = store.presets.map(p => {
    const preset = { ...p, id: p.id || makePresetId(), name: p.name || "Untitled" };
    return MIGRATE[kind](preset);
  });
  if (!store.presets.some(p => p.id === store.activeId)) store.activeId = store.presets[0].id;
  return store;
}

// ── Persistence ──

// Reads the v1 single-blob config, which held both modes together. Returns the
// requested mode's body, or null if there is nothing to migrate from.
function readLegacyBody(kind) {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1) return null;
    const body = kind === "work" ? parsed.pomodoro : parsed.evening;
    return body && typeof body === "object" ? body : null;
  } catch (e) {
    return null;
  }
}

// The v1 key is deliberately never deleted. It costs a few KB and is the only
// copy of a routine that predates presets, so it stays as a rollback if this
// migration ever turns out to be wrong.
export function loadPresets(kind) {
  try {
    const raw = localStorage.getItem(STORE_KEYS[kind]);
    if (raw) return normalizeStore(kind, JSON.parse(raw));
  } catch (e) {
    // corrupted — fall through to migration/defaults
  }
  const legacy = readLegacyBody(kind);
  if (legacy) return makeStore(kind, legacy);
  return makeStore(kind, defaultPresetBody(kind));
}

export function savePresets(kind, store) {
  try {
    localStorage.setItem(STORE_KEYS[kind], JSON.stringify(store));
  } catch (e) {
    // localStorage full or unavailable — silent fail
  }
}

export function getActivePreset(store) {
  return store.presets.find(p => p.id === store.activeId) || store.presets[0];
}

// ── Store operations ──
//
// Pure store → store transforms, shared by App and both builders so the
// switcher and the builder's preset row can never disagree about what a
// rename or a delete means.

export function selectPreset(store, id) {
  if (!store.presets.some(p => p.id === id) || id === store.activeId) return store;
  return { ...store, activeId: id };
}

export function patchPreset(store, id, patch) {
  return { ...store, presets: store.presets.map(p => (p.id === id ? { ...p, ...patch, id: p.id, name: p.name } : p)) };
}

export function renamePreset(store, id, name) {
  const clean = (name || "").trim() || "Untitled";
  return { ...store, presets: store.presets.map(p => (p.id === id ? { ...p, name: uniquePresetName(clean, store.presets, id) } : p)) };
}

// Imports and new presets always land as additions — nothing an import does
// can overwrite a routine that is already there.
export function addPreset(store, kind, body, name, { activate = true } = {}) {
  const preset = { ...body, id: makePresetId(), name: uniquePresetName((name || "Untitled").trim(), store.presets) };
  const next = { ...store, presets: [...store.presets, preset] };
  if (activate) next.activeId = preset.id;
  return { store: next, preset };
}

export function duplicatePreset(store, id) {
  const src = store.presets.find(p => p.id === id);
  if (!src) return { store, preset: null };
  const { id: _drop, name, ...body } = structuredClone(src);
  return addPreset(store, null, body, `${name} copy`);
}

// The last preset is never deletable — a mode with no routine has nothing to
// render. Deleting the active one falls back to its neighbour.
export function removePreset(store, id) {
  if (store.presets.length <= 1) return store;
  const idx = store.presets.findIndex(p => p.id === id);
  if (idx === -1) return store;
  const presets = store.presets.filter(p => p.id !== id);
  const activeId = store.activeId === id ? presets[Math.min(idx, presets.length - 1)].id : store.activeId;
  return { ...store, presets, activeId };
}

// Pomodoro's in-progress cycle position (phase + block count) — separate from
// the presets above since it's transient session state, not something
// export/import should carry. No versioning needed: it's a flat, disposable
// shape that just falls back to defaults if missing or malformed.
export function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // corrupted — fall back to defaults
  }
  return null;
}

export function saveSession(session) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (e) {
    // localStorage full or unavailable — silent fail
  }
}

// Switching work preset changes the cycle length underneath the diamonds, so
// the stored block count would point at a block that no longer exists — the
// same reason toggling micro breaks resets it. Cleared on switch.
export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (e) {
    // unavailable — nothing to clear
  }
}

// ── Export ──

function download(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const slug = (s) => (s || "preset").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "preset";
const today = () => new Date().toISOString().slice(0, 10);

// One preset, one file. The `kind` tag is what lets the importer refuse an
// evening preset offered to the work builder instead of half-loading it.
export function exportPreset(kind, preset) {
  download({
    app: "alignedflow",
    kind: `${kind}-preset`,
    version: PRESETS_VERSION,
    exportedAt: new Date().toISOString(),
    preset,
  }, `alignedflow-${kind}-${slug(preset.name)}-${today()}.json`);
}

// Everything, both modes — the backup, kept separate from the per-preset
// export above so the two are never confused for each other.
export function exportBackup(stores) {
  download({
    app: "alignedflow",
    kind: "backup",
    version: PRESETS_VERSION,
    exportedAt: new Date().toISOString(),
    work: stores.work,
    evening: stores.evening,
  }, `alignedflow-backup-${today()}.json`);
}

export function presetToJSON(preset) {
  return JSON.stringify({ app: "alignedflow", kind: "preset", version: PRESETS_VERSION, preset }, null, 2);
}

// ── Import ──

// Shape checks are deliberately shallow — enough to tell a work preset from an
// evening one and to catch a truncated paste, with migrate* above filling in
// anything merely absent. The message matters more than the strictness: these
// files are usually AI-written, and "unknown field" is not a debuggable error.
function validateBody(kind, b) {
  if (!b || typeof b !== "object") return "Not a JSON object";
  if (kind === "work") {
    if (!b.durations && !b.phases) return "Doesn't look like a work preset — no durations or phases";
    if (b.workItems && !Array.isArray(b.workItems)) return "workItems must be a list";
    for (const key of ["microBreakExercises", "shortBreakExercises", "longBreakExercises"]) {
      if (b[key] && !Array.isArray(b[key])) return `${key} must be a list`;
    }
  } else {
    if (!Array.isArray(b.exercises)) return "Doesn't look like an evening preset — no exercises list";
    if (!b.exercises.length) return "No exercises in this preset";
    for (const ex of b.exercises) {
      const where = ex && (ex.title || ex.id) ? `"${ex.title || ex.id}"` : "an exercise";
      if (!ex || typeof ex !== "object") return "An exercise is not an object";
      if (!ex.title) return `${where} has no title`;
      if (!ex.section) return `${where} has no section`;
      if (typeof ex.duration !== "number" || ex.duration <= 0) return `${where} has no valid duration (seconds)`;
      if (!Array.isArray(ex.steps)) return `${where} has no steps list`;
    }
  }
  return null;
}

// Evening cards are keyed by exercise id, and a preset written by hand or by
// an AI often repeats or omits them. Renumbering on import is safer than
// trusting them — nothing outside the preset references these.
function renumberEvening(body) {
  body.exercises = body.exercises.map((ex, i) => ({ ...ex, id: i + 1 }));
  return body;
}

// Sections named by an exercise but never declared would render with the
// fallback colour and be invisible in the builder's section list, so they get
// declared on the way in.
function reconcileSections(body) {
  const declared = new Set(body.sections.map(s => s.name));
  const palette = DEFAULT_CONFIG.evening.sections;
  let next = palette.length;
  for (const ex of body.exercises) {
    if (declared.has(ex.section)) continue;
    declared.add(ex.section);
    body.sections.push({ name: ex.section, color: (palette[next++ % palette.length] || palette[0]).color });
  }
  return body;
}

function toPreset(kind, body, name) {
  const migrated = MIGRATE[kind](structuredClone(body));
  if (kind === "evening") reconcileSections(renumberEvening(migrated));
  const { id, name: bodyName, ...rest } = migrated;
  return { id: makePresetId(), name: name || bodyName || "Imported", ...rest };
}

// Accepts, in order of specificity:
//   · a v2 preset file for this mode        → one preset
//   · a v2 backup                           → this mode's presets, appended
//   · a v1 whole-app config                 → this mode's half, as one preset
//   · a bare preset body with no wrapper    → one preset (what an AI tends to
//     emit when asked for "the JSON" without being handed the envelope)
// Never overwrites: everything lands as an addition to the existing list.
export function parseImport(kind, text) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    return { ok: false, error: "Invalid JSON — check for a missing brace or a trailing comma" };
  }
  if (!raw || typeof raw !== "object") return { ok: false, error: "Not a JSON object" };

  const other = kind === "work" ? "evening" : "work";

  // Explicitly tagged as the other mode — the whole point of the kind tag.
  if (raw.kind === `${other}-preset`) {
    return { ok: false, error: `That's an ${KIND_LABELS[other]} preset. Import it from the ${KIND_LABELS[other]} builder.` };
  }

  // A backup carries both modes; take only this one's.
  if (raw.kind === "backup" || (raw.work && raw.evening && Array.isArray(raw.work.presets))) {
    const store = raw[kind];
    if (!store || !Array.isArray(store.presets) || !store.presets.length) {
      return { ok: false, error: `This backup has no ${KIND_LABELS[kind]} presets` };
    }
    const presets = [];
    for (const p of store.presets) {
      const err = validateBody(kind, p);
      if (err) return { ok: false, error: `Preset "${p.name || "?"}": ${err}` };
      presets.push(toPreset(kind, p, p.name));
    }
    return { ok: true, presets };
  }

  // v1 whole-app config — the format the old EXPORT button wrote. Still read
  // so a backup taken before presets existed stays restorable.
  if (raw.version === 1 && raw.pomodoro && raw.evening) {
    const body = kind === "work" ? raw.pomodoro : raw.evening;
    const err = validateBody(kind, body);
    if (err) return { ok: false, error: err };
    return { ok: true, presets: [toPreset(kind, body, "Imported")] };
  }

  // A tagged single preset, or a bare body.
  const body = raw.preset && typeof raw.preset === "object" ? raw.preset : raw;
  const err = validateBody(kind, body);
  if (err) return { ok: false, error: err };
  return { ok: true, presets: [toPreset(kind, body, body.name)] };
}

// Handed to an AI so it writes against the real shape instead of a guess. Built
// from the live defaults rather than a hardcoded string, so it cannot drift out
// of step with what the importer actually accepts.
export function presetSchemaText(kind) {
  const d = defaultPresetBody(kind);
  const note = kind === "work"
    ? `// AlignedFlow work preset. Paste a filled-in version of this into IMPORT.
// durations are MINUTES. loopsUntilShort only applies when microEnabled is true.
// setsUntilLong counts sets per long break; with micro off a set is one focus block.`
    : `// AlignedFlow evening preset. Paste a filled-in version of this into IMPORT.
// duration is SECONDS, and for a bilateral exercise it covers BOTH sides.
// Every exercise's "section" should match one of the section names above it.
// Exercise ids are renumbered on import, so they need not be right.`;
  const example = kind === "work"
    ? { name: "Busy day", phases: d.phases, durations: d.durations, microEnabled: d.microEnabled,
        loopsUntilShort: d.loopsUntilShort, setsUntilLong: d.setsUntilLong,
        taskTimerEnabled: d.taskTimerEnabled, taskDuration: d.taskDuration, taskShowNumbers: d.taskShowNumbers,
        workSummary: d.workSummary, workHeading: d.workHeading, workItems: d.workItems.slice(0, 2),
        microBreakSummary: d.microBreakSummary, microBreakHeading: d.microBreakHeading, microBreakExercises: d.microBreakExercises.slice(0, 1),
        shortBreakSummary: d.shortBreakSummary, shortBreakHeading: d.shortBreakHeading, shortBreakExercises: d.shortBreakExercises.slice(0, 1),
        longBreakSummary: d.longBreakSummary, longBreakHeading: d.longBreakHeading, longBreakExercises: d.longBreakExercises.slice(0, 1) }
    : { name: "Short evening", sections: d.sections, switchBuffer: d.switchBuffer, transitionTime: d.transitionTime,
        exercises: d.exercises.slice(0, 2) };
  return `${note}\n\n${JSON.stringify(example, null, 2)}`;
}

// ── Utilities ──

export function nextId(existingIds) {
  const nums = existingIds.map(Number).filter((n) => !isNaN(n));
  return nums.length ? Math.max(...nums) + 1 : 1;
}
