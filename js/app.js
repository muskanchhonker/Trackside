// ---------- Storage ----------
const STORE_KEY = 'c10k_progress_v1';

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return { completed: {}, settings: { voiceOn: true, voiceURI: null, rate: 1, wakeLock: true } };
}
function saveState() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}
let state = loadState();

// ---------- Voice coaching ----------
const ENCOURAGEMENTS = [
  "You've got this.", "Nice and steady.", "Strong pace, keep going.",
  "Breathe easy, shoulders relaxed.", "Halfway through this one.",
  "Great effort, keep it up.", "Stay with it.", "Looking strong.",
];

function pickEncouragement() {
  return ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
}

function segmentCue(seg) {
  if (seg.type === 'warmup') return `Warm up. ${fmtDuration(seg.seconds)} brisk walk.`;
  if (seg.type === 'cooldown') return `Cool down. Walk it out, well done.`;
  if (seg.type === 'walk') return `Walk. Recover your breath.`;
  if (seg.type === 'run') {
    if (seg.intensity === 'tempo') return `Pick it up. Tempo pace for ${fmtDuration(seg.seconds)}.`;
    if (seg.intensity === 'easy') return `Easy run. Settle into a relaxed pace.`;
    return `Run. Off you go.`;
  }
  return seg.label || '';
}

function fmtDuration(totalSec) {
  const m = Math.round(totalSec / 60);
  if (totalSec < 60) return `${totalSec} seconds`;
  return m === 1 ? `1 minute` : `${m} minutes`;
}

let voicesCache = [];
function refreshVoices() {
  voicesCache = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
  const sel = document.getElementById('voiceSelect');
  if (!sel) return;
  sel.innerHTML = '';
  const defaultOpt = document.createElement('option');
  defaultOpt.value = '';
  defaultOpt.textContent = 'System default';
  sel.appendChild(defaultOpt);
  voicesCache
    .filter((v) => v.lang.startsWith('en'))
    .forEach((v) => {
      const opt = document.createElement('option');
      opt.value = v.voiceURI;
      opt.textContent = `${v.name} (${v.lang})`;
      if (state.settings.voiceURI === v.voiceURI) opt.selected = true;
      sel.appendChild(opt);
    });
}
if (window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = refreshVoices;
}

function speak(text) {
  if (!state.settings.voiceOn || !window.speechSynthesis) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = state.settings.rate || 1;
  const voice = voicesCache.find((v) => v.voiceURI === state.settings.voiceURI);
  if (voice) utter.voice = voice;
  window.speechSynthesis.speak(utter);
}

// ---------- Background keep-alive (lets the timer + voice cues keep ----------
// ---------- running with the screen locked, via lock-screen media playback) ----------
const bgAudio = document.getElementById('bgAudio');

function startKeepAlive() {
  if (!bgAudio) return;
  bgAudio.play().catch(() => { /* needs a user gesture; Start button provides one */ });
}
function stopKeepAlive() {
  if (!bgAudio) return;
  bgAudio.pause();
  bgAudio.currentTime = 0;
}

function updateMediaSession() {
  if (!('mediaSession' in navigator) || !player.session) return;
  const seg = currentSeg();
  navigator.mediaSession.metadata = new MediaMetadata({
    title: seg.label || seg.type,
    artist: player.session.title,
    album: 'Trackside',
  });
  navigator.mediaSession.playbackState = player.running ? 'playing' : 'paused';
  try {
    navigator.mediaSession.setPositionState({
      duration: seg.seconds,
      playbackRate: 1,
      position: Math.max(0, seg.seconds - player.remaining),
    });
  } catch (e) { /* not supported on this browser */ }
}

function wireMediaSessionActions() {
  if (!('mediaSession' in navigator)) return;
  navigator.mediaSession.setActionHandler('play', () => { if (!player.running) startPause(); });
  navigator.mediaSession.setActionHandler('pause', () => { if (player.running) startPause(); });
  navigator.mediaSession.setActionHandler('nexttrack', () => skipSegment());
}

// ---------- Navigation ----------
const views = ['home', 'player', 'settings'];
function showView(name) {
  views.forEach((v) => {
    document.getElementById(`view-${v}`).classList.toggle('hidden', v !== name);
  });
  document.querySelectorAll('.navbtn').forEach((b) => {
    b.classList.toggle('active', b.dataset.view === name);
  });
}

// ---------- Home / route map ----------
function nextSessionId() {
  const next = SESSIONS.find((s) => !state.completed[s.id]);
  return next ? next.id : null;
}

