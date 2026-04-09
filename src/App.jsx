import { useState, useEffect, useRef } from 'react'
import PomodoroMode from './PomodoroMode'
import EveningMode from './EveningMode'
import EveningBuilder from './EveningBuilder'
import PomodoroBuilder from './PomodoroBuilder'
import { loadConfig, saveConfig } from './dataStore'
import { unlockAudio } from './sounds'
import { requestNotificationPermission } from './notifications'

const slideKeyframes = `
@keyframes slideOutLeft  { from { transform: translateX(0);    opacity: 1; } to { transform: translateX(-20%); opacity: 0; } }
@keyframes slideOutRight { from { transform: translateX(0);    opacity: 1; } to { transform: translateX(20%);  opacity: 0; } }
@keyframes slideInRight  { from { transform: translateX(20%);  opacity: 0; } to { transform: translateX(0);    opacity: 1; } }
@keyframes slideInLeft   { from { transform: translateX(-20%); opacity: 0; } to { transform: translateX(0);    opacity: 1; } }
`

const EXIT_ANIM  = '0.3s cubic-bezier(0.4, 0, 0.6, 1) forwards'   // ease-in: decisive exit
const ENTER_ANIM = '0.42s cubic-bezier(0.0, 0.0, 0.2, 1) forwards' // ease-out: gentle landing

export default function App() {
  const [mode, setMode]         = useState('work')
  const [prevMode, setPrevMode] = useState(null)
  const [slideDir, setSlideDir] = useState(null) // 'left' | 'right'
  const [config, setConfig]     = useState(() => loadConfig())
  const initRef = useRef(false)

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
    setSlideDir(next === 'evening' ? 'left' : 'right')
    setPrevMode(mode)
    setMode(next)
  }

  const isBuilder = mode.startsWith('builder-')

  function onExitEnd() {
    setPrevMode(null)
    setSlideDir(null)
  }

  const wrapperStyle = { position: 'absolute', inset: 0, willChange: 'transform, opacity' }

  return (
    <div onClick={handleFirstInteraction} style={{ position: 'relative', height: '100vh', overflow: 'hidden', background: '#0f0e0c' }}>
      <style dangerouslySetInnerHTML={{ __html: slideKeyframes }} />

      {/* Exiting component — slides out */}
      {prevMode && (
        <div
          style={{
            ...wrapperStyle,
            animation: `slideOut${slideDir === 'left' ? 'Left' : 'Right'} ${EXIT_ANIM}`,
          }}
          onAnimationEnd={onExitEnd}
        >
          {prevMode === 'work' ? <PomodoroMode config={config.pomodoro} /> : <EveningMode config={config.evening} />}
        </div>
      )}

      {/* Active component — slides in from opposite side, then stays put */}
      <div
        style={{
          ...wrapperStyle,
          animation: prevMode
            ? `slideIn${slideDir === 'left' ? 'Right' : 'Left'} ${ENTER_ANIM}`
            : 'none',
        }}
      >
        {mode === 'work' && <PomodoroMode config={config.pomodoro} />}
        {mode === 'evening' && <EveningMode config={config.evening} />}
        {mode === 'builder-work' && <PomodoroBuilder config={config} setConfig={setConfig} onBack={() => switchMode('work')} />}
        {mode === 'builder-evening' && <EveningBuilder config={config} setConfig={setConfig} onBack={() => switchMode('evening')} />}
      </div>

      {/* Floating mode switcher pill — fixed, above both modes (hidden in builder) */}
      {!isBuilder && (
        <div style={{
          position: 'fixed',
          top: '0.85rem',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          zIndex: 50,
          background: 'rgba(15,14,12,0.88)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: 6,
          overflow: 'hidden',
        }}>
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
