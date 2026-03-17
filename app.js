// =====================================================
// AlignedFlow — app.js
// Main application logic: timer state machine, UI, settings
// =====================================================

import { playWorkSound, playShortBreakSound, playLongBreakSound, playDoneSound, unlockAudio } from './sounds.js';

// ── Constants ──
const STATE_KEY    = 'alignedflow_state';
const SETTINGS_KEY = 'alignedflow_settings';

const PHASES = { WORK: 'work', SHORT_BREAK: 'shortBreak', LONG_BREAK: 'longBreak' };

const DEFAULT_SETTINGS = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLongBreak: 4,
  muted: false,
};

const SETTING_LIMITS = {
  workMinutes:             { min: 1,  max: 120 },
  shortBreakMinutes:       { min: 3,  max: 60  },
  longBreakMinutes:        { min: 10, max: 120 },
  sessionsBeforeLongBreak: { min: 1,  max: 4   },
};

// ── DOM References ──
const $ = (id) => document.getElementById(id);

const dom = {
  // Modes
  mode1:          $('mode-1'),
  mode2:          $('mode-2'),
  modeTab1:       $('mode-tab-1'),
  modeTab2:       $('mode-tab-2'),

  // Header
  muteBtn:        $('mute-btn'),
  settingsBtn:    $('settings-btn'),

  // Timer display
  phaseBadge:     $('phase-badge'),
  sessionIndicator: $('session-indicator'),
  ringProgress:   $('ring-progress'),
  timerDigits:    $('timer-digits'),
  timerLabel:     $('timer-label'),

  // Controls
  startBtn:       $('start-btn'),
  stopBtn:        $('stop-btn'),
  resetBtn:       $('reset-btn'),

  // Phase content panels
  workContent:       $('work-content'),
  shortBreakContent: $('short-break-content'),
  longBreakContent:  $('long-break-content'),

  // Work phase specific
  postureSetBtn:  $('posture-set-btn'),

  // Short break specific
  microResetDoneBtn: $('micro-reset-done-btn'),

  // Long break specific
  dcfDoneBtn:     $('dcf-done-btn'),
  pecDoneBtn:     $('pec-done-btn'),

  // Posture reminder
  postureReminder: $('posture-reminder'),

  // Settings
  settingsOverlay: $('settings-overlay'),
  settingsPanel:   $('settings-panel'),
  settingsCloseBtn: $('settings-close-btn'),
  settingsSaveBtn:  $('settings-save-btn'),
  inputWork:        $('input-work'),
  inputShortBreak:  $('input-short-break'),
  inputLongBreak:   $('input-long-break'),
  inputSessions:    $('input-sessions'),
};

// ── SVG Ring Setup ──
const RING_R = 88;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R;

function initRing() {
  const progress = dom.ringProgress;
  progress.setAttribute('stroke-dasharray', RING_CIRCUMFERENCE);
  progress.setAttribute('stroke-dashoffset', 0);
}

function setRingProgress(fraction) {
  // fraction 0 = empty, 1 = full
  const offset = RING_CIRCUMFERENCE * (1 - Math.max(0, Math.min(1, fraction)));
  dom.ringProgress.setAttribute('stroke-dashoffset', offset);
}

// ── State ──
let appState = null;  // live state object
let settings = null;  // live settings object
let tickInterval = null;
let swRegistration = null;

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY));
    settings = Object.assign({}, DEFAULT_SETTINGS, saved);
  } catch {
    settings = { ...DEFAULT_SETTINGS };
  }
  // Clamp all values
  for (const [key, { min, max }] of Object.entries(SETTING_LIMITS)) {
    settings[key] = Math.max(min, Math.min(max, Number(settings[key]) || DEFAULT_SETTINGS[key]));
  }
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STATE_KEY));
    if (saved && saved.phaseEndTime) {
      appState = saved;
      return;
    }
  } catch {}
  appState = buildInitialState();
}

function buildInitialState() {
  return {
    isRunning: false,
    phase: PHASES.WORK,
    sessionCount: 1,
    phaseEndTime: Date.now() + settings.workMinutes * 60000,
    postureSet: false,
    dcfDone: false,
    pecDone: false,
  };
}

function saveState() {
  localStorage.setItem(STATE_KEY, JSON.stringify(appState));
}

// ── Phase Helpers ──
function phaseDurationMs(phase) {
  switch (phase) {
    case PHASES.WORK:        return settings.workMinutes * 60000;
    case PHASES.SHORT_BREAK: return settings.shortBreakMinutes * 60000;
    case PHASES.LONG_BREAK:  return settings.longBreakMinutes * 60000;
  }
}

