// Build identity, shown at the foot of both builders. Answers "is the app on
// my device the latest one?" — the commit changes every deploy, so it is the
// part to compare. Values are injected at build time by vite.config.js.

const FONT = "'DM Mono', monospace";

export default function VersionStamp() {
  return (
    <div style={{
      marginTop: "1.75rem",
      paddingTop: "0.85rem",
      borderTop: "1px solid rgba(255,255,255,0.06)",
      fontFamily: FONT,
      fontSize: "0.5rem",
      letterSpacing: "0.1em",
      lineHeight: 1.9,
      color: "#3d3a36",
      textAlign: "center",
      // Deliberately not uppercased — the commit has to stay readable to
      // compare against what is deployed.
    }}>
      <div>AlignedFlow v{__APP_VERSION__} · {__BUILD_COMMIT__}</div>
      <div>Built {__BUILD_TIME__} UTC</div>
    </div>
  );
}
