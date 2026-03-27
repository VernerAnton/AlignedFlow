import { useState } from 'react'
import PomodoroMode from './PomodoroMode'
import EveningMode from './EveningMode'

const TAB_H = 36

const TABS = [
  { id: 'work',    label: 'WORK',    color: '#4A90D9' },
  { id: 'evening', label: 'EVENING', color: '#c4956a' },
]

export default function App() {
  const [mode, setMode] = useState('work')

  return (
    <div style={{ height: '100vh', background: '#0f0e0c', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

      {/* Mode tab bar */}
      <div style={{
        flexShrink: 0,
        height: TAB_H,
        display: 'flex',
        background: 'rgba(15,14,12,0.97)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        zIndex: 100,
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setMode(tab.id)}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontFamily: "'DM Mono', monospace",
              fontSize: '0.55rem',
              letterSpacing: '0.2em',
              color: mode === tab.id ? tab.color : 'rgba(255,255,255,0.18)',
              borderBottom: mode === tab.id
                ? `1px solid ${tab.color}`
                : '1px solid transparent',
              transition: 'color 0.25s, border-color 0.25s',
              paddingBottom: 1,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Mode content — fills remaining height */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {mode === 'work'    && <PomodoroMode />}
        {mode === 'evening' && <EveningMode />}
      </div>

    </div>
  )
}
