import { useState, useEffect, useRef } from "react";
import {
  addPreset, duplicatePreset, removePreset, renamePreset, selectPreset,
  getActivePreset, defaultPresetBody, exportPreset, exportBackup,
  parseImport, presetSchemaText, loadPresets, clearSession,
} from "./dataStore";

const FONT = "'DM Mono', monospace";
const btnSmall = { border: "1px solid rgba(255,255,255,0.15)", background: "transparent", borderRadius: 6, color: "rgba(255,255,255,0.5)", fontFamily: FONT, fontSize: "0.6rem", letterSpacing: "0.08em", cursor: "pointer", padding: "0.3rem 0.55rem" };

const ACCENT = { work: "#4A90D9", evening: "#b06878" };

// The preset row that sits at the top of both builders: which routine you are
// editing, and everything that acts on the routine as a whole. Editing its
// contents is the rest of the builder below.
//
// Switching here changes the store's activeId, which App uses as the builder's
// key — so the builder remounts and its draft reloads from the preset just
// picked. Nothing below needs to know a switch happened.
export default function PresetBar({ kind, store, setStore }) {
  const [showList, setShowList] = useState(false);
  const [showIO, setShowIO] = useState(false);
  const [paste, setPaste] = useState("");
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const listRef = useRef(null);
  const fileRef = useRef(null);

  const active = getActivePreset(store);
  const accent = ACCENT[kind];

  useEffect(() => {
    if (!showList) return;
    const handler = (e) => { if (listRef.current && !listRef.current.contains(e.target)) setShowList(false); };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [showList]);

  // Switching work presets changes the cycle length underneath the diamonds,
  // so the stored block count is no longer meaningful — same reason toggling
  // micro breaks resets it.
  const activate = (id) => {
    if (kind === "work" && id !== store.activeId) clearSession();
    setStore(s => selectPreset(s, id));
    setShowList(false);
  };

  const onNew = () => {
    const name = window.prompt("Name for the new preset?", kind === "work" ? "New routine" : "Short evening");
    if (name === null) return;
    setStore(s => addPreset(s, kind, defaultPresetBody(kind), name).store);
    if (kind === "work") clearSession();
    setShowList(false);
  };

  const onDuplicate = () => {
    setStore(s => duplicatePreset(s, s.activeId).store);
    setShowList(false);
  };

  const onRename = () => {
    const name = window.prompt("Rename preset", active.name);
    if (name === null) return;
    setStore(s => renamePreset(s, s.activeId, name));
  };

  const onDelete = () => {
    if (store.presets.length <= 1) {
      setError("This is the only preset — add another before deleting this one.");
      return;
    }
    if (!window.confirm(`Delete the preset "${active.name}"? This cannot be undone.`)) return;
    if (kind === "work") clearSession();
    setStore(s => removePreset(s, s.activeId));
  };

  // Imported presets are always added, never merged over an existing one, so
  // nothing already saved can be lost to a bad paste.
  const applyImport = (text) => {
    setError(null); setNotice(null);
    const result = parseImport(kind, text);
    if (!result.ok) { setError(result.error); return; }
    setStore(s => {
      let next = s;
      for (const p of result.presets) next = addPreset(next, kind, p, p.name).store;
      return next;
    });
    setPaste("");
    // The builder remounts on the new active preset, so this notice is only
    // seen when the import failed to activate — the selector's new name is
    // the confirmation in the normal case.
    setNotice(`Imported ${result.presets.length} preset${result.presets.length === 1 ? "" : "s"}`);
  };

  const onFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => applyImport(ev.target.result);
    reader.readAsText(file);
    e.target.value = "";
  };

  const onCopySchema = async () => {
    const text = presetSchemaText(kind);
    try {
      await navigator.clipboard.writeText(text);
      setNotice("Schema copied — paste it to an AI and ask for a filled-in version.");
      setError(null);
    } catch (err) {
      // Clipboard is blocked outside a secure context; showing the text is
      // still better than failing silently.
      setPaste(text);
      setNotice("Clipboard unavailable — schema put in the box below instead.");
    }
  };

  const onBackup = () => exportBackup({ work: loadPresets("work"), evening: loadPresets("evening") });

  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.015)" }}>
      <input ref={fileRef} type="file" accept=".json,application/json" onChange={onFile} style={{ display: "none" }} />

      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", flexWrap: "wrap", maxWidth: 600, margin: "0 auto" }}>
        {/* Which preset is being edited */}
        <div ref={listRef} style={{ position: "relative", flex: "1 1 130px", minWidth: 0 }}>
          <button
            onClick={() => setShowList(s => !s)}
            style={{ ...btnSmall, display: "flex", alignItems: "center", gap: "0.45rem", width: "100%", maxWidth: 260, fontSize: "0.68rem", padding: "0.35rem 0.6rem", color: "rgba(255,255,255,0.75)" }}
          >
            <span style={{ fontSize: "0.5rem", color: accent, flexShrink: 0 }}>◆</span>
            <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{active.name}</span>
            <span style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }}>{showList ? "▾" : "▸"}</span>
          </button>
          {showList && (
            <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 30, background: "rgba(15,14,12,0.97)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, padding: "0.3rem 0", minWidth: 200, maxWidth: 280, backdropFilter: "blur(8px)", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
              {store.presets.map(p => (
                <button key={p.id} onClick={() => activate(p.id)} style={{
                  display: "flex", alignItems: "center", gap: "0.45rem", width: "100%", textAlign: "left",
                  padding: "0.42rem 0.7rem", border: "none", background: "transparent", cursor: "pointer",
                  fontFamily: FONT, fontSize: "0.65rem",
                  color: p.id === store.activeId ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.45)",
                }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <span style={{ fontSize: "0.5rem", color: p.id === store.activeId ? accent : "transparent", flexShrink: 0 }}>◆</span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                </button>
              ))}
              <button onClick={onNew} style={{
                display: "block", width: "100%", textAlign: "left", padding: "0.42rem 0.7rem 0.32rem",
                marginTop: "0.2rem", borderTop: "1px solid rgba(255,255,255,0.07)", borderLeft: "none", borderRight: "none", borderBottom: "none",
                background: "transparent", cursor: "pointer", fontFamily: FONT, fontSize: "0.58rem", letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)",
              }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >+ NEW PRESET</button>
            </div>
          )}
        </div>

        <button onClick={onDuplicate} style={btnSmall} title="Copy this preset as the starting point for another">DUPLICATE</button>
        <button onClick={onRename} style={btnSmall}>RENAME</button>
        <button onClick={onDelete} style={{ ...btnSmall, borderColor: "rgba(200,80,80,0.35)", color: "rgba(200,80,80,0.8)" }}>DELETE</button>
        <button onClick={() => { setShowIO(v => !v); setError(null); setNotice(null); }} style={{ ...btnSmall, color: showIO ? "rgba(255,255,255,0.75)" : btnSmall.color }}>JSON</button>
      </div>

      {/* Export / import, scoped to this one preset. Kept behind a toggle so
          the bar above stays a routine switcher rather than a toolbar. */}
      {showIO && (
        <div style={{ padding: "0 1rem 0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: 600, margin: "0 auto" }}>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            <button onClick={() => exportPreset(kind, active)} style={btnSmall}>EXPORT “{active.name}”</button>
            <button onClick={() => fileRef.current?.click()} style={btnSmall}>IMPORT FILE</button>
            <button onClick={onCopySchema} style={btnSmall}>COPY SCHEMA</button>
            <button onClick={onBackup} style={{ ...btnSmall, color: "rgba(255,255,255,0.3)" }} title="Both modes, every preset — a backup, not a routine to import">BACKUP ALL</button>
          </div>
          <textarea
            value={paste}
            onChange={e => setPaste(e.target.value)}
            placeholder={`Paste ${kind} preset JSON here…`}
            spellCheck={false}
            style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6,
              color: "#f0ece4", fontFamily: FONT, fontSize: "0.66rem", lineHeight: 1.6, padding: "0.55rem 0.7rem",
              width: "100%", minHeight: 92, resize: "vertical", outline: "none", boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
            <button
              onClick={() => applyImport(paste)}
              disabled={!paste.trim()}
              style={{ ...btnSmall, opacity: paste.trim() ? 1 : 0.35, cursor: paste.trim() ? "pointer" : "default", borderColor: paste.trim() ? accent : btnSmall.border }}
            >IMPORT PASTED</button>
            <span style={{ fontSize: "0.55rem", color: "#4a4640", letterSpacing: "0.04em" }}>
              Adds a new preset — never overwrites one you already have.
            </span>
          </div>
        </div>
      )}

      {error && (
        <div style={{ padding: "0.5rem 1rem", background: "rgba(200,80,80,0.12)", color: "#c85050", fontSize: "0.68rem", lineHeight: 1.5 }}>
          Import failed: {error}
        </div>
      )}
      {notice && !error && (
        <div style={{ padding: "0.5rem 1rem", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)", fontSize: "0.68rem", lineHeight: 1.5 }}>
          {notice}
        </div>
      )}
    </div>
  );
}
