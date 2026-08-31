import { APP_VERSION } from "./version";

// The offer shown when a newer build has arrived. Hangs under the mode
// switcher rather than at the foot of the screen, which both modes already
// use for their own controls. Same panel language as the preset menu — dark,
// blurred, hairline border — so it reads as part of the app and not as a
// browser chrome notification.

const FONT = "'DM Mono', monospace";

const keyframes = `
@keyframes updateIn { from { opacity: 0; transform: translate(-50%, -6px); } to { opacity: 1; transform: translate(-50%, 0); } }
`;

const btn = {
  border: "1px solid rgba(255,255,255,0.15)",
  background: "transparent",
  borderRadius: 6,
  color: "rgba(255,255,255,0.5)",
  fontFamily: FONT,
  fontSize: "0.6rem",
  letterSpacing: "0.14em",
  cursor: "pointer",
  padding: "0.35rem 0.7rem",
  transition: "color 0.25s, border-color 0.25s",
};

// Reload leads, but only by a step — nothing here is urgent enough for a
// filled button, and neither mode's accent belongs on a panel that can appear
// over either one.
const btnPrimary = { ...btn, borderColor: "rgba(255,255,255,0.32)", color: "rgba(255,255,255,0.75)" };

// `shift` is the switcher pill's own off-centre nudge — the fill never spans
// the whole window, so centring on the window lands off-centre within the
// colour actually on screen. Taking the same value keeps the two stacked.
export default function UpdatePrompt({ onReload, onDismiss, shift = 0 }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: keyframes }} />
      <div role="status" style={{
        position: "fixed",
        top: "3.4rem",
        left: `calc(50% + ${shift}px)`,
        transform: "translateX(-50%)",
        animation: "updateIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        zIndex: 70,
        width: "max-content",
        maxWidth: "calc(100vw - 2rem)",
        background: "rgba(15,14,12,0.97)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 6,
        backdropFilter: "blur(8px)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
        padding: "0.7rem 0.85rem",
        fontFamily: FONT,
        display: "flex",
        flexDirection: "column",
        gap: "0.6rem",
      }}>
        <div>
          <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>
            A newer version is ready.
          </div>
          <div style={{ fontSize: "0.5rem", letterSpacing: "0.1em", color: "#6b665f", lineHeight: 1.9 }}>
            You're on V{APP_VERSION}
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.4rem", justifyContent: "flex-end" }}>
          <button type="button" onClick={onDismiss} style={btn}>LATER</button>
          <button type="button" onClick={onReload} style={btnPrimary}>RELOAD</button>
        </div>
      </div>
    </>
  );
}