function nextPhase(currentPhase, sessionCount) {
  if (currentPhase === PHASES.WORK) {
    // After work: short break (unless this was the last session before long break)
    if (sessionCount >= settings.sessionsBeforeLongBreak) {
      return { phase: PHASES.LONG_BREAK, sessionCount };
    }
    return { phase: PHASES.SHORT_BREAK, sessionCount };
  }
  if (currentPhase === PHASES.SHORT_BREAK) {
    return { phase: PHASES.WORK, sessionCount: sessionCount + 1 };
  }
  if (currentPhase === PHASES.LONG_BREAK) {
    // After long break: restart cycle
    return { phase: PHASES.WORK, sessionCount: 1 };
  }
}

function notificationText(phase) {
  switch (phase) {
    case PHASES.WORK:        return { title: 'Work Session', body: 'Time to focus. Set your posture and go.' };
    case PHASES.SHORT_BREAK: return { title: 'Micro Reset', body: 'Quick break — do your Reset A, B and stretch.' };
    case PHASES.LONG_BREAK:  return { title: 'Long Break', body: 'DCF wall protocol + pec minor stretch.' };
  }
}

// ── Advance Phase ──
function advancePhase() {
  const { phase, sessionCount } = appState;
  const { phase: np, sessionCount: nsc } = nextPhase(phase, sessionCount);

  appState.phase = np;
  appState.sessionCount = nsc;
  appState.phaseEndTime = Date.now() + phaseDurationMs(np);
  appState.postureSet = false;
  appState.dcfDone = false;
  appState.pecDone = false;
  saveState();

  // Play sound
  switch (np) {
    case PHASES.WORK:        playWorkSound(settings.muted); break;
    case PHASES.SHORT_BREAK: playShortBreakSound(settings.muted); break;
    case PHASES.LONG_BREAK:  playLongBreakSound(settings.muted); break;
  }

  // Show notification (from main thread if visible, SW handles background)
  showNotificationForPhase(np);

  // Schedule next SW notification
  scheduleSwNotification(np);

  // Update UI
  renderPhase();
}

// ── Recovery from Background ──
// If multiple phases were missed while page was in background, fast-forward to current state
function recoverFromBackground() {
  if (!appState.isRunning) return;

  let safety = 0;
  while (Date.now() >= appState.phaseEndTime && safety++ < 20) {
    const { phase, sessionCount } = appState;
    const { phase: np, sessionCount: nsc } = nextPhase(phase, sessionCount);
    appState.phase = np;
    appState.sessionCount = nsc;
    appState.phaseEndTime = Date.now() + phaseDurationMs(np);
    appState.postureSet = false;
    appState.dcfDone = false;
    appState.pecDone = false;
  }
  saveState();
}

// ── Timer Tick ──
function tick() {
  if (!appState.isRunning) return;

  const remaining = appState.phaseEndTime - Date.now();
  if (remaining <= 0) {
    advancePhase();
    return;
  }

  updateTimerDisplay(remaining);
}

