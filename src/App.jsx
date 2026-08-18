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

  // The task segment belongs to work mode only. Its width is fixed rather than
  // fitted to the text so a budget ticking under an hour — seven characters
  // down to five — does not shuffle the buttons beside it.
  const isNarrow = width < 600
  const TASK_SEG_W = isNarrow ? 68 : 104
  const showTask = mode === 'work' && !!taskStatus?.active
  // Nothing is compensated for here: the pill is centred as a whole, so it
  // stays centred whether or not the task segment is part of it.
  const pillShift = mode === 'evening' ? -23 : 23
  // Countdown hidden → the segment is a draining bar, revealing the time only
  // while hovered or freshly tapped.
  const taskNumbers = !!taskStatus?.showNumbers
  const showTaskTime = taskNumbers || taskHover || taskTapped

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

      {/* Floating mode switcher pill — fixed, above both modes (hidden in builder) */}
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
          {/* Task budget — collapses to nothing outside work mode, animating in
              step with the pill's own slide. */}
          {taskStatus && (
            <div style={{
              maxWidth: showTask ? TASK_SEG_W : 0,
              opacity: showTask ? 1 : 0,
              overflow: 'hidden',
              flexShrink: 0,
              transition: 'max-width 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s',
            }}>
              <div
                onMouseEnter={() => setTaskHover(true)}
                onMouseLeave={() => setTaskHover(false)}
                onClick={taskNumbers ? undefined : peekTask}
                style={{
                  position: 'relative',
                  width: TASK_SEG_W,
                  padding: isNarrow ? '0.42rem 0.5rem' : '0.42rem 0.7rem',
                  borderRight: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isNarrow ? 'center' : 'space-between',
                  gap: 6,
                  fontFamily: "'DM Mono', monospace",
                  whiteSpace: 'nowrap',
                  cursor: taskNumbers ? 'default' : 'pointer',
                }}
              >
                {/* The bar is the whole readout when the countdown is off — no
                    bar alongside the numbers, which was saying it twice. */}
                {!taskNumbers && (
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: `${taskStatus.remaining}%`,
                    background: taskStatus.color, opacity: 0.3,
                    transition: 'width 0.6s linear',
                  }} />
                )}
                {/* The label is the first thing to go on a phone. */}
                {!isNarrow && (
                  <span style={{ position: 'relative', fontSize: '0.5rem', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.28)' }}>TASK</span>
                )}
                {/* Kept in the layout even when hidden, so revealing the time
                    never changes the pill's width. */}
                <span style={{
                  position: 'relative',
                  fontSize: '0.6rem', letterSpacing: '0.04em',
                  color: taskStatus.color,
                  opacity: showTaskTime ? 1 : 0,
                  transition: 'opacity 0.25s',
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
                  : id === mode ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.22)',
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