function renderHome() {
  const nextId = nextSessionId();
  const total = SESSIONS.length;
  const done = Object.keys(state.completed).length;

  document.getElementById('progressSummary').textContent = `${done} / ${total} sessions complete`;
  document.getElementById('progressFill').style.width = `${(done / total) * 100}%`;

  const continueBtn = document.getElementById('continueBtn');
  if (nextId) {
    const s = SESSIONS.find((x) => x.id === nextId);
    continueBtn.textContent = `Continue: ${s.title}`;
    continueBtn.disabled = false;
    continueBtn.onclick = () => openSession(nextId);
  } else {
    continueBtn.textContent = `Program complete — nice work!`;
    continueBtn.disabled = true;
  }

  const map = document.getElementById('routeMap');
  map.innerHTML = '';
  let lastPhase = null;
  PROGRAM.forEach((wk) => {
    if (wk.phase !== lastPhase) {
      lastPhase = wk.phase;
      const label = document.createElement('div');
      label.className = 'phase-label';
      label.textContent = wk.phase;
      map.appendChild(label);
    }
    const weekRow = document.createElement('div');
    weekRow.className = 'week-row';
    const weekLabel = document.createElement('div');
    weekLabel.className = 'week-label';
    weekLabel.textContent = `Wk ${wk.week}`;
    weekRow.appendChild(weekLabel);

    const dotsWrap = document.createElement('div');
    dotsWrap.className = 'dots-wrap';
    wk.days.forEach((d) => {
      const id = `${wk.week}-${d.day}`;
      const dot = document.createElement('button');
      dot.className = 'session-dot';
      dot.title = d.title;
      if (state.completed[id]) dot.classList.add('done');
      if (id === nextId) dot.classList.add('current');
      dot.onclick = () => openSession(id);
      dotsWrap.appendChild(dot);
    });
    weekRow.appendChild(dotsWrap);
    map.appendChild(weekRow);
  });
}

// ---------- Player ----------
let player = {
  session: null,
  segIndex: 0,
  remaining: 0,
  timerHandle: null,
  running: false,
  wakeLock: null,
  spokenHalfway: false,
};

function openSession(id) {
  const s = SESSIONS.find((x) => x.id === id);
  if (!s) return;
  player.session = s;
  player.segIndex = 0;
  player.remaining = s.segments[0].seconds;
  player.running = false;
  player.spokenHalfway = false;
  renderPlayer();
  showView('player');
}

function currentSeg() {
  return player.session.segments[player.segIndex];
}

function renderPlayer() {
  const s = player.session;
  document.getElementById('playerTitle').textContent = s.title;
  const seg = currentSeg();
  document.getElementById('segLabel').textContent = seg.label || seg.type;
  document.getElementById('segLabel').className = `seg-label seg-${seg.type}`;
  document.getElementById('timerDisplay').textContent = fmtClock(player.remaining);

  const next = s.segments[player.segIndex + 1];
  document.getElementById('nextUp').textContent = next ? `Next: ${next.label || next.type}` : 'Final segment';

  const dotsEl = document.getElementById('segDots');
  dotsEl.innerHTML = '';
  s.segments.forEach((sg, i) => {
    const d = document.createElement('span');
    d.className = `seg-dot seg-dot-${sg.type}`;
    if (i < player.segIndex) d.classList.add('past');
    if (i === player.segIndex) d.classList.add('active');
    dotsEl.appendChild(d);
  });

  document.getElementById('startPauseBtn').textContent = player.running ? 'Pause' : 'Start';
}

