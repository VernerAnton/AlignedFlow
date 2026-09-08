import { useState, useEffect, useRef, useCallback } from 'react'
import PomodoroMode, { useWindowWidth } from './PomodoroMode'
import EveningMode from './EveningMode'
import EveningBuilder from './EveningBuilder'
import PomodoroBuilder from './PomodoroBuilder'
import { loadPresets, savePresets, getActivePreset, selectPreset, patchPreset, clearSession } from './dataStore'
import UpdatePrompt from './UpdatePrompt'
import { useSync } from './useSync'
import { useAppUpdate } from './useAppUpdate'
import { unlockAudio } from './sounds'
import { requestNotificationPermission } from './notifications'

const slideKeyframes = `
@keyframes fadeOut   { from { opacity: 1; } to { opacity: 0; } }
@keyframes fadeIn    { from { opacity: 0; } to { opacity: 1; } }
`

const EXIT_ANIM  = '0.35s cubic-bezier(0.4, 0, 0.6, 1) forwards'
const ENTER_ANIM = '0.45s cubic-bezier(0.0, 0.0, 0.2, 1) 0.15s forwards' // slight delay so exit leads

// Hover intent. The pill sits at top centre where the cursor passes through on
// its way elsewhere, so the menu waits to be meant; and it lingers on the way
// out so a diagonal move from the button to the list below doesn't dismiss it.
const HOVER_OPEN_MS  = 200
const HOVER_CLOSE_MS = 220

