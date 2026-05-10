import { useState, useEffect, useRef } from "react";
import { exportConfig, validateAndParseConfig, DEFAULT_CONFIG } from "./dataStore";

const FONT = "'DM Mono', monospace";
const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, color: "#f0ece4", fontFamily: FONT, fontSize: "0.78rem", padding: "0.4rem 0.6rem", width: "100%", outline: "none" };
const btnSmall = { border: "1px solid rgba(255,255,255,0.15)", background: "transparent", borderRadius: 6, color: "rgba(255,255,255,0.5)", fontFamily: FONT, fontSize: "0.6rem", letterSpacing: "0.08em", cursor: "pointer", padding: "0.3rem 0.55rem" };
const btnDanger = { ...btnSmall, borderColor: "rgba(200,80,80,0.4)", color: "#c85050" };
const labelStyle = { display: "block", fontSize: "0.55rem", letterSpacing: "0.1em", color: "#555", marginBottom: "0.2rem", textTransform: "uppercase" };

const PHASE_IDS = ["work", "short", "long"];
const PHASE_LABELS = { work: "Work", short: "Short Break", long: "Long Break" };

export default function PomodoroBuilder({ config, setConfig, onBack }) {
  const [pomo, setPomo] = useState(() => ({
    ...config.pomodoro,
    phases: config.pomodoro.phases || structuredClone(DEFAULT_CONFIG.pomodoro.phases),
  }));
  const [tab, setTab] = useState("work");
  const [expandedItem, setExpandedItem] = useState(null);
  const [importError, setImportError] = useState(null);
  const [showResetMenu, setShowResetMenu] = useState(false);
  const fileRef = useRef(null);
  const resetRef = useRef(null);

  useEffect(() => {
    if (!showResetMenu) return;
    const handler = (e) => {
      if (resetRef.current && !resetRef.current.contains(e.target)) setShowResetMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showResetMenu]);

  const handleReset = (scope) => {
    const defaults = DEFAULT_CONFIG.pomodoro;
    const messages = {
      phases: "Reset phase colors & names to defaults?",
      workItems: "Reset work checklist to defaults?",
      shortBreakExercises: "Reset short break exercises to defaults?",
      longBreakExercises: "Reset long break exercises to defaults?",
      settings: "Reset timer durations, loops, and muted to defaults?",
      everything: "Reset ENTIRE pomodoro config to defaults?",
    };
    if (!window.confirm(messages[scope])) return;
    setShowResetMenu(false);
    setExpandedItem(null);
    if (scope === "everything") {
      setPomo(structuredClone(defaults));
    } else if (scope === "settings") {
      setPomo(prev => ({ ...prev, durations: structuredClone(defaults.durations), loopsUntilLong: defaults.loopsUntilLong, muted: defaults.muted ?? false }));
    } else if (scope === "shortBreakExercises") {
      setPomo(prev => ({ ...prev, shortBreakExercises: structuredClone(defaults.shortBreakExercises), shortBreakSummary: defaults.shortBreakSummary }));
    } else if (scope === "longBreakExercises") {
      setPomo(prev => ({ ...prev, longBreakExercises: structuredClone(defaults.longBreakExercises), longBreakSummary: defaults.longBreakSummary }));
    } else {
      setPomo(prev => ({ ...prev, [scope]: structuredClone(defaults[scope]) }));
    }
  };

  // Auto-save
  useEffect(() => {
    const t = setTimeout(() => setConfig(prev => ({ ...prev, pomodoro: pomo })), 300);
    return () => clearTimeout(t);
  }, [pomo]);

  const phases = pomo.phases;
  const tabs = PHASE_IDS.map(id => ({ id, label: phases[id].tag || PHASE_LABELS[id], color: phases[id].color }));

  const updatePhase = (id, patch) => {
    setPomo(prev => ({
      ...prev,
      phases: { ...prev.phases, [id]: { ...prev.phases[id], ...patch } },
    }));
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = validateAndParseConfig(ev.target.result);
      if (result.ok) {
        setConfig(result.config);
        setPomo(result.config.pomodoro);
      } else {
        setImportError(result.error);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const activeTab = tabs.find(t => t.id === tab);

  return (
    <div style={{ position: "relative", height: "100%", background: "#0f0e0c", overflow: "auto", fontFamily: FONT, color: "#f0ece4", WebkitOverflowScrolling: "touch" }}>
      <input ref={fileRef} type="file" accept=".json" onChange={handleImport} style={{ display: "none" }} />

      {/* Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(15,14,12,0.95)", backdropFilter: "blur(8px)", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "0.7rem 1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
          <button onClick={onBack} style={{ ...btnSmall, fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}>‹</button>
          <span style={{ fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>Work Builder</span>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <div ref={resetRef} style={{ position: "relative" }}>
            <button onClick={() => setShowResetMenu(s => !s)} style={btnSmall}>RESET</button>
            {showResetMenu && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 30, background: "rgba(15,14,12,0.97)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, padding: "0.3rem 0", minWidth: 210, backdropFilter: "blur(8px)", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
                {[
                  { scope: "phases", label: "Phase appearance" },
                  { scope: "workItems", label: "Work checklist" },
                  { scope: "shortBreakExercises", label: "Short break exercises" },
                  { scope: "longBreakExercises", label: "Long break exercises" },
                  { scope: "settings", label: "Timer settings" },
                  { scope: "everything", label: "Reset everything" },
                ].map(opt => (
                  <button key={opt.scope} onClick={() => handleReset(opt.scope)} style={{ display: "block", width: "100%", textAlign: "left", padding: "0.45rem 0.75rem", border: "none", background: "transparent", cursor: "pointer", fontFamily: FONT, fontSize: "0.62rem", letterSpacing: "0.06em", color: opt.scope === "everything" ? "#c85050" : "rgba(255,255,255,0.6)" }}
                    onMouseEnter={e => e.target.style.background = "rgba(255,255,255,0.06)"}
                    onMouseLeave={e => e.target.style.background = "transparent"}
                  >{opt.label}</button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => exportConfig(config)} style={btnSmall}>EXPORT</button>
          <button onClick={() => fileRef.current?.click()} style={btnSmall}>IMPORT</button>
        </div>
      </div>
      {importError && (
        <div style={{ padding: "0.5rem 1rem", background: "rgba(200,80,80,0.12)", color: "#c85050", fontSize: "0.7rem" }}>
          Import failed: {importError}
        </div>
      )}

      {/* Tab bar */}
      <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setExpandedItem(null); }} style={{
            flex: 1, padding: "0.55rem 0.5rem", border: "none", background: "transparent", cursor: tab === t.id ? "default" : "pointer",
            fontFamily: FONT, fontSize: "0.55rem", letterSpacing: "0.1em",
            color: tab === t.id ? t.color : "rgba(255,255,255,0.25)",
            borderBottom: tab === t.id ? `2px solid ${t.color}` : "2px solid transparent",
            transition: "color 0.15s",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "1rem", maxWidth: 600, margin: "0 auto" }}>
        {/* Phase appearance editor */}
        <div style={{ marginBottom: "1.2rem" }}>
          <div style={{ fontSize: "0.58rem", letterSpacing: "0.12em", color: "#555", marginBottom: "0.5rem" }}>PHASE APPEARANCE</div>
          {PHASE_IDS.map(id => {
            const ph = phases[id];
            return (
              <div key={id} style={{ display: "flex", gap: "0.45rem", alignItems: "center", marginBottom: "0.4rem" }}>
                <div style={{ width: 16, height: 16, borderRadius: 3, background: ph.color, flexShrink: 0, border: "1px solid rgba(255,255,255,0.1)" }} />
                <div style={{ flex: "0 0 76px" }}>
                  <input value={ph.color} onChange={e => updatePhase(id, { color: e.target.value })} style={{ ...inputStyle, fontSize: "0.68rem", padding: "0.35rem 0.45rem" }} placeholder="#hex" />
                </div>
                <div style={{ flex: "0 0 110px" }}>
                  <input value={ph.tag} onChange={e => updatePhase(id, { tag: e.target.value })} style={{ ...inputStyle, fontSize: "0.68rem", padding: "0.35rem 0.45rem" }} placeholder="Display name" />
                </div>
                <div style={{ flex: 1 }}>
                  <input value={ph.label} onChange={e => updatePhase(id, { label: e.target.value })} style={{ ...inputStyle, fontSize: "0.68rem", padding: "0.35rem 0.45rem" }} placeholder="Full label" />
                </div>
              </div>
            );
          })}
          <div style={{ fontSize: "0.5rem", color: "#444", marginTop: "0.25rem" }}>Color (hex) · Display name · Full label</div>
        </div>

        {tab === "work" && (
          <WorkEditor items={pomo.workItems} color={activeTab.color} expanded={expandedItem} setExpanded={setExpandedItem}
            onChange={items => setPomo(prev => ({ ...prev, workItems: items }))} />
        )}
        {tab === "short" && (
          <>
            <div style={{ marginBottom: "1rem" }}>
              <label style={labelStyle}>Summary line (shown above exercises)</label>
              <input value={pomo.shortBreakSummary || ""} onChange={e => setPomo(prev => ({ ...prev, shortBreakSummary: e.target.value }))} style={inputStyle} placeholder="e.g. 3 exercises · under 60 seconds" />
            </div>
            <ExerciseListEditor exercises={pomo.shortBreakExercises} color={activeTab.color} expanded={expandedItem} setExpanded={setExpandedItem}
              onChange={exercises => setPomo(prev => ({ ...prev, shortBreakExercises: exercises }))} hasSubtitle={false} hasNote={false} />
          </>
        )}
        {tab === "long" && (
          <>
            <div style={{ marginBottom: "1rem" }}>
              <label style={labelStyle}>Summary line (shown above exercises)</label>
              <input value={pomo.longBreakSummary || ""} onChange={e => setPomo(prev => ({ ...prev, longBreakSummary: e.target.value }))} style={inputStyle} placeholder="e.g. 2 exercises · 7 minutes total" />
            </div>
            <ExerciseListEditor exercises={pomo.longBreakExercises} color={activeTab.color} expanded={expandedItem} setExpanded={setExpandedItem}
              onChange={exercises => setPomo(prev => ({ ...prev, longBreakExercises: exercises }))} hasSubtitle hasNote />
          </>
        )}
        <div style={{ height: 80 }} />
      </div>
    </div>
  );
}

// ── Work Items Editor ──

function WorkEditor({ items, color, expanded, setExpanded, onChange }) {
  const move = (i, dir) => {
    const to = i + dir;
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    [next[i], next[to]] = [next[to], next[i]];
    onChange(next);
  };

  const update = (i, patch) => {
    onChange(items.map((item, idx) => idx === i ? { ...item, ...patch } : item));
  };

  const add = () => {
    const ids = items.map(it => it.id);
    let id = "g";
    while (ids.includes(id)) id = String.fromCharCode(id.charCodeAt(0) + 1);
    onChange([...items, { id, primary: "New item" }]);
    setExpanded(items.length);
  };

  const del = (i) => {
    onChange(items.filter((_, idx) => idx !== i));
    if (expanded === i) setExpanded(null);
  };

  return (
    <div>
      <div style={{ fontSize: "0.58rem", letterSpacing: "0.12em", color: "#555", marginBottom: "0.5rem" }}>POSTURE CHECKLIST ({items.length})</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
        {items.map((item, i) => (
          <div key={i} style={{ border: `1px solid ${expanded === i ? color + "44" : "rgba(255,255,255,0.08)"}`, borderRadius: 8, overflow: "hidden", background: expanded === i ? "rgba(255,255,255,0.02)" : "transparent" }}>
            <div onClick={() => setExpanded(expanded === i ? null : i)} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.65rem", cursor: "pointer" }}>
              <div style={{ width: 8, height: 8, background: `${color}55`, transform: "rotate(45deg)", flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: "0.76rem", color: "#f0ece4", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.primary}</span>
              <div style={{ display: "flex", gap: 2 }}>
                <button onClick={e => { e.stopPropagation(); move(i, -1); }} disabled={i === 0} style={{ ...btnSmall, padding: "0.35rem 0.5rem", fontSize: "0.85rem", opacity: i === 0 ? 0.2 : 1 }}>↑</button>
                <button onClick={e => { e.stopPropagation(); move(i, 1); }} disabled={i === items.length - 1} style={{ ...btnSmall, padding: "0.35rem 0.5rem", fontSize: "0.85rem", opacity: i === items.length - 1 ? 0.2 : 1 }}>↓</button>
              </div>
              <span style={{ fontSize: "0.7rem", color: "#555", transform: expanded === i ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>▸</span>
            </div>
            {expanded === i && (
              <div style={{ padding: "0.5rem 0.65rem 0.75rem", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div>
                  <label style={labelStyle}>Primary text</label>
                  <input value={item.primary} onChange={e => update(i, { primary: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Note (optional)</label>
                  <input value={item.note || ""} onChange={e => update(i, { note: e.target.value || undefined })} style={inputStyle} placeholder="Optional secondary note" />
                </div>
                <button onClick={() => del(i)} style={{ ...btnDanger, alignSelf: "flex-start" }}>DELETE ITEM</button>
              </div>
            )}
          </div>
        ))}
      </div>
      <button onClick={add} style={{ ...btnSmall, width: "100%", marginTop: "0.6rem", padding: "0.55rem 0", textAlign: "center" }}>+ ADD ITEM</button>
    </div>
  );
}

// ── Exercise List Editor (Short Break / Long Break) ──

function ExerciseListEditor({ exercises, color, expanded, setExpanded, onChange, hasSubtitle, hasNote }) {
  const move = (i, dir) => {
    const to = i + dir;
    if (to < 0 || to >= exercises.length) return;
    const next = [...exercises];
    [next[i], next[to]] = [next[to], next[i]];
    onChange(next);
  };

  const update = (i, patch) => {
    onChange(exercises.map((ex, idx) => idx === i ? { ...ex, ...patch } : ex));
  };

  const add = () => {
    const newEx = { label: "New", title: "New exercise", time: "30 sec", steps: ["Step 1"] };
    if (hasSubtitle) newEx.subtitle = "";
    if (hasNote) newEx.note = "";
    onChange([...exercises, newEx]);
    setExpanded(exercises.length);
  };

  const del = (i) => {
    onChange(exercises.filter((_, idx) => idx !== i));
    if (expanded === i) setExpanded(null);
  };

  const updateStep = (exIdx, stepIdx, value) => {
    onChange(exercises.map((ex, i) => {
      if (i !== exIdx) return ex;
      const steps = [...ex.steps];
      steps[stepIdx] = value;
      return { ...ex, steps };
    }));
  };

  const addStep = (exIdx) => {
    onChange(exercises.map((ex, i) =>
      i === exIdx ? { ...ex, steps: [...ex.steps, "New step"] } : ex
    ));
  };

  const deleteStep = (exIdx, stepIdx) => {
    onChange(exercises.map((ex, i) => {
      if (i !== exIdx) return ex;
      return { ...ex, steps: ex.steps.filter((_, si) => si !== stepIdx) };
    }));
  };

  const moveStep = (exIdx, stepIdx, dir) => {
    onChange(exercises.map((ex, i) => {
      if (i !== exIdx) return ex;
      const to = stepIdx + dir;
      if (to < 0 || to >= ex.steps.length) return ex;
      const steps = [...ex.steps];
      [steps[stepIdx], steps[to]] = [steps[to], steps[stepIdx]];
      return { ...ex, steps };
    }));
  };

  return (
    <div>
      <div style={{ fontSize: "0.58rem", letterSpacing: "0.12em", color: "#555", marginBottom: "0.5rem" }}>EXERCISES ({exercises.length})</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
        {exercises.map((ex, i) => (
          <div key={i} style={{ border: `1px solid ${expanded === i ? color + "44" : "rgba(255,255,255,0.08)"}`, borderRadius: 8, overflow: "hidden", background: expanded === i ? "rgba(255,255,255,0.02)" : "transparent" }}>
            <div onClick={() => setExpanded(expanded === i ? null : i)} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.65rem", cursor: "pointer" }}>
              <span style={{ fontSize: "0.58rem", color, border: `1px solid ${color}44`, borderRadius: 3, padding: "0.08rem 0.3rem", flexShrink: 0 }}>{ex.label}</span>
              <span style={{ flex: 1, fontSize: "0.76rem", color: "#f0ece4", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ex.title}</span>
              <span style={{ fontSize: "0.6rem", color: "#555", whiteSpace: "nowrap" }}>{ex.time}</span>
              <div style={{ display: "flex", gap: 2 }}>
                <button onClick={e => { e.stopPropagation(); move(i, -1); }} disabled={i === 0} style={{ ...btnSmall, padding: "0.35rem 0.5rem", fontSize: "0.85rem", opacity: i === 0 ? 0.2 : 1 }}>↑</button>
                <button onClick={e => { e.stopPropagation(); move(i, 1); }} disabled={i === exercises.length - 1} style={{ ...btnSmall, padding: "0.35rem 0.5rem", fontSize: "0.85rem", opacity: i === exercises.length - 1 ? 0.2 : 1 }}>↓</button>
              </div>
              <span style={{ fontSize: "0.7rem", color: "#555", transform: expanded === i ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>▸</span>
            </div>
            {expanded === i && (
              <div style={{ padding: "0.5rem 0.65rem 0.75rem", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <div style={{ flex: "0 0 80px" }}>
                    <label style={labelStyle}>Label</label>
                    <input value={ex.label} onChange={e => update(i, { label: e.target.value })} style={inputStyle} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Title</label>
                    <input value={ex.title} onChange={e => update(i, { title: e.target.value })} style={inputStyle} />
                  </div>
                  <div style={{ flex: "0 0 90px" }}>
                    <label style={labelStyle}>Time</label>
                    <input value={ex.time} onChange={e => update(i, { time: e.target.value })} style={inputStyle} />
                  </div>
                </div>
                {hasSubtitle && (
                  <div>
                    <label style={labelStyle}>Subtitle</label>
                    <input value={ex.subtitle || ""} onChange={e => update(i, { subtitle: e.target.value })} style={inputStyle} />
                  </div>
                )}
                {hasNote && (
                  <div>
                    <label style={labelStyle}>Note (caution text)</label>
                    <input value={ex.note || ""} onChange={e => update(i, { note: e.target.value })} style={inputStyle} />
                  </div>
                )}
                {/* Steps */}
                <div>
                  <label style={labelStyle}>Steps</label>
                  {ex.steps.map((step, si) => (
                    <div key={si} style={{ display: "flex", gap: "0.3rem", alignItems: "center", marginBottom: "0.3rem" }}>
                      <span style={{ fontSize: "0.6rem", color: "#444", minWidth: 16, textAlign: "right" }}>{si + 1}</span>
                      <input value={step} onChange={e => updateStep(i, si, e.target.value)} onFocus={e => e.target.scrollIntoView({ behavior: "smooth", block: "nearest" })} style={{ ...inputStyle, flex: 1 }} />
                      <button onClick={() => moveStep(i, si, -1)} disabled={si === 0} style={{ ...btnSmall, padding: "0.3rem 0.4rem", fontSize: "0.75rem", opacity: si === 0 ? 0.2 : 1 }}>↑</button>
                      <button onClick={() => moveStep(i, si, 1)} disabled={si === ex.steps.length - 1} style={{ ...btnSmall, padding: "0.3rem 0.4rem", fontSize: "0.75rem", opacity: si === ex.steps.length - 1 ? 0.2 : 1 }}>↓</button>
                      <button onClick={() => deleteStep(i, si)} style={{ ...btnDanger, padding: "0.3rem 0.4rem", fontSize: "0.75rem" }}>✕</button>
                    </div>
                  ))}
                  <button onClick={() => addStep(i)} style={{ ...btnSmall, marginTop: "0.15rem" }}>+ STEP</button>
                </div>
                <button onClick={() => del(i)} style={{ ...btnDanger, alignSelf: "flex-start", marginTop: "0.3rem" }}>DELETE EXERCISE</button>
              </div>
            )}
          </div>
        ))}
      </div>
      <button onClick={add} style={{ ...btnSmall, width: "100%", marginTop: "0.6rem", padding: "0.55rem 0", textAlign: "center" }}>+ ADD EXERCISE</button>
    </div>
  );
}
