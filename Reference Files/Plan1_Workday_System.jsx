import { useState } from "react";

const Section = ({ title, accent, children }) => (
  <div style={{
    marginBottom: "2.5rem",
    borderLeft: `3px solid ${accent}`,
    paddingLeft: "1.5rem"
  }}>
    <h2 style={{
      fontSize: "0.7rem",
      letterSpacing: "0.2em",
      textTransform: "uppercase",
      color: accent,
      marginBottom: "1rem",
      fontFamily: "'DM Mono', monospace"
    }}>{title}</h2>
    {children}
  </div>
);

const Card = ({ title, why, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "8px",
      marginBottom: "1rem",
      overflow: "hidden"
    }}>
      <div style={{
        padding: "1rem 1.25rem",
        cursor: "pointer",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        userSelect: "none"
      }} onClick={() => setOpen(!open)}>
        <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "#f0ece4" }}>{title}</span>
        <span style={{
          fontSize: "0.7rem",
          color: "#888",
          letterSpacing: "0.05em",
          fontFamily: "'DM Mono', monospace"
        }}>{open ? "▲ hide why" : "▼ why this"}</span>
      </div>
      <div style={{ padding: "0 1.25rem 1.25rem" }}>
        {children}
      </div>
      {open && (
        <div style={{
          margin: "0 1.25rem 1.25rem",
          padding: "0.85rem 1rem",
          background: "rgba(180,150,100,0.08)",
          borderRadius: "6px",
          borderLeft: "2px solid #b4966466",
          fontSize: "0.82rem",
          color: "#b09070",
          lineHeight: 1.7,
          fontStyle: "italic"
        }}>
          {why}
        </div>
      )}
    </div>
  );
};

const Rule = ({ children }) => (
  <div style={{
    padding: "0.5rem 0",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    fontSize: "0.88rem",
    color: "#ccc8be",
    lineHeight: 1.6,
    display: "flex",
    gap: "0.75rem",
    alignItems: "flex-start"
  }}>
    <span style={{ color: "#5a8a6a", marginTop: "0.15rem", flexShrink: 0 }}>→</span>
    <span>{children}</span>
  </div>
);

const Step = ({ n, children }) => (
  <div style={{
    display: "flex",
    gap: "1rem",
    marginBottom: "0.6rem",
    alignItems: "flex-start"
  }}>
    <div style={{
      width: "22px", height: "22px", borderRadius: "50%",
      background: "rgba(90,138,106,0.2)",
      border: "1px solid #5a8a6a55",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "0.7rem", color: "#5a8a6a", flexShrink: 0,
      fontFamily: "'DM Mono', monospace", marginTop: "0.1rem"
    }}>{n}</div>
    <span style={{ fontSize: "0.88rem", color: "#ccc8be", lineHeight: 1.65 }}>{children}</span>
  </div>
);

const TrafficLight = ({ color, label, action }) => {
  const colors = { green: "#4a7a5a", yellow: "#a07830", red: "#8a3030" };
  const bg = { green: "rgba(74,122,90,0.12)", yellow: "rgba(160,120,48,0.12)", red: "rgba(138,48,48,0.12)" };
  return (
    <div style={{
      display: "flex", gap: "1rem", alignItems: "flex-start",
      padding: "0.85rem 1rem", borderRadius: "6px",
      background: bg[color],
      border: `1px solid ${colors[color]}44`,
      marginBottom: "0.6rem"
    }}>
      <div style={{
        width: "10px", height: "10px", borderRadius: "50%",
        background: colors[color], flexShrink: 0, marginTop: "0.3rem"
      }} />
      <div>
        <div style={{ fontSize: "0.78rem", fontWeight: 700, color: colors[color], letterSpacing: "0.05em", marginBottom: "0.2rem", fontFamily: "'DM Mono', monospace" }}>{label}</div>
        <div style={{ fontSize: "0.85rem", color: "#bbb", lineHeight: 1.6 }}>{action}</div>
      </div>
    </div>
  );
};

