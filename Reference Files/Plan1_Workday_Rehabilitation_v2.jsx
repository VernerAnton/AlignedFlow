import { useState } from "react";

const Section = ({ title, accent, subtitle, children }) => (
  <div style={{ marginBottom: "2.5rem", borderLeft: `3px solid ${accent}`, paddingLeft: "1.5rem" }}>
    <h2 style={{ fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: accent, marginBottom: subtitle ? "0.4rem" : "1rem", fontFamily: "'DM Mono', monospace" }}>{title}</h2>
    {subtitle && <p style={{ fontSize: "0.8rem", color: "#666", marginBottom: "1rem", lineHeight: 1.6 }}>{subtitle}</p>}
    {children}
  </div>
);

const Card = ({ title, why, badge, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", marginBottom: "1rem", overflow: "hidden" }}>
      <div style={{ padding: "1rem 1.25rem", cursor: why ? "pointer" : "default", display: "flex", justifyContent: "space-between", alignItems: "flex-start", userSelect: "none", gap: "0.75rem" }} onClick={() => why && setOpen(!open)}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          {badge && <span style={{ fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase", color: badge.color, fontFamily: "'DM Mono', monospace" }}>{badge.text}</span>}
          <span style={{ fontSize: "0.92rem", fontWeight: 600, color: "#f0ece4", lineHeight: 1.4 }}>{title}</span>
        </div>
        {why && <span style={{ fontSize: "0.7rem", color: "#555", letterSpacing: "0.05em", fontFamily: "'DM Mono', monospace", flexShrink: 0, marginTop: "0.2rem" }}>{open ? "▲" : "▼"} why</span>}
      </div>
      <div style={{ padding: "0 1.25rem 1.25rem" }}>{children}</div>
      {open && why && (
        <div style={{ margin: "0 1.25rem 1.25rem", padding: "0.85rem 1rem", background: "rgba(180,150,100,0.07)", borderRadius: "6px", borderLeft: "2px solid #b4966444", fontSize: "0.82rem", color: "#a08868", lineHeight: 1.75, fontStyle: "italic" }}>
          {why}
        </div>
      )}
    </div>
  );
};

const Rule = ({ children, highlight }) => (
  <div style={{ padding: "0.5rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "0.88rem", color: highlight ? "#e0c898" : "#ccc8be", lineHeight: 1.6, display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
    <span style={{ color: highlight ? "#c8a050" : "#5a8a6a", marginTop: "0.15rem", flexShrink: 0 }}>→</span>
    <span>{children}</span>
  </div>
);

const Step = ({ n, children, dim }) => (
  <div style={{ display: "flex", gap: "1rem", marginBottom: "0.6rem", alignItems: "flex-start", opacity: dim ? 0.6 : 1 }}>
    <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "rgba(90,138,106,0.2)", border: "1px solid #5a8a6a55", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", color: "#5a8a6a", flexShrink: 0, fontFamily: "'DM Mono', monospace", marginTop: "0.1rem" }}>{n}</div>
    <span style={{ fontSize: "0.88rem", color: "#ccc8be", lineHeight: 1.65 }}>{children}</span>
  </div>
);

const TimeBlock = ({ time, label, items, accent }) => (
  <div style={{ display: "flex", gap: "1.25rem", marginBottom: "1.25rem", alignItems: "flex-start" }}>
    <div style={{ minWidth: "70px", textAlign: "right" }}>
      <div style={{ fontSize: "0.7rem", fontFamily: "'DM Mono', monospace", color: accent || "#5a8a6a", letterSpacing: "0.05em" }}>{time}</div>
    </div>
    <div style={{ flex: 1, borderLeft: "1px solid rgba(255,255,255,0.08)", paddingLeft: "1rem" }}>
      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#ddd", marginBottom: "0.3rem" }}>{label}</div>
      {items.map((item, i) => (
        <div key={i} style={{ fontSize: "0.82rem", color: "#888", lineHeight: 1.6 }}>· {item}</div>
      ))}
    </div>
  </div>
);

const TrafficLight = ({ color, label, action }) => {
  const colors = { green: "#4a7a5a", yellow: "#a07830", red: "#8a3030" };
  const bg = { green: "rgba(74,122,90,0.1)", yellow: "rgba(160,120,48,0.1)", red: "rgba(138,48,48,0.1)" };
  return (
    <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", padding: "0.85rem 1rem", borderRadius: "6px", background: bg[color], border: `1px solid ${colors[color]}44`, marginBottom: "0.6rem" }}>
      <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: colors[color], flexShrink: 0, marginTop: "0.35rem" }} />
      <div>
        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: colors[color], letterSpacing: "0.06em", marginBottom: "0.25rem", fontFamily: "'DM Mono', monospace" }}>{label}</div>
        <div style={{ fontSize: "0.84rem", color: "#bbb", lineHeight: 1.65 }}>{action}</div>
      </div>
    </div>
  );
};

export default function Plan1() {
  return (
    <div style={{ minHeight: "100vh", background: "#0f0e0c", color: "#f0ece4", fontFamily: "'Georgia', serif", padding: "3rem 2rem", maxWidth: "680px", margin: "0 auto" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <div style={{ marginBottom: "3rem" }}>
        <div style={{ fontSize: "0.65rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "#5a8a6a", fontFamily: "'DM Mono', monospace", marginBottom: "0.75rem" }}>Plan 1 — v2 · Active Rehabilitation</div>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 400, lineHeight: 1.25, marginBottom: "0.75rem", color: "#f0ece4", letterSpacing: "-0.02em" }}>Workday Shoulder &<br />Neck Rehabilitation</h1>
        <p style={{ fontSize: "0.88rem", color: "#777", lineHeight: 1.75, maxWidth: "520px" }}>
          The workday is where the damage accumulates — 8–12 hours of forward shoulder load daily undoes whatever the evening routine repairs. This plan fixes the source. It is structured as active rehabilitation, not management: higher input frequency, dedicated tissue work, and a daily schedule that keeps the load below the threshold that triggers the nerve.
        </p>
      </div>

      {/* WORKSTATION */}
      <Section title="Workstation Setup" accent="#5a8a6a" subtitle="One-time corrections. Do these first — they reduce the baseline load that every other intervention is fighting against.">
        <Card title="Monitor: top edge at or just below eye level, arm's length away"
          why="If the screen is too low, the chin drops and the suboccipitals lengthen under load for hours. Too high and they shorten. Distance matters because leaning toward the screen is the most common single forward-head trigger — the body follows the eyes.">
          <Rule>Top edge at or slightly below eye level</Rule>
          <Rule>Arm's length from face — close enough that leaning forward is never necessary</Rule>
          <Rule>Centered directly in front, no rotation</Rule>
        </Card>
        <Card title="Keyboard & mouse inside the elbow box"
          why="The moment the arm reaches forward, the shoulder protracts and the whole chain loads. The mouse is the bigger offender — most people place it too far right and too far forward. If the elbow lifts away from the body to reach it, it is too far.">
          <Rule>Elbows under or just behind the shoulders at all times</Rule>
          <Rule>Mouse beside the keyboard at the same height — shoulder does not move forward to reach it</Rule>
          <Rule>Movement from elbow, not shoulder</Rule>
        </Card>
        <Card title="Forearm support — the highest-leverage single change"
          why="Forearms floating means the shoulders are holding the weight of the arms for 8–12 hours continuously. Resting roughly half the forearm on the desk transfers that load to the surface. The shoulders can then genuinely drop rather than hold. This alone reduces baseline suboccipital load significantly across a full workday.">
          <Rule highlight>Roughly half the forearm resting on the desk at all times while typing</Rule>
          <Rule>Elbows near the torso — desk carries the arm weight, shoulders do not</Rule>
          <Rule>If elbows float in space while typing, that is the problem</Rule>
        </Card>
        <Card title="Phone at eye level for anything over 30 seconds"
          why="Looking down at a phone produces the same forward-head cervical load as a low monitor — and it happens outside the ergonomic awareness that desk work sometimes creates. A few minutes per hour accumulates.">
          <Rule>Phone raised to eye level — head does not tilt down to phone</Rule>
          <Rule>For extended reading or scrolling: prop against something or hold up deliberately</Rule>
        </Card>
      </Section>

      {/* POSTURE CUE */}
      <Section title="The One Posture Cue" accent="#7a7aaa">
        <Card title='"Collarbones wide, shoulders heavy"'
          why='"Shoulders back" activates the upper traps and creates tension that cannot be sustained. "Collarbones wide" opens the chest by cuing the ribcage, not the muscles. "Shoulders heavy" instructs the body to stop holding the arms up. Together they produce a neutral position that is genuinely maintainable. Use this as the single check-in cue throughout the day — it replaces all other posture instructions.'>
          <Rule>Widen the collarbones — chest broadens left and right</Rule>
          <Rule>Let the shoulders drop and feel heavy — stop carrying the arms</Rule>
          <Rule>Head will naturally retract slightly as a result — do not force it</Rule>
        </Card>
      </Section>

      {/* DCF PROTOCOL */}
      <Section title="Deep Cervical Flexor Protocol — 3× Daily" accent="#8a6aaa"
        subtitle="This is the primary active rehabilitation intervention. Do it at morning, midday, and end of workday. Each session is 5 minutes. The wall is non-negotiable — it provides the biofeedback that makes this therapeutic rather than just movement.">
        <Card title="Wall craniocervical flexion — 5 min per session"
          why="The deep cervical flexors (longus colli, longus capitis) are the spine stabilizers of the neck. When they stop working — which happens from sustained forward head posture — the suboccipitals compensate. They are not designed for sustained postural load, which is why they contract chronically and compress the occipital nerve. This drill is the clinical gold standard for reactivating the deep flexors. The wall version was developed specifically for occipital dysfunction and neck pain rehabilitation. Without the wall, most people recruit the sternocleidomastoid instead — the wrong muscle — and the exercise loses most of its value. You know this drill from your osteopath. It works. It needs to be done three times per day to drive rehabilitation rather than just maintenance.">
          <Step n="1">Stand or sit with the back of the skull touching the wall — full contact, not just upper back</Step>
          <Step n="2">Chin level — not lifted, not tucked. Eyes forward.</Step>
          <Step n="3">Gently nod the chin toward the throat — the "double chin" movement. Skull stays against the wall.</Step>
          <Step n="4">Hold for 10 seconds. The sternocleidomastoid (the rope-like muscle down the side of the neck) must stay soft. If it hardens, the movement is too large — reduce it.</Step>
          <Step n="5">Release fully. Rest 5 seconds.</Step>
          <Step n="6">Repeat for 10 reps.</Step>
          <div style={{ marginTop: "0.85rem", padding: "0.75rem 1rem", background: "rgba(138,106,170,0.08)", borderRadius: "6px", borderLeft: "2px solid #8a6aaa55" }}>
            <div style={{ fontSize: "0.75rem", color: "#8a6aaa", fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>PROGRESSION</div>
            <div style={{ fontSize: "0.82rem", color: "#999", lineHeight: 1.7 }}>
              Week 1–2: 10 reps × 10 sec hold, focus on keeping SCM soft<br />
              Week 3–4: Add gentle resistance — fingertips on forehead, nodding against light pressure<br />
              Week 5+: Full range with 10-second holds maintained without any SCM recruitment
            </div>
          </div>
        </Card>
      </Section>

      {/* MICRO-RESETS */}
      <Section title="Micro-Reset System — Every 20 Minutes" accent="#aa7a5a"
        subtitle="Shortened from 25–30 min to 20 min because the nerve is currently sensitized. The goal is to never let suboccipital load accumulate to the threshold that triggers scalp pain. Under 60 seconds per reset.">
        <Card title="Reset A — Shoulder sequence (20 sec)"
          why="The shrug-back-drop sequence mechanically reverses forward scapular drift. The belly breath at the end is essential: shallow chest breathing recruits the scalenes and upper traps as accessory respiratory muscles — both neck muscles. Breathing into the belly keeps them out of the breathing cycle for the next 20 minutes.">
          <Step n="1">Shrug both shoulders up toward the ears</Step>
          <Step n="2">Roll them back — squeeze the shoulder blades together</Step>
          <Step n="3">Drop them down completely — let them fall heavy</Step>
          <Step n="4">Repeat once more</Step>
          <Step n="5">Widen the collarbones, settle shoulders 10–20% back</Step>
          <Step n="6">3 slow belly breaths — hand on stomach rises, chest stays still</Step>
        </Card>
        <Card title="Reset B — Neck de-bracing (15 sec)"
          why="A brief activation of the deep cervical flexors between the full DCF sessions. Reduces suboccipital substitution in the 20-minute window. Note: this is not a substitute for the full wall protocol — it is a maintenance signal between sessions.">
          <Step n="1">Sit tall, chin level</Step>
          <Step n="2">Glide head straight back — subtle double chin, face stays level</Step>
          <Step n="3">5 small nods from that retracted position</Step>
          <Step n="4">Hold the last one 5 seconds, then release fully</Step>
        </Card>
        <Card title="Levator scapulae stretch — right side priority (20 sec)"
          why="The levator scapulae runs directly from the upper cervical vertebrae to the top corner of the scapula. When the scapula is protracted, this muscle is under chronic stretch-tension and becomes a direct load carrier from shoulder to skull. Your right side is worse because right-handed mouse use protracts the right shoulder more. This is the only neck-adjacent stretch with a direct mechanical rationale for your specific pattern. Right side held longer than left.">
          <Step n="1">Sit tall, actively drop the right shoulder down and back</Step>
          <Step n="2">Tilt head left and slightly forward — 45° between left and down</Step>
          <Step n="3">Feel the stretch from right shoulder-neck junction upward</Step>
          <Step n="4">Right side: hold 20 seconds. Left side: hold 12 seconds.</Step>
          <Step n="5">Release, reset shoulder position before returning to work</Step>
        </Card>
      </Section>

      {/* PEC MINOR */}
      <Section title="Pec Minor Stretch — 3× Per Workday" accent="#aa5a7a"
        subtitle="Mid-morning, mid-afternoon, and once more in the evening (Plan 3). Three sessions per day drives tissue length adaptation significantly faster than once daily. Each session is 90 seconds. This is the structural intervention that makes every reset easier — without it, each reset is fighting a taut spring that recoils immediately.">
        <Card title="Doorframe chest opener — 90 sec per session"
          why="The pec minor originates on the ribs and inserts on the front of the scapula. When it shortens — which it does chronically from hours of forward posture — it pulls the scapula forward and down. Pulling strength cannot overcome tissue shortness because it is a length problem, not a strength problem. The higher arm position (Y-shape) targets the pec minor specifically rather than the larger pec major, because the pec minor is the deeper and smaller muscle that responds to the elevated angle.">
          <Step n="1">Stand in a doorframe — forearms on frame at shoulder height, elbows at 90°</Step>
          <Step n="2">Step one foot through the doorway, gently lean body forward</Step>
          <Step n="3">Feel stretch across the chest — not in the shoulder joint itself</Step>
          <Step n="4">Hold 30 seconds, breathing slowly, chest opening passively on each exhale</Step>
          <Step n="5">Raise arms to Y-shape (~135°) and repeat for 30 seconds — this is the pec minor position</Step>
          <Step n="6">Final 30 seconds: return to 90° and hold with focus on letting the sternum drop forward</Step>
          <div style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: "#777", lineHeight: 1.65, paddingTop: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            No doorframe: corner of a room with both hands on walls, same movement. Or resistance band anchored at shoulder height behind you.
          </div>
        </Card>
      </Section>

      {/* DAILY SCHEDULE */}
      <Section title="Daily Schedule" accent="#6a8aaa" subtitle="How all the elements fit into the workday without requiring large time blocks.">
        <TimeBlock time="Morning" label="DCF Protocol — Session 1" items={["Wall craniocervical flexion × 10 reps × 10 sec holds", "Before the workday starts or within the first 30 minutes"]} accent="#6a8aaa" />
        <TimeBlock time="Mid-morning" label="Pec Minor Stretch — Session 1 + Levator" items={["Doorframe stretch × 90 sec", "Levator scapulae: right 20 sec, left 12 sec", "~3 minutes total"]} accent="#aa5a7a" />
        <TimeBlock time="Every 20 min" label="Micro-Reset (seated)" items={["Reset A (shoulder sequence) + Reset B (chin nod)", "Add levator stretch if right side is tight", "Under 60 seconds"]} accent="#aa7a5a" />
        <TimeBlock time="Every 45–60 min" label="Standing Reset + Walk" items={["Stand up — do Reset A standing rather than seated", "Walk 2–3 minutes before returning to the desk", "Decompresses the full spinal stack — hip flexors release, pelvis resets, cervical load drops", "Sitting continuously over 60 min accumulates load that seated resets alone cannot clear"]} accent="#5a8a6a" />
        <TimeBlock time="Midday" label="DCF Protocol — Session 2 + Pec Minor Session 2" items={["Wall protocol × 10 reps", "Doorframe stretch × 90 sec immediately after", "~7 minutes total including transition"]} accent="#6a8aaa" />
        <TimeBlock time="Mid-afternoon" label="Pec Minor Stretch — Session 3" items={["Doorframe stretch × 90 sec", "Stand up, brief walk, return"]} accent="#aa5a7a" />
        <TimeBlock time="End of workday" label="DCF Protocol — Session 3" items={["Wall protocol × 10 reps", "This is the most important session — offsets peak daily accumulation before the evening"]} accent="#6a8aaa" />
      </Section>

      {/* ACUTE PROTOCOL */}
      <Section title="Acute Symptom Protocol" accent="#aa4a4a" subtitle="What to do when the scalp pain activates. Do not improvise — follow this sequence.">
        <Card title="When blood pressure spike triggers scalp pain"
          why="The occipital nerve is currently sensitized — any increase in suboccipital muscle tone (from exertion, stress, straining) compresses it further. The response is to reduce tone immediately and decompress the suboccipital space, not to push through or ignore it.">
          <Step n="1">Stop what you are doing. Sit or lie down — do not stay standing.</Step>
          <Step n="2">Perform Reset A slowly — shrug, back, drop — then breathe into the belly for 5 full breaths</Step>
          <Step n="3">If lying down: interlace fingers behind the skull base, gently draw the skull upward toward the crown, chin slightly tucked. Hold 30–60 seconds. This decompresses the suboccipital space directly.</Step>
          <Step n="4">Apply heat to the suboccipital region for 10 minutes if available — this reduces muscle tone neurologically</Step>
          <Step n="5">Do not return to desk work until tension has measurably decreased</Step>
        </Card>
        <Card title="Positions that reduce nerve tension immediately">
          <Rule>Lying flat on your back without a pillow — skull in neutral, no forward head</Rule>
          <Rule>Sitting with the back of the head resting against a wall or headrest</Rule>
          <Rule>Any position where the chin is slightly tucked and the skull-base is not compressed into a surface</Rule>
          <Rule highlight>Avoid: chin jutting forward, looking up, neck flexed hard forward, stomach sleeping</Rule>
        </Card>
        <Card title="Red-line symptoms — seek medical input that day">
          <Rule highlight>Sudden severe headache unlike previous ones ("thunderclap")</Rule>
          <Rule highlight>Visual disturbance, double vision, or loss of peripheral vision accompanying the pain</Rule>
          <Rule highlight>Neurological symptoms: numbness, weakness, confusion</Rule>
          <Rule highlight>Pain that does not decrease at all with position change or heat over 30 minutes</Rule>
          <div style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: "#888", lineHeight: 1.65, paddingTop: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            The symptoms you are currently experiencing (scalp pain from blood pressure variation, cognitive load, suboccipital tightness) are consistent with mechanical occipital neuralgia and should also be evaluated by a GP or neurologist — not because they are dangerous, but because a confirmed diagnosis opens access to targeted interventions (occipital nerve block) that can break the pain cycle in days rather than weeks.
          </div>
        </Card>
      </Section>

      {/* STOPLIGHT */}
      <Section title="Stoplight System" accent="#888">
        <TrafficLight color="green" label="Green — minimal tension"
          action="Follow the reset rhythm every 20 minutes. Standing reset + 2–3 min walk every 45–60 minutes. Pec minor and DCF sessions on schedule. No additional action." />
        <TrafficLight color="yellow" label="Yellow — skull-base tightness starting"
          action="Reset A + B immediately. 2-minute walk. Add levator stretch on right side. If scheduled DCF session is within 30 minutes, move it forward." />
        <TrafficLight color="red" label="Red — scalp pain activating"
          action="Follow the acute symptom protocol above. Do not push through. Return to desk only after tension measurably decreases." />
      </Section>

      {/* TIMELINE */}
      <Section title="What to Expect" accent="#5a8a6a">
        <div style={{ fontSize: "0.85rem", color: "#aaa", lineHeight: 1.9 }}>
          {[
            ["Days 1–3", "Fewer Yellow states — resets interrupt accumulation before it reaches the nerve threshold"],
            ["Days 4–7", "Scalp pain episodes decrease in frequency as baseline suboccipital load reduces"],
            ["Weeks 2–4", "Cognitive clarity begins returning — the neurological tax from chronic nerve irritation reduces as compression decreases"],
            ["Weeks 4–8", "Shoulders drift forward more slowly as pec minor tissue length adapts and DCF endurance builds"],
            ["Month 2+", "Neutral shoulder position begins to feel natural — this is when the structural correction is becoming habitual rather than effortful"],
          ].map(([time, text], i) => (
            <div key={i} style={{ display: "flex", gap: "1rem", marginBottom: "0.5rem" }}>
              <span style={{ color: "#5a8a6a", fontFamily: "'DM Mono', monospace", fontSize: "0.72rem", minWidth: "95px", marginTop: "0.2rem", flexShrink: 0 }}>{time}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </Section>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1.5rem", fontSize: "0.72rem", color: "#444", fontFamily: "'DM Mono', monospace", letterSpacing: "0.05em" }}>
        Plan 1 · v2 · Active Rehabilitation · Workday System
      </div>
    </div>
  );
}
