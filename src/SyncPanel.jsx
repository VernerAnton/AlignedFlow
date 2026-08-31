import { useState } from "react";

const FONT = "'DM Mono', monospace";
const btnSmall = { border: "1px solid rgba(255,255,255,0.15)", background: "transparent", borderRadius: 6, color: "rgba(255,255,255,0.5)", fontFamily: FONT, fontSize: "0.6rem", letterSpacing: "0.08em", cursor: "pointer", padding: "0.3rem 0.55rem" };

const DOT = {
  off:        { color: "#3d3a36", label: "not syncing" },
  connecting: { color: "#c4956a", label: "connecting…" },
  joining:    { color: "#c4956a", label: "choose how to join" },
  connected:  { color: "#3aaa7a", label: "synced" },
  error:      { color: "#c85050", label: "sync problem" },
};

// Sits at the foot of both builders, beside the build stamp. The two answer
// neighbouring questions — "is this device on the latest build" and "is this
// device carrying the same routines as the others" — so they belong together
// rather than in a settings screen of their own.
export default function SyncPanel({ sync }) {
  const [draft, setDraft] = useState("");
  const [showKey, setShowKey] = useState(false);
  const state = DOT[sync.status] || DOT.off;

  if (!sync.configured && sync.status === "off") {
    return (
      <Shell state={DOT.off}>
        <div style={{ fontSize: "0.55rem", color: "#3d3a36", lineHeight: 1.6 }}>
          This build has no Firebase configuration, so sync is unavailable.
          See docs/firebase-setup.md.
        </div>
      </Shell>
    );
  }

  // Joining a key that already holds routines. This device almost certainly has
  // the same routines under different ids — every device generated its own when
  // it migrated — so merging without asking would leave duplicates everywhere.
  if (sync.status === "joining" && sync.pendingJoin) {
    const { work, evening } = sync.pendingJoin;
    return (
      <Shell state={state}>
        <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.7, marginBottom: "0.5rem" }}>
          This key already has {work} work preset{work === 1 ? "" : "s"} and {evening} evening preset{evening === 1 ? "" : "s"}.
        </div>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", justifyContent: "center" }}>
          <button onClick={() => sync.resolveJoin("adopt")} style={{ ...btnSmall, borderColor: "rgba(58,170,122,0.4)", color: "#3aaa7a" }}>USE CLOUD ROUTINES</button>
          <button onClick={() => sync.resolveJoin("merge")} style={btnSmall}>ADD MINE TOO</button>
          <button onClick={sync.cancelJoin} style={btnSmall}>CANCEL</button>
        </div>
        <div style={{ fontSize: "0.52rem", color: "#3d3a36", lineHeight: 1.6, marginTop: "0.45rem" }}>
          Either way this device's current routines are kept in a local backup first.
        </div>
      </Shell>
    );
  }

  if (sync.status === "connected") {
    return (
      <Shell state={state}>
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => setShowKey(v => !v)} style={{ ...btnSmall, fontSize: "0.55rem" }}>
            {showKey ? sync.key : "SHOW KEY"}
          </button>
          <button onClick={sync.disconnect} style={btnSmall}>DISCONNECT</button>
        </div>
        <div style={{ fontSize: "0.52rem", color: "#3d3a36", lineHeight: 1.6, marginTop: "0.45rem" }}>
          Presets, the active preset and the work cycle follow you. The running
          countdown stays on this device.
        </div>
        {sync.error && <Problem>{sync.error}</Problem>}
      </Shell>
    );
  }

  return (
    <Shell state={state}>
      <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") sync.connect(draft); }}
          placeholder="sync key"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          style={{
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6,
            color: "#f0ece4", fontFamily: FONT, fontSize: "0.65rem", padding: "0.3rem 0.5rem",
            width: 170, outline: "none", textAlign: "center",
          }}
        />
        <button
          onClick={() => sync.connect(draft)}
          disabled={sync.status === "connecting"}
          style={{ ...btnSmall, opacity: sync.status === "connecting" ? 0.4 : 1 }}
        >
          {sync.status === "connecting" ? "…" : "CONNECT"}
        </button>
      </div>
      <div style={{ fontSize: "0.52rem", color: "#3d3a36", lineHeight: 1.6, marginTop: "0.45rem" }}>
        The same key on every device. Nothing leaves this device until you connect.
      </div>
      {sync.error && <Problem>{sync.error}</Problem>}
    </Shell>
  );
}

const Problem = ({ children }) => (
  <div style={{ fontSize: "0.55rem", color: "#c85050", lineHeight: 1.6, marginTop: "0.45rem" }}>{children}</div>
);

function Shell({ state, children }) {
  return (
    <div style={{
      marginTop: "1.75rem", paddingTop: "0.85rem",
      borderTop: "1px solid rgba(255,255,255,0.06)",
      fontFamily: FONT, textAlign: "center",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", marginBottom: "0.5rem" }}>
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: state.color, flexShrink: 0 }} />
        <span style={{ fontSize: "0.55rem", letterSpacing: "0.14em", color: "#6b665f", textTransform: "uppercase" }}>
          Sync · {state.label}
        </span>
      </div>
      {children}
    </div>
  );
}