function fmtClock(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

async function requestWakeLock() {
  if (!state.settings.wakeLock || !('wakeLock' in navigator)) return;
  try {
    player.wakeLock = await navigator.wakeLock.request('screen');
  } catch (e) { /* not available / denied, ignore */ }
}
function releaseWakeLock() {
  if (player.wakeLock) {
    player.wakeLock.release().catch(() => {});
    player.wakeLock = null;
  }
}

function startPause() {
  if (player.running) {
    pauseTimer();
  } else {
    startTimer();
  }
}

function startTimer() {
  if (player.segIndex === 0 && player.remaining === currentSeg().seconds) {
    speak(segmentCue(currentSeg()));
  }
  // Anchor to a real end-time rather than counting down tick-by-tick, so the
  // display stays accurate even if the browser throttles a backgrounded/locked tab.
  player.segEndTime = Date.now() + player.remaining * 1000;
  player.running = true;
  player.lastSpokenSecond = null;
  requestWakeLock();
  startKeepAlive();
  updateMediaSession();
  renderPlayer();
  clearInterval(player.timerHandle);
  player.timerHandle = setInterval(tick, 1000);
}

function pauseTimer() {
  player.remaining = Math.max(0, Math.round((player.segEndTime - Date.now()) / 1000));
  player.running = false;
  clearInterval(player.timerHandle);
  releaseWakeLock();
  updateMediaSession();
  renderPlayer();
}

function tick() {
  const seg = currentSeg();
  player.remaining = Math.max(0, Math.round((player.segEndTime - Date.now()) / 1000));

  if (!player.spokenHalfway && seg.seconds >= 240 && player.remaining <= Math.floor(seg.seconds / 2)) {
    speak(pickEncouragement());
    player.spokenHalfway = true;
  }
  if (player.remaining > 0 && player.remaining <= 3 && player.lastSpokenSecond !== player.remaining) {
    speak(String(player.remaining));
    player.lastSpokenSecond = player.remaining;
  }

  if (player.remaining <= 0) {
    advanceSegment();
    return;
  }
  document.getElementById('timerDisplay').textContent = fmtClock(player.remaining);
  updateMediaSession();
}

function advanceSegment() {
  const s = player.session;
  player.segIndex += 1;
  player.spokenHalfway = false;
  player.lastSpokenSecond = null;
  if (player.segIndex >= s.segments.length) {
    finishSession();
    return;
  }
  player.remaining = s.segments[player.segIndex].seconds;
  player.segEndTime = Date.now() + player.remaining * 1000;
  speak(segmentCue(currentSeg()));
  updateMediaSession();
  renderPlayer();
}

function finishSession() {
  clearInterval(player.timerHandle);
  player.running = false;
  releaseWakeLock();
  stopKeepAlive();
  if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'none';
  speak('Session complete. Great work.');
  state.completed[player.session.id] = { completedAt: new Date().toISOString() };
  saveState();
  document.getElementById('segLabel').textContent = 'Complete!';
  document.getElementById('segLabel').className = 'seg-label seg-done';
  document.getElementById('timerDisplay').textContent = '✓';
  document.getElementById('nextUp').textContent = 'Nice one — logged to your progress.';
  document.getElementById('startPauseBtn').textContent = 'Back to home';
  document.getElementById('startPauseBtn').onclick = () => { showView('home'); renderHome(); resetStartBtn(); };
  document.getElementById('skipBtn').classList.add('hidden');
}

function resetStartBtn() {
  document.getElementById('startPauseBtn').onclick = startPause;
  document.getElementById('skipBtn').classList.remove('hidden');
}

function skipSegment() {
  if (!player.session) return;
  clearInterval(player.timerHandle);
  player.running = false;
  advanceSegment();
  if (player.segIndex < player.session.segments.length) startTimer();
}

function exitSession() {
  clearInterval(player.timerHandle);
  player.running = false;
  releaseWakeLock();
  stopKeepAlive();
  if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'none';
  showView('home');
  renderHome();
}

// If the tab was throttled while backgrounded/locked, snap the display back
// to the true remaining time the moment it's visible again.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && player.running && player.session) {
    tick();
  }
});

// ---------- Settings ----------
function renderSettings() {
  document.getElementById('voiceOnToggle').checked = state.settings.voiceOn;
  document.getElementById('rateRange').value = state.settings.rate;
  document.getElementById('wakeLockToggle').checked = state.settings.wakeLock;
  refreshVoices();
}

function wireSettings() {
  document.getElementById('voiceOnToggle').addEventListener('change', (e) => {
    state.settings.voiceOn = e.target.checked;
    saveState();
  });
  document.getElementById('rateRange').addEventListener('input', (e) => {
    state.settings.rate = parseFloat(e.target.value);
    saveState();
  });
  document.getElementById('wakeLockToggle').addEventListener('change', (e) => {
    state.settings.wakeLock = e.target.checked;
    saveState();
  });
  document.getElementById('voiceSelect').addEventListener('change', (e) => {
    state.settings.voiceURI = e.target.value || null;
    saveState();
    speak('This is how I sound.');
  });
  document.getElementById('resetProgressBtn').addEventListener('click', () => {
    if (confirm('Reset all progress? This cannot be undone.')) {
      state.completed = {};
      saveState();
      renderHome();
      showView('home');
    }
  });
}

// ---------- Init ----------
function init() {
  document.querySelectorAll('.navbtn').forEach((b) => {
    b.addEventListener('click', () => {
      showView(b.dataset.view);
      if (b.dataset.view === 'home') renderHome();
      if (b.dataset.view === 'settings') renderSettings();
    });
  });
  document.getElementById('startPauseBtn').addEventListener('click', startPause);
  document.getElementById('skipBtn').addEventListener('click', skipSegment);
  document.getElementById('exitBtn').addEventListener('click', exitSession);
  wireSettings();
  wireMediaSessionActions();
  refreshVoices();
  renderHome();
  showView('home');

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

document.addEventListener('DOMContentLoaded', init);
