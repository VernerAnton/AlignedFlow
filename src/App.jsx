import { useState, useEffect, useRef } from 'react'
import PomodoroMode, { useWindowWidth } from './PomodoroMode'
import EveningMode from './EveningMode'
import EveningBuilder from './EveningBuilder'
import PomodoroBuilder from './PomodoroBuilder'
import { loadConfig, saveConfig } from './dataStore'
import { unlockAudio } from './sounds'
import { requestNotificationPermission } from './notifications'

const slideKeyframes = `
@keyframes fadeOut   { from { opacity: 1; } to { opacity: 0; } }
@keyframes fadeIn    { from { opacity: 0; } to { opacity: 1; } }
`

const EXIT_ANIM  = '0.35s cubic-bezier(0.4, 0, 0.6, 1) forwards'
const ENTER_ANIM = '0.45s cubic-bezier(0.0, 0.0, 0.2, 1) 0.15s forwards' // slight delay so exit leads

export default function App() {
  const [mode, setMode]         = useState('work')
  const [prevMode, setPrevMode] = useState(null)
  const [config, setConfig]     = useState(() => loadConfig())
  // Work mode publishes its task budget here so the switcher pill can carry it
  // as a segment. Null until work mode has reported once.
  const [taskStatus, setTaskStatus] = useState(null)
  // With the countdown hidden the segment is a bare bar, so it can be hovered
  // or tapped to read the time. A tap self-clears; a hover ends on its own.
  const [taskHover, setTaskHover] = useState(false)
  const [taskTapped, setTaskTapped] = useState(false)
  const tapTimer = useRef(null)
  const width = useWindowWidth()
  const initRef = useRef(false)

  useEffect(() => () => clearTimeout(tapTimer.current), [])

  function peekTask() {
    setTaskTapped(true)
    clearTimeout(tapTimer.current)
    tapTimer.current = setTimeout(() => setTaskTapped(false), 2500)
  }

  useEffect(() => { saveConfig(config) }, [config])

  const handleFirstInteraction = () => {
    if (initRef.current) return;
    initRef.current = true;
    unlockAudio();
    requestNotificationPermission();
  };

  function switchMode(next) {
    if (next === mode || prevMode) return // ignore same-mode or mid-transition
    const isBuilderTransition = next.startsWith('builder-') || mode.startsWith('builder-')
    if (isBuilderTransition) {
      setMode(next) // instant, no slide animation
      return
    }
    setPrevMode(mode)
    setMode(next)
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
  // Half the segment's width is subtracted back out of the pill's own centring
  // offset when it's showing, so the row's growth is invisible to the three
  // buttons — they sit at the exact same pixels whether the segment is there
  // or not.
  const pillShift = (mode === 'evening' ? -23 : 23) - (showTask ? TASK_SEG_W / 2 : 0)
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
          {prevMode === 'work' ? <PomodoroMode config={config.pomodoro} setConfig={setConfig} /> : <EveningMode config={config.evening} setConfig={setConfig} />}
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
        {mode === 'work' && <PomodoroMode config={config.pomodoro} setConfig={setConfig} onTaskStatus={setTaskStatus} />}
        {mode === 'evening' && <EveningMode config={config.evening} setConfig={setConfig} />}
        {mode === 'builder-work' && <PomodoroBuilder config={config} setConfig={setConfig} onBack={() => switchMode('work')} />}
        {mode === 'builder-evening' && <EveningBuilder config={config} setConfig={setConfig} onBack={() => switchMode('evening')} />}
      </div>

      {/* Floating mode switcher pill — fixed, above both modes (hidden in
          builder). The task segment is a flex child of this same bordered,
          clipped row — fused to WORK/EVENING/EDIT, not a separate element
          beside it. */}
      {!isBuilder && (
        <div style={{
          position: 'fixed',
          top: '0.85rem',
          left: `calc(50% + ${pillShift}px)`,
          transform: 'translateX(-50%)',
          transition: 'left 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          zIndex: 50,
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
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => {
                if (id === 'edit') switchMode(mode === 'evening' ? 'builder-evening' : 'builder-work')
                else switchMode(id)
              }}
              style={{
                padding: '0.42rem 0.95rem',
                border: 'none',
                background: 'transparent',
                cursor: id === mode ? 'default' : 'pointer',
                fontFamily: "'DM Mono', monospace",
                fontSize: '0.6rem',
                letterSpacing: '0.14em',
                color: id === 'edit' ? 'rgba(255,255,255,0.35)'
                  : id === mode ? MODE_TEXT : 'rgba(255,255,255,0.22)',
                borderLeft: id === 'edit' ? '1px solid rgba(255,255,255,0.1)' : 'none',
                transition: 'color 0.25s',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
