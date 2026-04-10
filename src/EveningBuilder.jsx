import { useState, useEffect, useRef } from "react";
import { computeSectionColors, exportConfig, validateAndParseConfig, nextId, DEFAULT_CONFIG } from "./dataStore";

const FONT = "'DM Mono', monospace";
const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, color: "#f0ece4", fontFamily: FONT, fontSize: "0.78rem", padding: "0.4rem 0.6rem", width: "100%", outline: "none" };
const btnSmall = { border: "1px solid rgba(255,255,255,0.15)", background: "transparent", borderRadius: 6, color: "rgba(255,255,255,0.5)", fontFamily: FONT, fontSize: "0.6rem", letterSpacing: "0.08em", cursor: "pointer", padding: "0.3rem 0.55rem" };
const btnDanger = { ...btnSmall, borderColor: "rgba(200,80,80,0.4)", color: "#c85050" };

export default function EveningBuilder({ config, setConfig, onBack }) {
  const [evening, setEvening] = useState(config.evening);
  const [expandedCard, setExpandedCard] = useState(null);
  const [showSections, setShowSections] = useState(false);
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
    const defaults = DEFAULT_CONFIG.evening;
    const messages = {
      sections: "Reset all section colors & names to defaults?",
      exercises: "Reset all exercises to defaults?",
      settings: "Reset settings (switch-sides time, transition time) to defaults?",
      everything: "Reset ENTIRE evening config to defaults?",
    };
    if (!window.confirm(messages[scope])) return;
    setShowResetMenu(false);
    setExpandedCard(null);
    if (scope === "sections") {
      setEvening(prev => ({ ...prev, sections: structuredClone(defaults.sections) }));
    } else if (scope === "exercises") {
      setEvening(prev => ({ ...prev, exercises: structuredClone(defaults.exercises) }));
    } else if (scope === "settings") {
      setEvening(prev => ({ ...prev, switchBuffer: defaults.switchBuffer, transitionTime: defaults.transitionTime, muted: defaults.muted ?? false }));
    } else if (scope === "everything") {
      setEvening(structuredClone(defaults));
    }
  };

  // Auto-save
  useEffect(() => {
    const t = setTimeout(() => setConfig(prev => ({ ...prev, evening })), 300);
    return () => clearTimeout(t);
  }, [evening]);

  const updateExercise = (id, patch) => {
    setEvening(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex => ex.id === id ? { ...ex, ...patch } : ex),
    }));
  };

  const moveExercise = (fromIndex, dir) => {
    const to = fromIndex + dir;
    if (to < 0 || to >= evening.exercises.length) return;
    const next = [...evening.exercises];
    [next[fromIndex], next[to]] = [next[to], next[fromIndex]];
    setEvening(prev => ({ ...prev, exercises: next }));
  };

  const addExercise = () => {
    const id = nextId(evening.exercises.map(e => e.id));
    const section = evening.sections[0]?.name || "Standing";
    const newEx = { id, section, title: "New Exercise", timing: "60 sec", duration: 60, steps: ["Step 1"] };
    setEvening(prev => ({ ...prev, exercises: [...prev.exercises, newEx] }));
    setExpandedCard(id);
  };

  const deleteExercise = (id) => {
    setEvening(prev => ({ ...prev, exercises: prev.exercises.filter(ex => ex.id !== id) }));
    if (expandedCard === id) setExpandedCard(null);
  };

  const updateSection = (idx, patch) => {
    setEvening(prev => {
      const sections = prev.sections.map((s, i) => i === idx ? { ...s, ...patch } : s);
      let exercises = prev.exercises;
      if (patch.name && prev.sections[idx].name !== patch.name) {
        const oldName = prev.sections[idx].name;
        exercises = exercises.map(ex => ex.section === oldName ? { ...ex, section: patch.name } : ex);
      }
      return { ...prev, sections, exercises };
    });
  };

  const addSection = () => {
    setEvening(prev => ({ ...prev, sections: [...prev.sections, { name: "New Section", color: "#888888" }] }));
  };

  const deleteSection = (idx) => {
    const name = evening.sections[idx].name;
    const usedBy = evening.exercises.filter(ex => ex.section === name).length;
    if (usedBy > 0) return; // blocked
    setEvening(prev => ({ ...prev, sections: prev.sections.filter((_, i) => i !== idx) }));
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
        setEvening(result.config.evening);
      } else {
        setImportError(result.error);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const updateStep = (exId, stepIdx, value) => {
    setEvening(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex => {
        if (ex.id !== exId) return ex;
        const steps = [...ex.steps];
        steps[stepIdx] = value;
        return { ...ex, steps };
      }),
    }));
  };

  const addStep = (exId) => {
    setEvening(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex =>
        ex.id === exId ? { ...ex, steps: [...ex.steps, "New step"] } : ex
      ),
    }));
  };

  const deleteStep = (exId, stepIdx) => {
    setEvening(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex => {
        if (ex.id !== exId) return ex;
        return { ...ex, steps: ex.steps.filter((_, i) => i !== stepIdx) };
      }),
    }));
  };

  const moveStep = (exId, stepIdx, dir) => {
    setEvening(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex => {
        if (ex.id !== exId) return ex;
        const to = stepIdx + dir;
        if (to < 0 || to >= ex.steps.length) return ex;
        const steps = [...ex.steps];
        [steps[stepIdx], steps[to]] = [steps[to], steps[stepIdx]];
        return { ...ex, steps };
      }),
    }));
  };

  return (
    <div style={{ position: "relative", height: "100%", background: "#0f0e0c", overflow: "auto", fontFamily: FONT, color: "#f0ece4", WebkitOverflowScrolling: "touch" }}>
      <input ref={fileRef} type="file" accept=".json" onChange={handleImport} style={{ display: "none" }} />

      {/* Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(15,14,12,0.95)", backdropFilter: "blur(8px)", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "0.7rem 1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
          <button onClick={onBack} style={{ ...btnSmall, fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}>‹</button>
          <span style={{ fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>Evening Builder</span>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <div ref={resetRef} style={{ position: "relative" }}>
            <button onClick={() => setShowResetMenu(s => !s)} style={btnSmall}>RESET</button>
            {showResetMenu && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 30, background: "rgba(15,14,12,0.97)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, padding: "0.3rem 0", minWidth: 200, backdropFilter: "blur(8px)", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
                {[
                  { scope: "sections", label: "Sections (colors & names)" },
                  { scope: "exercises", label: "Exercises" },
                  { scope: "settings", label: "Settings" },
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

      <div style={{ padding: "1rem", maxWidth: 600, margin: "0 auto" }}>

        {/* Sections */}
        <div style={{ marginBottom: "1.2rem" }}>
          <button onClick={() => setShowSections(s => !s)} style={{ ...btnSmall, width: "100%", display: "flex", justifyContent: "space-between", padding: "0.5rem 0.7rem", marginBottom: showSections ? "0.6rem" : 0 }}>
            <span>SECTIONS ({evening.sections.length})</span>
            <span>{showSections ? "▾" : "▸"}</span>
          </button>
          {showSections && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
              {evening.sections.map((sec, i) => {
                const usedBy = evening.exercises.filter(ex => ex.section === sec.name).length;
                return (
                  <div key={i} style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                    <div style={{ width: 14, height: 14, borderRadius: 3, background: sec.color, flexShrink: 0 }} />
                    <input value={sec.name} onChange={e => updateSection(i, { name: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
                    <input value={sec.color} onChange={e => updateSection(i, { color: e.target.value })} style={{ ...inputStyle, width: 80 }} />
                    <button onClick={() => deleteSection(i)} disabled={usedBy > 0} title={usedBy > 0 ? `Used by ${usedBy} exercise(s)` : "Delete"} style={{ ...btnDanger, opacity: usedBy > 0 ? 0.3 : 1, cursor: usedBy > 0 ? "default" : "pointer", padding: "0.25rem 0.4rem" }}>✕</button>
                  </div>
                );
              })}
              <button onClick={addSection} style={{ ...btnSmall, alignSelf: "flex-start", marginTop: "0.2rem" }}>+ ADD SECTION</button>
            </div>
          )}
        </div>

        {/* Global Settings */}
        <div style={{ marginBottom: "1.2rem", display: "flex", gap: "1.2rem", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: "0.58rem", letterSpacing: "0.12em", color: "#555", marginBottom: "0.3rem" }}>SWITCH-SIDES TIME</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="range" min={4} max={15} step={1} value={evening.switchBuffer} onChange={e => setEvening(prev => ({ ...prev, switchBuffer: Number(e.target.value) }))} style={{ flex: 1, accentColor: evening.sections[0]?.color || "#c4956a" }} />
              <span style={{ fontSize: "0.7rem", color: evening.sections[0]?.color || "#c4956a", minWidth: 24 }}>{evening.switchBuffer}s</span>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: "0.58rem", letterSpacing: "0.12em", color: "#555", marginBottom: "0.3rem" }}>TRANSITION TIME</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="range" min={5} max={20} step={1} value={evening.transitionTime} onChange={e => setEvening(prev => ({ ...prev, transitionTime: Number(e.target.value) }))} style={{ flex: 1, accentColor: evening.sections[0]?.color || "#c4956a" }} />
              <span style={{ fontSize: "0.7rem", color: evening.sections[0]?.color || "#c4956a", minWidth: 24 }}>{evening.transitionTime}s</span>
            </div>
          </div>
        </div>

        {/* Card List */}
        <div style={{ fontSize: "0.58rem", letterSpacing: "0.12em", color: "#555", marginBottom: "0.5rem" }}>EXERCISES ({evening.exercises.length})</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          {evening.exercises.map((ex, i) => {
            const colors = computeSectionColors((evening.sections.find(s => s.name === ex.section) || { color: "#888" }).color);
            const isExpanded = expandedCard === ex.id;
            return (
              <div key={ex.id} style={{ border: `1px solid ${isExpanded ? colors.color + "44" : "rgba(255,255,255,0.08)"}`, borderRadius: 8, overflow: "hidden", background: isExpanded ? "rgba(255,255,255,0.02)" : "transparent" }}>
                {/* Collapsed row */}
                <div onClick={() => setExpandedCard(isExpanded ? null : ex.id)} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.65rem", cursor: "pointer" }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: colors.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: "0.76rem", color: "#f0ece4", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ex.title}</span>
                  {ex.bilateral && <span style={{ fontSize: "0.52rem", letterSpacing: "0.08em", color: colors.color, border: `1px solid ${colors.color}44`, borderRadius: 3, padding: "0.08rem 0.3rem" }}>B</span>}
                  <span style={{ fontSize: "0.6rem", color: "#555", whiteSpace: "nowrap" }}>{ex.duration}s</span>
                  <div style={{ display: "flex", gap: 2 }}>
                    <button onClick={e => { e.stopPropagation(); moveExercise(i, -1); }} disabled={i === 0} style={{ ...btnSmall, padding: "0.15rem 0.3rem", fontSize: "0.7rem", opacity: i === 0 ? 0.2 : 1 }}>↑</button>
                    <button onClick={e => { e.stopPropagation(); moveExercise(i, 1); }} disabled={i === evening.exercises.length - 1} style={{ ...btnSmall, padding: "0.15rem 0.3rem", fontSize: "0.7rem", opacity: i === evening.exercises.length - 1 ? 0.2 : 1 }}>↓</button>
                  </div>
                  <span style={{ fontSize: "0.7rem", color: "#555", transform: isExpanded ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>▸</span>
                </div>

                {/* Expanded editor */}
                {isExpanded && (
                  <CardEditor
                    ex={ex}
                    sections={evening.sections}
                    onUpdate={patch => updateExercise(ex.id, patch)}
                    onDelete={() => deleteExercise(ex.id)}
                    onUpdateStep={(si, val) => updateStep(ex.id, si, val)}
                    onAddStep={() => addStep(ex.id)}
                    onDeleteStep={si => deleteStep(ex.id, si)}
                    onMoveStep={(si, dir) => moveStep(ex.id, si, dir)}
                  />
                )}
              </div>
            );
          })}
        </div>

        <button onClick={addExercise} style={{ ...btnSmall, width: "100%", marginTop: "0.6rem", padding: "0.55rem 0", textAlign: "center" }}>+ ADD EXERCISE</button>

        <div style={{ height: 80 }} />{/* bottom spacer */}
      </div>
    </div>
  );
}

function CardEditor({ ex, sections, onUpdate, onDelete, onUpdateStep, onAddStep, onDeleteStep, onMoveStep }) {
  const scrollRef = useRef(null);

  return (
    <div ref={scrollRef} style={{ padding: "0.5rem 0.65rem 0.75rem", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <div>
        <label style={labelStyle}>Title</label>
        <input value={ex.title} onChange={e => onUpdate({ title: e.target.value })} style={inputStyle} />
      </div>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Duration (sec)</label>
          <DurationInput value={ex.duration} onChange={val => onUpdate({ duration: val })} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Timing text</label>
          <input value={ex.timing || ""} onChange={e => onUpdate({ timing: e.target.value })} style={inputStyle} />
        </div>
      </div>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Section</label>
          <select value={ex.section} onChange={e => onUpdate({ section: e.target.value })} style={{ ...inputStyle, appearance: "auto", colorScheme: "dark" }}>
            {sections.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
          </select>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", padding: "0.4rem 0" }}>
          <input type="checkbox" checked={!!ex.bilateral} onChange={e => onUpdate({ bilateral: e.target.checked })} />
          <span style={{ fontSize: "0.68rem", color: "#999" }}>Bilateral</span>
        </label>
      </div>

      {/* Steps */}
      <div>
        <label style={labelStyle}>Steps</label>
        {ex.steps.map((step, si) => (
          <div key={si} style={{ display: "flex", gap: "0.3rem", alignItems: "center", marginBottom: "0.3rem" }}>
            <span style={{ fontSize: "0.6rem", color: "#444", minWidth: 16, textAlign: "right" }}>{si + 1}</span>
            <input value={step} onChange={e => onUpdateStep(si, e.target.value)} onFocus={e => e.target.scrollIntoView({ behavior: "smooth", block: "nearest" })} style={{ ...inputStyle, flex: 1 }} />
            <button onClick={() => onMoveStep(si, -1)} disabled={si === 0} style={{ ...btnSmall, padding: "0.15rem 0.25rem", fontSize: "0.6rem", opacity: si === 0 ? 0.2 : 1 }}>↑</button>
            <button onClick={() => onMoveStep(si, 1)} disabled={si === ex.steps.length - 1} style={{ ...btnSmall, padding: "0.15rem 0.25rem", fontSize: "0.6rem", opacity: si === ex.steps.length - 1 ? 0.2 : 1 }}>↓</button>
            <button onClick={() => onDeleteStep(si)} style={{ ...btnDanger, padding: "0.15rem 0.25rem", fontSize: "0.6rem" }}>✕</button>
          </div>
        ))}
        <button onClick={onAddStep} style={{ ...btnSmall, marginTop: "0.15rem" }}>+ STEP</button>
      </div>

      <button onClick={onDelete} style={{ ...btnDanger, alignSelf: "flex-start", marginTop: "0.3rem" }}>DELETE EXERCISE</button>
    </div>
  );
}

function DurationInput({ value, onChange }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => { setDraft(String(value)); }, [value]);
  return (
    <input
      type="text"
      inputMode="numeric"
      value={draft}
      onChange={e => setDraft(e.target.value.replace(/[^0-9]/g, ""))}
      onBlur={() => { const n = Math.max(1, Number(draft) || 1); setDraft(String(n)); onChange(n); }}
      style={inputStyle}
    />
  );
}

const labelStyle = { display: "block", fontSize: "0.55rem", letterSpacing: "0.1em", color: "#555", marginBottom: "0.2rem", textTransform: "uppercase" };