export default function Plan1() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f0e0c",
      color: "#f0ece4",
      fontFamily: "'Georgia', serif",
      padding: "3rem 2rem",
      maxWidth: "680px",
      margin: "0 auto"
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&display=swap" rel="stylesheet" />

      <div style={{ marginBottom: "3rem" }}>
        <div style={{
          fontSize: "0.65rem", letterSpacing: "0.25em", textTransform: "uppercase",
          color: "#5a8a6a", fontFamily: "'DM Mono', monospace", marginBottom: "0.75rem"
        }}>Plan 1 — v1</div>
        <h1 style={{
          fontSize: "1.8rem", fontWeight: 400, lineHeight: 1.25,
          marginBottom: "0.75rem", color: "#f0ece4", letterSpacing: "-0.02em"
        }}>Workday Shoulder &<br />Neck Load Prevention</h1>
        <p style={{ fontSize: "0.88rem", color: "#888", lineHeight: 1.7, maxWidth: "520px" }}>
          The goal is not perfect posture held all day. It is removing the mechanics that force the shoulders forward, and interrupting drift before it loads the skull-base. Each rule and drill has a reason — tap "why this" to see it.
        </p>
      </div>

      {/* WORKSTATION */}
      <Section title="Workstation Setup" accent="#5a8a6a">
        <Card
          title="Monitor: top edge at or just below eye level, arm's length away"
          why="If the screen is too low, your chin drops and the suboccipitals lengthen under load for hours. If it's too high, they shorten. The distance matters because leaning toward a screen is the most common single trigger for forward head posture — the body follows the eyes."
        >
          <Rule>Top edge of screen at or slightly below eye level</Rule>
          <Rule>Arm's length from face — close enough that you don't lean</Rule>
          <Rule>Centered directly in front of you, no rotation</Rule>
        </Card>

        <Card
          title="Keyboard & mouse inside the elbow box"
          why="The moment your arm reaches forward, the shoulder protracts and the whole mechanical chain loads. The mouse is the bigger offender — most people place it too far right and too far forward. The rule is simple: if the elbow lifts away from the body to reach the mouse, it's too far."
        >
          <Rule>Elbows stay under or just behind the shoulders — no forward reaching</Rule>
          <Rule>Mouse sits beside the keyboard at the same height, close enough that shoulder does not move forward to reach it</Rule>
          <Rule>Movement comes from elbow motion, not shoulder reach</Rule>
        </Card>

        <Card
          title="Forearm support — the most underrated fix"
          why="Your current pattern (palms down, forearms floating) means your shoulders are holding the weight of your arms all day — for 8–12 hours. Resting roughly half the forearm on the desk transfers that load to the surface and lets the shoulders genuinely drop. This single change can reduce baseline skull-base tension significantly over a workday."
        >
          <Rule>Elbows near the torso, roughly half the forearm resting on the desk surface</Rule>
          <Rule>The desk carries the arm weight — shoulders should feel heavy and dropped, not holding</Rule>
          <Rule>If your elbows float in space while typing, that's the problem</Rule>
        </Card>

        <Card
          title="Phone at eye level for any use over 30 seconds"
          why="Looking down at a phone adds the same forward-head load as a low monitor — compounded by the fact that it's often done outside of the 'ergonomic mindset' that desk work creates. Even a few minutes per hour adds up across a full day."
        >
          <Rule>Phone raised to eye level — not head tilted down to phone</Rule>
          <Rule>For long reading or scrolling: prop against something or hold up</Rule>
        </Card>
      </Section>

      {/* POSTURE CUE */}
      <Section title="The One Posture Cue" accent="#7a7aaa">
        <Card
          title='"Collarbones wide, shoulders heavy"'
          why='"Shoulders back" activates the upper traps and creates muscular tension — it cannot be sustained. "Collarbones wide" opens the chest without effort by cuing the ribcage, not the muscles. "Shoulders heavy" tells the body to stop holding the arms up. Together they produce a neutral resting position that is actually maintainable. This replaces every other posture cue.'
        >
          <p style={{ fontSize: "0.88rem", color: "#ccc8be", lineHeight: 1.7, marginBottom: "0.75rem" }}>
            Use this as the single check-in cue throughout the day. It works because it targets the ribcage and shoulder drop rather than muscular holding.
          </p>
          <Rule>Widen the collarbones — imagine the chest broadening left and right</Rule>
          <Rule>Let the shoulders drop and feel heavy — stop carrying the arms</Rule>
          <Rule>Head will naturally retract slightly as a result — do not force it</Rule>
        </Card>
      </Section>

      {/* MICRO-RESETS */}
      <Section title="Micro-Reset System — Every 25–30 Min" accent="#aa7a5a">
        <p style={{ fontSize: "0.85rem", color: "#888", lineHeight: 1.7, marginBottom: "1.25rem" }}>
          Postural drift is automatic. The scapular stabilizers fatigue and the chest muscles pull the shoulders forward — this happens whether you try to "sit correctly" or not. Resets interrupt the drift cycle before it accumulates into skull-base load. Total time per reset: under 60 seconds.
        </p>

        <Card
          title="Reset A — Shoulder sequence (20 sec)"
          why="The shrug-back-drop sequence mechanically reverses the forward drift of the scapula. The collarbone cue and 3 breaths reset the resting shoulder position. The belly breath in the last step is critical: shallow chest breathing recruits the scalenes and upper traps — both neck muscles — as accessory breathing muscles. Breathing into the belly keeps those muscles out of the breath cycle."
        >
          <Step n="1">Shrug both shoulders up toward the ears</Step>
          <Step n="2">Roll them back — squeeze the shoulder blades together</Step>
          <Step n="3">Drop them down completely — let them fall heavy</Step>
          <Step n="4">Repeat once more</Step>
          <Step n="5">Widen the collarbones, settle shoulders 10–20% back from neutral</Step>
          <Step n="6">Take 3 slow belly breaths — hand on stomach should rise, not chest</Step>
        </Card>

        <Card
          title="Reset B — Neck de-bracing (15 sec)"
          why="The deep cervical flexors (longus colli, longus capitis) are the muscles that should stabilize the neck passively and without effort. When they are underactive — which happens from sustained forward head posture — the suboccipitals compensate and take over. They are not designed for sustained load. The chin nod drill activates the deep flexors specifically. 5 reps is enough to reduce suboccipital overuse for the next 20–25 minutes."
        >
          <Step n="1">Sit tall, chin level — not tucked down, not lifted up</Step>
          <Step n="2">Glide the head straight back — like making a subtle double chin</Step>
          <Step n="3">This is retraction, not flexion — the face stays level</Step>
          <Step n="4">5 small nods from that retracted position</Step>
          <Step n="5">Hold the last one for 5 seconds, then release fully</Step>
        </Card>

        <Card
          title="Levator scapulae release — right side (20 sec, add when tight)"
          why="The levator scapulae runs from the upper cervical vertebrae directly to the top corner of the scapula. When the shoulder is forward and the scapula is protracted, this muscle is under chronic stretch-tension — it becomes a direct neck-to-skull load carrier. Your right side being worse is consistent: right-handed mouse use protracts the right shoulder more than the left. This stretch is the only neck-adjacent movement with a direct mechanical rationale for your pattern. It does not stretch the suboccipitals — it deloads the muscle pulling from the scapula up to the skull."
        >
          <Step n="1">Sit tall, actively drop the right shoulder down and back</Step>
          <Step n="2">Tilt the head slightly left and slightly forward — 45° between left and down</Step>
          <Step n="3">You should feel a stretch from the right shoulder-neck junction upward</Step>
          <Step n="4">Hold 20 seconds — breathe slowly, don't force the stretch deeper</Step>
          <Step n="5">Release, reset the shoulder position before returning to work</Step>
        </Card>
      </Section>

      {/* PEC MINOR */}
      <Section title="Pec Minor Release — Once Per Workday" accent="#aa5a7a">
        <Card
          title="Doorframe chest opener or corner stretch (60–90 sec)"
          why="The pectoralis minor is the primary mechanical reason your shoulders feel like a stretch when rolled back. It originates on the ribs and inserts on the front of the scapula — when it shortens, it pulls the scapula forward and down, directly creating forward shoulder posture. Your rows and pulling strength cannot overcome a chronically shortened pec minor because the problem is tissue length, not muscular strength. Stretching it once mid-workday creates a window where shoulder retraction is genuinely easier. Without this, every reset is fighting a taut spring."
        >
          <Step n="1">Stand in a doorframe — forearms on the frame at 90°, shoulder height</Step>
          <Step n="2">Step one foot through the doorway</Step>
          <Step n="3">Gently lean through until you feel a stretch across the chest — not the shoulder joint</Step>
          <Step n="4">Hold 30 seconds — breathe slowly, let the chest open passively</Step>
          <Step n="5">Repeat with arms higher (Y-shape, ~135°) to get pec minor specifically</Step>
          <p style={{ fontSize: "0.82rem", color: "#888", lineHeight: 1.65, marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            No doorframe: stand in a corner, both hands on the walls, same movement. Or use a resistance band anchored at shoulder height behind you.
          </p>
        </Card>
      </Section>

      {/* STOPLIGHT */}
      <Section title="Stoplight System" accent="#888">
        <p style={{ fontSize: "0.85rem", color: "#888", lineHeight: 1.7, marginBottom: "1.25rem" }}>
          A decision framework for during the workday. Removes guesswork about when to act versus when to continue working.
        </p>
        <TrafficLight
          color="green"
          label="Green — minimal tension"
          action="Follow the reset rhythm every 25–30 minutes. No additional action needed."
        />
        <TrafficLight
          color="yellow"
          label="Yellow — skull-base tightness starting"
          action="Do Reset A + Reset B immediately, then take a 2-minute walk before returning. If right side is tight: add the levator stretch."
        />
        <TrafficLight
          color="red"
          label="Red — clear headache warning"
          action="Stop desk posture entirely. 10-minute walk, full reset sequence. Return only once tension has decreased. Do not push through."
        />
      </Section>

      {/* TIMELINE */}
      <Section title="What to Expect" accent="#5a8a6a">
        <div style={{ fontSize: "0.85rem", color: "#aaa", lineHeight: 1.9 }}>
          <div style={{ display: "flex", gap: "1rem", marginBottom: "0.4rem" }}>
            <span style={{ color: "#5a8a6a", fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", minWidth: "90px", marginTop: "0.15rem" }}>Days 1–5</span>
            <span>Reduced skull-base load during the workday — you should notice fewer Yellow states by end of week one as the resets interrupt accumulation</span>
          </div>
          <div style={{ display: "flex", gap: "1rem", marginBottom: "0.4rem" }}>
            <span style={{ color: "#5a8a6a", fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", minWidth: "90px", marginTop: "0.15rem" }}>Weeks 2–4</span>
            <span>Shoulders begin drifting forward more slowly — the pec minor stretch and daily capacity block (Plan 3) gradually increase the tissue length available</span>
          </div>
          <div style={{ display: "flex", gap: "1rem" }}>
            <span style={{ color: "#5a8a6a", fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", minWidth: "90px", marginTop: "0.15rem" }}>Month 1–2</span>
            <span>Neutral shoulder position begins to feel natural rather than like an effort — this is when endurance has built enough to reduce conscious effort</span>
          </div>
        </div>
      </Section>

      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        paddingTop: "1.5rem",
        fontSize: "0.75rem",
        color: "#555",
        fontFamily: "'DM Mono', monospace",
        letterSpacing: "0.05em"
      }}>
        Plan 1 · v1 · Workday System · Review pending
      </div>
    </div>
  );
}