export default function App() {
  const [mode, setMode]         = useState('work')
  const [prevMode, setPrevMode] = useState(null)
  // Work and evening keep entirely separate preset stores, in separate
  // localStorage keys — an import or a reset on one side cannot reach the
  // other. Each holds its own list plus which preset is active.
  const [work, setWork]       = useState(() => loadPresets('work'))
  const [evening, setEvening] = useState(() => loadPresets('evening'))
  // Work mode publishes its task budget here so the switcher pill can carry it
  // as a segment. Null until work mode has reported once.
  const [taskStatus, setTaskStatus] = useState(null)
  // With the countdown hidden the segment is a bare bar, so it can be hovered
  // or tapped to read the time. A tap self-clears; a hover ends on its own.
  const [taskHover, setTaskHover] = useState(false)
  const [taskTapped, setTaskTapped] = useState(false)
  // The preset dropdown: which mode's list is open, and where under the pill
  // to hang it. Null when closed.
  const [menu, setMenu] = useState(null)
  const tapTimer = useRef(null)
  const openTimer = useRef(null)
  const closeTimer = useRef(null)
  const pillRef = useRef(null)
  const btnRefs = useRef({})
  const width = useWindowWidth()
  const initRef = useRef(false)
  const update = useAppUpdate()

  // What each mode is doing right now — whether a timer is running, and where
  // work is in its cycle. Sync reads both: the cycle position is shared across
  // devices, and isPlaying decides whether an incoming change can be applied
  // now or has to wait for the block to finish.
  const [runtime, setRuntime] = useState({ work: null, evening: null })
  const onWorkRuntime    = useCallback((v) => setRuntime(r => (r.work && r.work.isPlaying === v.isPlaying && r.work.session.phaseId === v.session.phaseId && r.work.session.workCount === v.session.workCount) ? r : { ...r, work: v }), [])
  const onEveningRuntime = useCallback((v) => setRuntime(r => (r.evening && r.evening.isPlaying === v.isPlaying) ? r : { ...r, evening: v }), [])
  // A cycle position from another device, handed to work mode to adopt.
  const [remoteSession, setRemoteSession] = useState(null)
  // Bumped when sync replaces the active preset's contents. Both modes copy
  // their preset into once-only state, so they are keyed on this as well as on
  // the preset id — otherwise a change made on another device would sit
  // unapplied until the next switch.
  const [rev, setRev] = useState({ work: 0, evening: 0 })
  const onRemoteApplied = useCallback((kind) => setRev(r => ({ ...r, [kind]: r[kind] + 1 })), [])

  const sync = useSync({
    work, evening, setWork, setEvening, runtime,
    applyRemoteSession: setRemoteSession,
    onRemoteApplied,
  })

  useEffect(() => () => {
    clearTimeout(tapTimer.current); clearTimeout(openTimer.current); clearTimeout(closeTimer.current)
  }, [])

  function peekTask() {
    setTaskTapped(true)
    clearTimeout(tapTimer.current)
    tapTimer.current = setTimeout(() => setTaskTapped(false), 2500)
  }

  useEffect(() => { savePresets('work', work) }, [work])
  useEffect(() => { savePresets('evening', evening) }, [evening])

  const stores    = { work, evening }
  const setStores = { work: setWork, evening: setEvening }
  const activeWork    = getActivePreset(work)
  const activeEvening = getActivePreset(evening)

  // Settings the modes change at runtime (durations, muted, the task budget)
  // are written straight back into the preset they belong to, so a change made
  // in the drawer sticks to that routine and not to whichever one you switch
  // to next.
  const patchActive = (kind) => (patch) =>
    setStores[kind](s => patchPreset(s, s.activeId, patch))

  const handleFirstInteraction = () => {
    if (initRef.current) return;
    initRef.current = true;
    unlockAudio();
    requestNotificationPermission();
  };

  function switchMode(next) {
    if (next === mode || prevMode) return // ignore same-mode or mid-transition
    setMenu(null)
    const isBuilderTransition = next.startsWith('builder-') || mode.startsWith('builder-')
    if (isBuilderTransition) {
      setMode(next) // instant, no slide animation
      return
    }
    setPrevMode(mode)
    setMode(next)
  }

  // ── Preset menu ──

  function anchorFor(kind) {
    const btn = btnRefs.current[kind]
    if (!btn || !pillRef.current) return 0
    return btn.getBoundingClientRect().left - pillRef.current.getBoundingClientRect().left
  }

  const openMenu  = (kind) => { clearTimeout(closeTimer.current); setMenu({ kind, left: anchorFor(kind) }) }
  const cancelClose = () => clearTimeout(closeTimer.current)
  const scheduleClose = () => {
    clearTimeout(openTimer.current)
    closeTimer.current = setTimeout(() => setMenu(null), HOVER_CLOSE_MS)
  }
  // Gated to real mice by every caller: on touch a tap also synthesises a
  // pointerenter with no matching leave, which would latch the menu open.
  const scheduleOpen = (kind) => {
    clearTimeout(closeTimer.current); clearTimeout(openTimer.current)
    openTimer.current = setTimeout(() => openMenu(kind), HOVER_OPEN_MS)
  }

  // Tapping outside closes it — pointerdown rather than mousedown so touch
  // gets it on contact instead of waiting for the synthesised mouse event.
  useEffect(() => {
    if (!menu) return
    const onDown = (e) => { if (pillRef.current && !pillRef.current.contains(e.target)) setMenu(null) }
    const onKey  = (e) => { if (e.key === 'Escape') setMenu(null) }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey) }
  }, [menu])

  // Picking a preset activates it, and carries you into its mode if you were
  // in the other one — so "start the short evening routine" is a single click
  // from work mode.
  function choosePreset(kind, id) {
    setMenu(null)
    if (kind === 'work') {
      // The cycle length changes underneath the diamonds, so the stored block
      // count would point at a block that no longer exists — same reason
      // toggling micro breaks resets it.
      if (id !== work.activeId) clearSession()
      setWork(s => selectPreset(s, id))
    } else {
      setEvening(s => selectPreset(s, id))
    }
    if (mode !== kind) switchMode(kind)
  }

  const isBuilder = mode.startsWith('builder-')

  // The task segment belongs to work mode only, and stays fused into the same
  // pill as WORK/EVENING/EDIT — sharing its border and background rather than
  // floating beside it. Its width is fixed rather than fitted to the text so
  // a budget ticking under an hour — seven characters down to five — does not
  // shuffle the buttons beside it.
  const isNarrow = width < 600
  const TASK_SEG_W = isNarrow ? 68 : 104
  const showTask = mode === 'work' && !!taskStatus?.active
  // The coloured fill never spans the whole window: a rail runs down one side
  // of it — the left in work mode, the right in evening — so centring on the
  // window always lands off-centre within the colour actually on screen. The
  // anchor is nudged by half the rail to sit in the middle of the fill, the
  // same thing evening mode does for its own bottom controls.
  //
  // This is what the old hardcoded ±23 was (half a 45px desktop rail edge);
  // it was simply never updated for the narrower rail on a phone. Mirrors the
  // railW / fill-edge values in PomodoroMode and EveningMode.
  const RAIL_W = isNarrow ? 44 : 52
  const railEdge = RAIL_W - (isNarrow ? 6 : 7)
  // No pill-width term here, and none needed: translateX(-50%) below centres
  // the pill on this anchor whatever its own width, so it stays centred as
  // the task segment grows and collapses.
  const pillShift = (mode === 'evening' ? -railEdge : railEdge) / 2
  // Countdown off → the chip shows just the word TASK, revealing the time only
  // while hovered or freshly tapped.
  const taskNumbers = !!taskStatus?.showNumbers
  const showTaskTime = taskNumbers || taskHover || taskTapped
  // Never brighter than the switcher's own active label — the same
  // rgba(255,255,255,0.75) WORK uses when selected — so the chip reads as
  // part of the same control rather than a louder one bolted beside it.
  const MODE_TEXT = 'rgba(255,255,255,0.75)'

  function onExitEnd() {
    setPrevMode(null)
  }

  const wrapperStyle = { position: 'absolute', inset: 0, willChange: 'transform, opacity' }

  // Switching preset remounts the mode. Both modes copy config into once-only
  // state initialisers, so without this they would keep running the old
  // preset's numbers and then write them back over the new one.
  const renderMode = (id) => id === 'work'
    ? <PomodoroMode key={`${activeWork.id}:${rev.work}`} config={activeWork} patchPreset={patchActive('work')} onTaskStatus={setTaskStatus} onRuntime={onWorkRuntime} remoteSession={remoteSession} />
    : <EveningMode key={`${activeEvening.id}:${rev.evening}`} config={activeEvening} patchPreset={patchActive('evening')} onRuntime={onEveningRuntime} />

  return (
    <div onClick={handleFirstInteraction} style={{ position: 'relative', height: '100vh', overflow: 'hidden', background: '#0f0e0c' }}>
      <style dangerouslySetInnerHTML={{ __html: slideKeyframes }} />

      {/* Exiting component — fades out */}
      {prevMode && (
        <div
          style={{
            ...wrapperStyle,
            animation: `fadeOut ${EXIT_ANIM}`,
          }}
          onAnimationEnd={onExitEnd}
        >
          {renderMode(prevMode)}
        </div>
      )}

      {/* Active component — fades in */}
      <div
        style={{
          ...wrapperStyle,
          opacity: prevMode ? 0 : 1,
          animation: prevMode
            ? `fadeIn ${ENTER_ANIM}`
            : 'none',
        }}
      >
        {mode === 'work' && renderMode('work')}
        {mode === 'evening' && renderMode('evening')}
        {mode === 'builder-work' && <PomodoroBuilder key={work.activeId} store={work} setStore={setWork} sync={sync} onBack={() => switchMode('work')} />}
        {mode === 'builder-evening' && <EveningBuilder key={evening.activeId} store={evening} setStore={setEvening} sync={sync} onBack={() => switchMode('evening')} />}
      </div>

      {/* Floating mode switcher pill — fixed, above both modes (hidden in
          builder). The task segment is a flex child of the bordered, clipped
          row — fused to WORK/EVENING/EDIT, not a separate element beside it.
          The preset menu hangs outside that row: the clipping that keeps the
          task segment's slide tidy would otherwise guillotine it. */}
      {!isBuilder && (
        <div ref={pillRef} style={{
          position: 'fixed',
          top: '0.85rem',
          left: `calc(50% + ${pillShift}px)`,
          transform: 'translateX(-50%)',
          transition: 'left 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex: 50,
        }}>
        <div style={{
          display: 'flex',
          background: 'rgba(15,14,12,0.88)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: 6,
          overflow: 'hidden',
        }}>
          {/* Task segment — collapses to nothing outside work mode, animating
              in step with the pill's own slide. Its background is the only
              thing the countdown toggle changes: transparent (so the shared
              pill background shows through and it reads as fused) with
              numbers on, solid work colour (so it reads as its own indicator)
              with them off. */}
          {taskStatus && (
            <div style={{
              maxWidth: showTask ? TASK_SEG_W : 0,
              opacity: showTask ? 1 : 0,
              overflow: 'hidden',
              flexShrink: 0,
              transition: 'max-width 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s',
            }}>
              {/* Pointer events, gated to real mice: a tap on touch also
                  synthesises a mouseenter with no matching mouseleave, which
                  would latch taskHover permanently on and mask the tap's own
                  self-clearing timer below. */}
              <div
                onPointerEnter={(e) => { if (e.pointerType === 'mouse') setTaskHover(true) }}
                onPointerLeave={(e) => { if (e.pointerType === 'mouse') setTaskHover(false) }}
                onClick={taskNumbers ? undefined : peekTask}
                style={{
                  position: 'relative',
                  width: TASK_SEG_W,
                  height: '100%',
                  borderRight: '1px solid rgba(255,255,255,0.1)',
                  background: taskNumbers ? 'transparent' : taskStatus.color,
                  transition: 'background 0.4s',
                  cursor: taskNumbers ? 'default' : 'pointer',
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                {/* TASK — on a phone there's no room to share the segment
                    with the numbers, so instead of sliding aside it
                    crossfades with them in the same centred spot. On desktop
                    it still slides to the left edge, opening the right side
                    for the numbers without resizing anything. Either way,
                    numbers-on mode holds showTaskTime true permanently, so
                    TASK stays faded out for as long as the toggle is on. */}
                <span style={{
                  position: 'absolute', top: '50%',
                  ...(isNarrow
                    ? { left: '50%', transform: 'translate(-50%, -50%)' }
                    : { left: showTaskTime ? '0.6rem' : '50%', transform: showTaskTime ? 'translateY(-50%)' : 'translate(-50%, -50%)' }),
                  transition: isNarrow
                    ? 'opacity 0.25s'
                    : 'left 0.35s cubic-bezier(0.16, 1, 0.3, 1), transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                  opacity: isNarrow && showTaskTime ? 0 : 1,
                  fontSize: '0.5rem', letterSpacing: '0.14em',
                  color: MODE_TEXT, whiteSpace: 'nowrap',
                }}>TASK</span>
                {/* The digits pick up the work colour only in numbers-on mode,
                    tying the readout back to the phase it's timing. On the
                    solid-blue peek chip they stay on MODE_TEXT instead — work
                    blue on a work-blue fill would vanish. */}
                <span style={{
                  position: 'absolute', top: '50%',
                  ...(isNarrow
                    ? { left: '50%', transform: 'translate(-50%, -50%)' }
                    : { right: '0.6rem', transform: 'translateY(-50%)' }),
                  fontSize: '0.6rem', letterSpacing: '0.04em',
                  color: taskNumbers ? taskStatus.color : MODE_TEXT,
                  opacity: showTaskTime ? 1 : 0,
                  transition: 'opacity 0.25s, color 0.25s',
                  whiteSpace: 'nowrap',
                }}>{taskStatus.time}</span>
              </div>
            </div>
          )}

          {[
            { id: 'work',    label: 'WORK'    },
            { id: 'evening', label: 'EVENING' },
            { id: 'edit',    label: 'EDIT'    },
          ].map(({ id, label }) => {
            const isMode = id !== 'edit'
            return (
            <button
              key={id}
              ref={isMode ? (el => { btnRefs.current[id] = el }) : undefined}
              // Hover opens that mode's presets on a mouse. On touch there is
              // no hover, so the tap below carries it instead.
              onPointerEnter={isMode ? (e) => { if (e.pointerType === 'mouse') scheduleOpen(id) } : undefined}
              onPointerLeave={isMode ? (e) => { if (e.pointerType === 'mouse') scheduleClose() } : undefined}
              onClick={() => {
                if (id === 'edit') { switchMode(mode === 'evening' ? 'builder-evening' : 'builder-work'); return }
                // Tapping the mode you are already in was a dead gesture, so
                // it opens the preset list — the touch path to the menu.
                // Tapping the other mode still just switches, one tap.
                if (id === mode) setMenu(m => (m?.kind === id ? null : { kind: id, left: anchorFor(id) }))
                else switchMode(id)
              }}
              style={{
                padding: '0.42rem 0.95rem',
                border: 'none',
                background: menu?.kind === id ? 'rgba(255,255,255,0.06)' : 'transparent',
                cursor: id === mode && id !== 'edit' ? 'pointer' : id === mode ? 'default' : 'pointer',
                fontFamily: "'DM Mono', monospace",
                fontSize: '0.6rem',
                letterSpacing: '0.14em',
                color: id === 'edit' ? 'rgba(255,255,255,0.35)'
                  : id === mode ? MODE_TEXT : 'rgba(255,255,255,0.22)',
                borderLeft: id === 'edit' ? '1px solid rgba(255,255,255,0.1)' : 'none',
                transition: 'color 0.25s, background 0.25s',
              }}
            >
              {label}
            </button>
          )})}
        </div>

        {menu && (
          <PresetMenu
            kind={menu.kind}
            left={menu.left}
            store={stores[menu.kind]}
            isCurrentMode={mode === menu.kind}
            onPick={(id) => choosePreset(menu.kind, id)}
            onEdit={() => switchMode(menu.kind === 'work' ? 'builder-work' : 'builder-evening')}
            onPointerEnter={cancelClose}
            onPointerLeave={scheduleClose}
          />
        )}
        </div>
      )}

      {/* Offered, never taken: a reload nobody asked for would discard a
          running session and whatever is half-typed into the builder. */}
      {update.needRefresh && (
        <UpdatePrompt onReload={update.updateApp} onDismiss={update.dismiss} shift={isBuilder ? 0 : pillShift} />
      )}
    </div>
  )
}

// The preset list that drops out of WORK / EVENING. Active preset first with a
// diamond against it — the same marker the cycle indicator uses — so the one
// you are running reads at a glance without having to match names.
function PresetMenu({ kind, left, store, isCurrentMode, onPick, onEdit, onPointerEnter, onPointerLeave }) {
  const active = store.presets.find(p => p.id === store.activeId)
  const rest = store.presets.filter(p => p.id !== store.activeId)
  const ordered = active ? [active, ...rest] : rest
  const accent = kind === 'work' ? '#4A90D9' : '#b06878'

  return (
    <div
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      style={{
        position: 'absolute',
        top: '100%',
        left,
        // Transparent padding rather than a margin: it looks like a gap but
        // keeps the hover area continuous, so the pointer can cross from the
        // button into the list without passing over dead ground.
        paddingTop: 6,
        zIndex: 60,
      }}
    >
      <div style={{
        background: 'rgba(15,14,12,0.97)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 6,
        padding: '0.3rem 0',
        minWidth: 168,
        maxWidth: 260,
        backdropFilter: 'blur(8px)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        fontFamily: "'DM Mono', monospace",
      }}>
        <div style={{ fontSize: '0.5rem', letterSpacing: '0.14em', color: '#4a4640', padding: '0.15rem 0.75rem 0.35rem' }}>
          {kind === 'work' ? 'WORK PRESETS' : 'EVENING PRESETS'}
        </div>
        {ordered.map(p => {
          const isActive = p.id === store.activeId && isCurrentMode
          return (
            <button
              key={p.id}
              onClick={() => onPick(p.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.45rem',
                width: '100%', textAlign: 'left',
                padding: '0.4rem 0.75rem',
                border: 'none', background: 'transparent', cursor: 'pointer',
                fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.04em',
                color: isActive ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.45)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontSize: '0.5rem', color: isActive ? accent : 'transparent', flexShrink: 0 }}>◆</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
            </button>
          )
        })}
        <button
          onClick={onEdit}
          style={{
            display: 'block', width: '100%', textAlign: 'left',
            padding: '0.4rem 0.75rem 0.3rem',
            marginTop: '0.2rem', borderTop: '1px solid rgba(255,255,255,0.07)',
            borderLeft: 'none', borderRight: 'none', borderBottom: 'none',
            background: 'transparent', cursor: 'pointer',
            fontFamily: "'DM Mono', monospace", fontSize: '0.55rem', letterSpacing: '0.1em',
            color: 'rgba(255,255,255,0.3)',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          EDIT PRESETS
        </button>
      </div>
    </div>
  )
}
