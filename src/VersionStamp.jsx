import { APP_VERSION } from "./version";

// Build identity, shown at the foot of both builders. Answers "is the app on
// my device the latest one?" — V<n> is the part to compare between devices;
// the commit and build time below it are forensics for when something looks
// wrong. They stay on screen rather than living only in the tooltip because
// this is a phone app first, and a phone has no hover.

const FONT = "'DM Mono', monospace";

export default function VersionStamp() {
  return (
    <div
      title={`AlignedFlow V${APP_VERSION} · commit ${__BUILD_COMMIT__} · built ${__BUILD_TIME__} UTC`}
      style={{
        marginTop: "1.75rem",
        paddingTop: "0.85rem",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        fontFamily: FONT,
        letterSpacing: "0.1em",
        lineHeight: 1.9,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "0.62rem", color: "#6b665f" }}>AlignedFlow V{APP_VERSION}</div>
      {/* Deliberately not uppercased — the commit has to stay readable to
          compare against what is deployed. */}
      <div style={{ fontSize: "0.5rem", color: "#3d3a36" }}>{__BUILD_COMMIT__} · {__BUILD_TIME__} UTC</div>
    </div>
  );
}