function updateTimerDisplay(remainingMs) {
  const totalMs = phaseDurationMs(appState.phase);
  const secs = Math.max(0, Math.ceil(remainingMs / 1000));
  const mins = Math.floor(secs / 60);
  const s    = secs % 60;
  dom.timerDigits.textContent = `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  setRingProgress(remainingMs / totalMs);
}

// ── Service Worker Notification Scheduling ──
function scheduleSwNotification(phase) {
  if (!swRegistration || !swRegistration.active) return;
  const delay = appState.phaseEndTime - Date.now();
  const { phase: np } = nextPhase(phase, appState.sessionCount);
  const { title, body } = notificationText(np);

  swRegistration.active.postMessage({
    type: 'SCHEDULE_NOTIFICATION',
    delay: Math.max(0, delay),
    title,
    body,
    tag: 'alignedflow-transition',
  });
}

function cancelSwNotification() {
  if (!swRegistration || !swRegistration.active) return;
  swRegistration.active.postMessage({ type: 'CANCEL_NOTIFICATION' });
}

// ── Web Notifications (foreground) ──
async function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
}

function showNotificationForPhase(phase) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  // Service worker handles display (works even if page is hidden)
  if (swRegistration && swRegistration.active) {
    const { title, body } = notificationText(phase);
    swRegistration.showNotification(title, {
      body,
      icon: '/icon.svg',
      tag: 'alignedflow-transition',
      renotify: true,
    });
  }
}

// ── Phase UI Rendering ──
function renderPhase() {
  const { phase, sessionCount, postureSet, dcfDone, pecDone } = appState;

  // Phase badge
  dom.phaseBadge.className = 'phase-badge';
  switch (phase) {
    case PHASES.WORK:
      dom.phaseBadge.classList.add('work');
      dom.phaseBadge.textContent = 'Work Session';
      dom.timerLabel.textContent = 'remaining';
      dom.ringProgress.className = 'ring-progress';
      break;
    case PHASES.SHORT_BREAK:
      dom.phaseBadge.classList.add('short-break');
      dom.phaseBadge.textContent = 'Micro Reset';
      dom.timerLabel.textContent = 'break';
      dom.ringProgress.className = 'ring-progress short-break';
      break;
    case PHASES.LONG_BREAK:
      dom.phaseBadge.classList.add('long-break');
      dom.phaseBadge.textContent = 'Long Break';
      dom.timerLabel.textContent = 'break';
      dom.ringProgress.className = 'ring-progress long-break';
      break;
  }

  // Session indicator (only meaningful during work phase)
  if (phase === PHASES.WORK) {
    dom.sessionIndicator.textContent = `Session ${sessionCount} of ${settings.sessionsBeforeLongBreak}`;
    dom.sessionIndicator.style.visibility = 'visible';
  } else if (phase === PHASES.LONG_BREAK) {
    dom.sessionIndicator.textContent = 'Long Break';
    dom.sessionIndicator.style.visibility = 'visible';
  } else {
    dom.sessionIndicator.textContent = `Session ${sessionCount} of ${settings.sessionsBeforeLongBreak}`;
    dom.sessionIndicator.style.visibility = 'visible';
  }

  // Show/hide phase panels
  dom.workContent.classList.toggle('hidden', phase !== PHASES.WORK);
  dom.shortBreakContent.classList.toggle('hidden', phase !== PHASES.SHORT_BREAK);
  dom.longBreakContent.classList.toggle('hidden', phase !== PHASES.LONG_BREAK);

  // Posture reminder persistence: hide on non-work phases, restore on work
  if (phase !== PHASES.WORK) {
    dom.postureReminder.classList.remove('visible');
    dom.postureReminder.classList.add('hidden');
  } else {
    // Restore posture reminder if it was previously set
    if (postureSet) {
      dom.postureReminder.classList.remove('hidden');
      requestAnimationFrame(() => dom.postureReminder.classList.add('visible'));
      // Restore button to completed state (e.g. after page reload)
      dom.postureSetBtn.innerHTML = '<span class="done-check">✓</span> Posture Set';
      dom.postureSetBtn.classList.add('completed');
      dom.postureSetBtn.disabled = true;
    } else {
      dom.postureReminder.classList.remove('visible');
      dom.postureReminder.classList.add('hidden');
      // Reset posture set button
      dom.postureSetBtn.textContent = 'Posture Set';
      dom.postureSetBtn.disabled = false;
      dom.postureSetBtn.classList.remove('completed');
    }
  }

  // Reset done button states if just entered break
  if (phase === PHASES.SHORT_BREAK) {
    resetDoneBtn(dom.microResetDoneBtn, 'Micro Reset Done');
  }
  if (phase === PHASES.LONG_BREAK) {
    resetDoneBtn(dom.dcfDoneBtn, 'DCF Done');
    resetDoneBtn(dom.pecDoneBtn, 'Pec Stretch Done');
    updateLongBreakDoneState(dcfDone, pecDone);
  }

  // Update timer display immediately
  const remaining = Math.max(0, appState.phaseEndTime - Date.now());
  updateTimerDisplay(remaining);

  // Update controls
  renderControls();
}

function renderControls() {
  const running = appState.isRunning;
  dom.startBtn.classList.toggle('hidden', running);
  dom.stopBtn.classList.toggle('hidden', !running);
  dom.resetBtn.classList.toggle('hidden', false);
}

// ── Done Buttons ──
function resetDoneBtn(btn, label) {
  btn.textContent = label;
  btn.classList.remove('completed', 'done-animate');
  btn.disabled = false;
}

function triggerDoneAnimation(btn, label) {
  btn.classList.add('done-animate', 'completed');
  btn.innerHTML = `<span class="done-check">✓</span> ${label}`;
  btn.disabled = true;

  // Ripple effect
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  ripple.style.cssText = `width:${size}px;height:${size}px;left:${rect.width/2 - size/2}px;top:${rect.height/2 - size/2}px`;
  btn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);

  playDoneSound(settings.muted);
}

function updateLongBreakDoneState(dcfDone, pecDone) {
  if (dcfDone) {
    dom.dcfDoneBtn.classList.add('completed');
    dom.dcfDoneBtn.innerHTML = `<span class="done-check">✓</span> DCF Done`;
    dom.dcfDoneBtn.disabled = true;
  }
  if (pecDone) {
    dom.pecDoneBtn.classList.add('completed');
    dom.pecDoneBtn.innerHTML = `<span class="done-check">✓</span> Pec Stretch Done`;
    dom.pecDoneBtn.disabled = true;
  }
}

// ── Start / Stop / Reset ──
function startTimer() {
  if (appState.isRunning) return;
  unlockAudio();
  requestNotificationPermission();

  appState.isRunning = true;
  // If starting fresh (timer was just reset), set the phase end time now
  if (!appState.phaseEndTime || appState.phaseEndTime <= Date.now()) {
    appState.phaseEndTime = Date.now() + phaseDurationMs(appState.phase);
  }
  saveState();

  // Play the sound for current phase
  switch (appState.phase) {
    case PHASES.WORK:        playWorkSound(settings.muted); break;
    case PHASES.SHORT_BREAK: playShortBreakSound(settings.muted); break;
    case PHASES.LONG_BREAK:  playLongBreakSound(settings.muted); break;
  }

  scheduleSwNotification(appState.phase);
  startTick();
  renderControls();
}

function stopTimer() {
  appState.isRunning = false;
  saveState();
  cancelSwNotification();
  stopTick();
  renderControls();
}

function resetTimer() {
  stopTimer();
  appState = buildInitialState();
  saveState();
  renderPhase();
}

function startTick() {
  stopTick();
  tickInterval = setInterval(tick, 500); // 500ms for responsive display
}

function stopTick() {
  if (tickInterval) {
    clearInterval(tickInterval);
    tickInterval = null;
  }
}

// ── Settings UI ──
function openSettings() {
  dom.inputWork.value       = settings.workMinutes;
  dom.inputShortBreak.value = settings.shortBreakMinutes;
  dom.inputLongBreak.value  = settings.longBreakMinutes;
  dom.inputSessions.value   = settings.sessionsBeforeLongBreak;
  dom.settingsOverlay.classList.add('open');
}

function closeSettings() {
  dom.settingsOverlay.classList.remove('open');
}

function saveSettingsFromUI() {
  const workM  = clamp(parseInt(dom.inputWork.value, 10), 1, 120);
  const shortM = clamp(parseInt(dom.inputShortBreak.value, 10), 3, 60);
  const longM  = clamp(parseInt(dom.inputLongBreak.value, 10), 10, 120);
  const sess   = clamp(parseInt(dom.inputSessions.value, 10), 1, 4);

  settings.workMinutes             = workM;
  settings.shortBreakMinutes       = shortM;
  settings.longBreakMinutes        = longM;
  settings.sessionsBeforeLongBreak = sess;
  saveSettings();

  // Reflect inputs back (in case they were clamped)
  dom.inputWork.value       = workM;
  dom.inputShortBreak.value = shortM;
  dom.inputLongBreak.value  = longM;
  dom.inputSessions.value   = sess;

  closeSettings();

  // If currently running, update the session indicator only (don't cut current phase)
  renderPhase();
}

function clamp(val, min, max) {
  if (isNaN(val)) return min;
  return Math.max(min, Math.min(max, val));
}

// Stepper buttons for settings
function setupStepper(inputEl, key) {
  const { min, max } = SETTING_LIMITS[key];
  const wrap = inputEl.closest('.setting-input-wrap');

  wrap.querySelector('.stepper-dec').addEventListener('click', () => {
    const current = parseInt(inputEl.value, 10) || min;
    inputEl.value = Math.max(min, current - 1);
  });

  wrap.querySelector('.stepper-inc').addEventListener('click', () => {
    const current = parseInt(inputEl.value, 10) || min;
    inputEl.value = Math.min(max, current + 1);
  });

  inputEl.addEventListener('blur', () => {
    inputEl.value = clamp(parseInt(inputEl.value, 10), min, max);
  });
}

// ── Mute Toggle ──
function updateMuteUI() {
  dom.muteBtn.textContent = settings.muted ? '🔇' : '🔔';
  dom.muteBtn.title = settings.muted ? 'Unmute sounds' : 'Mute sounds';
  dom.muteBtn.classList.toggle('active', settings.muted);
}

// ── Mode Switching ──
function switchMode(mode) {
  const isMode1 = mode === 1;
  dom.mode1.classList.toggle('hidden', !isMode1);
  dom.mode2.classList.toggle('hidden', isMode1);
  dom.modeTab1.classList.toggle('active', isMode1);
  dom.modeTab2.classList.toggle('active', !isMode1);
}

// ── Service Worker Registration ──
async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    swRegistration = await navigator.serviceWorker.register('./sw.js');
    // Listen for messages from SW
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'PHASE_COMPLETE') {
        // SW triggered a phase complete (tab was backgrounded)
        if (appState.isRunning && Date.now() >= appState.phaseEndTime) {
          advancePhase();
        }
      }
    });
  } catch (err) {
    console.warn('Service worker registration failed:', err);
  }
}

// ── Visibility Change (resume from background) ──
function handleVisibilityChange() {
  if (document.visibilityState === 'visible') {
    loadState(); // Re-read localStorage (SW may have updated timing)
    if (appState.isRunning) {
      recoverFromBackground();
      renderPhase();
      if (appState.isRunning) {
        startTick();
        scheduleSwNotification(appState.phase);
      }
    }
  } else {
    stopTick(); // Don't waste resources when hidden; SW handles background
  }
}

// ── Posture Set Button ──
function handlePostureSet() {
  appState.postureSet = true;
  saveState();

  // Animate button to "done" state
  dom.postureSetBtn.innerHTML = `<span class="done-check">✓</span> Posture Set`;
  dom.postureSetBtn.classList.add('completed');
  dom.postureSetBtn.disabled = true;
  playDoneSound(settings.muted);

  // Show the collapsed reminder
  dom.postureReminder.classList.remove('hidden');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      dom.postureReminder.classList.add('visible');
    });
  });
}

// ── Event Listeners ──
function bindEvents() {
  // Mode tabs
  dom.modeTab1.addEventListener('click', () => switchMode(1));
  dom.modeTab2.addEventListener('click', () => switchMode(2));

  // Timer controls
  dom.startBtn.addEventListener('click', startTimer);
  dom.stopBtn.addEventListener('click', stopTimer);
  dom.resetBtn.addEventListener('click', resetTimer);

  // Posture set
  dom.postureSetBtn.addEventListener('click', handlePostureSet);

  // Short break done
  dom.microResetDoneBtn.addEventListener('click', function () {
    triggerDoneAnimation(this, 'Micro Reset Done');
  });

  // Long break done buttons
  dom.dcfDoneBtn.addEventListener('click', function () {
    appState.dcfDone = true;
    saveState();
    triggerDoneAnimation(this, 'DCF Done');
  });

  dom.pecDoneBtn.addEventListener('click', function () {
    appState.pecDone = true;
    saveState();
    triggerDoneAnimation(this, 'Pec Stretch Done');
  });

  // Mute toggle
  dom.muteBtn.addEventListener('click', () => {
    settings.muted = !settings.muted;
    saveSettings();
    updateMuteUI();
    // Unlock audio context on interaction
    unlockAudio();
  });

  // Settings
  dom.settingsBtn.addEventListener('click', openSettings);
  dom.settingsCloseBtn.addEventListener('click', closeSettings);
  dom.settingsSaveBtn.addEventListener('click', saveSettingsFromUI);
  dom.settingsOverlay.addEventListener('click', (e) => {
    if (e.target === dom.settingsOverlay) closeSettings();
  });

  // Settings steppers
  setupStepper(dom.inputWork, 'workMinutes');
  setupStepper(dom.inputShortBreak, 'shortBreakMinutes');
  setupStepper(dom.inputLongBreak, 'longBreakMinutes');
  setupStepper(dom.inputSessions, 'sessionsBeforeLongBreak');

  // Background/foreground handling
  document.addEventListener('visibilitychange', handleVisibilityChange);
}

// ── Init ──
async function init() {
  loadSettings();
  loadState();
  initRing();
  bindEvents();
  updateMuteUI();

  // Recover if we were running in background
  if (appState.isRunning) {
    recoverFromBackground();
    startTick();
  }

  renderPhase();

  // Register service worker (non-blocking)
  await registerServiceWorker();

  // Re-schedule SW notification if we're running
  if (appState.isRunning && swRegistration) {
    scheduleSwNotification(appState.phase);
  }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
