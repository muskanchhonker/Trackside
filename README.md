# Trackside — 10K Training

A personal training app for building up to a continuous 10K run, with
spoken coach cues. Assumes you can already run ~30 minutes
continuously (a 5K) — this is the progression from there.

- **21 sessions, 7 weeks, 3 runs/week.** Two easy runs and one long
  run per week, plus a weekly tempo session. The long run builds from
  35 minutes up to a continuous 60-minute / 10K run in week 7.
- **Spoken coach cues** using your device/browser's built-in
  text-to-speech (the Web Speech API) — free, no API key, works offline
  once the page has loaded once. You can pick from any voice your
  device already has installed, and adjust the speaking rate, in the
  Coach tab.
- **Progress tracking** saved locally in the browser (`localStorage`) —
  nothing leaves your device, no account needed.
- **Installable as a home-screen app** (PWA) with offline support via a
  small service worker, so it behaves like a native app once installed.

## Notes and limitations

- **Voice quality** depends entirely on your device's built-in voices —
  there's no paid TTS involved, so quality varies by OS/browser (iOS
  Safari and Android Chrome both ship reasonable voices; desktop
  Chrome/Edge usually have several to pick from in the Coach tab).
- **Keep the app in the foreground** while running a session — mobile
  browsers throttle timers in background tabs, which would throw the
  countdown off. The "keep screen awake" setting (Wake Lock) helps
  prevent your phone from locking mid-run; not all browsers support it,
  but it fails silently if not.
- **Data lives on-device only.** If you clear your browser data or
  switch devices, progress won't carry over — there's no server, by
  design, since this is for personal use only.
- This is my own reasonable 10K progression rather than an NHS
  program - NHS's own "Bridge to 10K" exists as a separate podcast
  series.

## File structure

```
index.html        Single-page app shell (Route / Player / Coach views)
css/style.css      Visual design
js/program.js       The 7-week, 21-session training plan data
js/app.js           Timer engine, voice coaching, progress storage, navigation
manifest.json      PWA manifest (installable app metadata)
sw.js              Offline caching service worker
audio/silence.wav  Near-silent keep-alive track (see "Running with the screen locked" above)
icons/icon.svg     App icon
```

