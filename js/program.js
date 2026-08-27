// Structured Run Progression: 10K training
// Assumes you can already run continuously for ~30 minutes (a 5K).
// 7 weeks, 3 runs/week: two easy runs + one long run, with a weekly tempo
// session, building the long run from 35 minutes up to 60 minutes.
//
// Segment types: 'warmup' | 'run' | 'walk' | 'cooldown'
// Optional 'intensity': 'easy' | 'tempo' (used for voice line variety on run segments)

function W(type, seconds, opts) {
  return Object.assign({ type, seconds }, opts || {});
}

const WARMUP = W('warmup', 300, { label: 'Warm-up walk' });
const COOLDOWN = W('cooldown', 300, { label: 'Cool-down walk' });

function tempoBlock(tempoSec, easySec, reps) {
  const segs = [];
  for (let i = 0; i < reps; i++) {
    segs.push(W('run', tempoSec, { label: 'Tempo run', intensity: 'tempo' }));
    segs.push(W('run', easySec, { label: 'Easy run', intensity: 'easy' }));
  }
  return segs;
}

function easyDay(week, label, seconds) {
  return { title: `Week ${week} · ${label}`, segments: [WARMUP, W('run', seconds, { label, intensity: 'easy' }), COOLDOWN] };
}

const PROGRAM = [
  {
    week: 1,
    phase: '10K Progression',
    days: [
      { day: 1, ...easyDay(1, 'Easy run', 1800) },
      { day: 2, ...easyDay(1, 'Easy run', 1800) },
      { day: 3, title: 'Week 1 · Long run', segments: [WARMUP, W('run', 2100, { label: 'Long run', intensity: 'easy' }), COOLDOWN] },
    ],
  },
  {
    week: 2,
    phase: '10K Progression',
    days: [
      { day: 1, ...easyDay(2, 'Easy run', 1800) },
      { day: 2, title: 'Week 2 · Tempo intervals', segments: [WARMUP, ...tempoBlock(180, 120, 6), COOLDOWN] },
      { day: 3, title: 'Week 2 · Long run', segments: [WARMUP, W('run', 2400, { label: 'Long run', intensity: 'easy' }), COOLDOWN] },
    ],
  },
  {
    week: 3,
    phase: '10K Progression',
    days: [
      { day: 1, ...easyDay(3, 'Easy run', 1800) },
      { day: 2, ...easyDay(3, 'Easy run', 1800) },
      { day: 3, title: 'Week 3 · Long run', segments: [WARMUP, W('run', 2700, { label: 'Long run', intensity: 'easy' }), COOLDOWN] },
    ],
  },
  {
    week: 4,
    phase: '10K Progression',
    days: [
      { day: 1, ...easyDay(4, 'Easy run', 1800) },
      { day: 2, title: 'Week 4 · Tempo intervals', segments: [WARMUP, ...tempoBlock(180, 120, 7), COOLDOWN] },
      { day: 3, title: 'Week 4 · Long run', segments: [WARMUP, W('run', 3000, { label: 'Long run', intensity: 'easy' }), COOLDOWN] },
    ],
  },
  {
    week: 5,
    phase: '10K Progression',
    days: [
      { day: 1, ...easyDay(5, 'Easy run', 1800) },
      { day: 2, ...easyDay(5, 'Easy run', 1800) },
      { day: 3, title: 'Week 5 · Long run', segments: [WARMUP, W('run', 3300, { label: 'Long run', intensity: 'easy' }), COOLDOWN] },
    ],
  },
  {
    week: 6,
    phase: '10K Progression',
    days: [
      { day: 1, ...easyDay(6, 'Easy run', 1800) },
      { day: 2, title: 'Week 6 · Tempo intervals', segments: [WARMUP, ...tempoBlock(180, 120, 8), COOLDOWN] },
      { day: 3, title: 'Week 6 · Long run', segments: [WARMUP, W('run', 3450, { label: 'Long run', intensity: 'easy' }), COOLDOWN] },
    ],
  },
  {
    week: 7,
    phase: '10K Progression',
    days: [
      { day: 1, ...easyDay(7, 'Easy run', 1800) },
      { day: 2, ...easyDay(7, 'Easy run', 1800) },
      { day: 3, title: 'Week 7 · 10K!', segments: [WARMUP, W('run', 3600, { label: 'Long run — this is your 10K' }), COOLDOWN] },
    ],
  },
];

// Flat list of sessions for progress tracking / navigation
const SESSIONS = [];
PROGRAM.forEach((wk) => {
  wk.days.forEach((d) => {
    SESSIONS.push({
      id: `${wk.week}-${d.day}`,
      week: wk.week,
      day: d.day,
      phase: wk.phase,
      title: d.title,
      segments: d.segments,
    });
  });
});
