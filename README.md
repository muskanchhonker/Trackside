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

## Run it locally first (optional)

Any static file server works, e.g. from this folder:

```
python3 -m http.server 8080
```

Then open `http://localhost:8080` on your phone (same Wi‑Fi) or
computer.

## Deploy for free — pick one

All three of these host static files for free and give you an HTTPS
URL, which is required for the voice API and for "Add to Home Screen"
to work properly.

### Option A: GitHub Pages (recommended, simplest)
1. Create a new GitHub repository and upload everything in this folder
   (`index.html`, `css/`, `js/`, `manifest.json`, `sw.js`, `icons/`).
2. In the repo, go to **Settings → Pages**.
3. Under "Build and deployment", set **Source** to `Deploy from a
   branch`, branch `main`, folder `/ (root)`.
4. Save. Your app will be live at
   `https://<your-username>.github.io/<repo-name>/` within a minute or
   two.

### Option B: Netlify
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop).
2. Drag this whole folder onto the page.
3. Netlify gives you a live HTTPS URL immediately (free tier, no
   account strictly required for a single drop, though signing up lets
   you update it later).

### Option C: Vercel
1. Create a free account at [vercel.com](https://vercel.com).
2. `npm i -g vercel` then run `vercel` from inside this folder, or use
   the "Add New Project" button on the dashboard and drag the folder in.
3. Deploy with defaults (it's a static site, no build step needed).

## Install it on your phone

Once deployed:
- **iPhone (Safari):** open the URL → Share icon → "Add to Home
  Screen."
- **Android (Chrome):** open the URL → ⋮ menu → "Add to Home screen"
  (or you'll see an automatic install prompt).

It'll then open full-screen like a native app and keep working offline
after the first load.

## Running with the screen locked

The app now keeps a near-silent audio track playing during a session.
That's not decorative — it's the standard trick web apps use to stay
"alive" while the screen is locked: phones treat any tab/app playing
audio as active media (like a podcast player), so it won't get fully
suspended the way a silent background tab would. On top of that, the
app publishes the current segment and time remaining to your phone's
lock screen via the Media Session API, so you get a lock-screen widget
with play/pause and skip — similar to a music player — showing what
you're doing without unlocking your phone.

Honest caveats:
- This is a well-supported browser feature, not a guarantee — iOS
  Safari and Android Chrome both honor it, but reliability is
  generally better once the app is **installed to your home screen**
  rather than run in a regular browser tab, so do that first.
- The timer itself is calculated from real elapsed time (not just a
  tick counter), so even if a tick or two gets delayed while locked,
  the displayed time and cues will already be caught up correctly the
  moment you check the lock screen or unlock the phone.
- Spoken cues that would've landed while the screen was locked may be
  quieter or slightly delayed depending on the OS, since background
  audio ducking behaves a little differently across devices — the
  visual/lock-screen state is always accurate even if a spoken line
  gets clipped.
- If you find it's not reliable enough on your specific phone, the
  fallback is the Wake Lock setting (Coach tab) which keeps the screen
  on but dimmed — heavier on battery, but 100% reliable since nothing
  gets suspended.

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
  program — NHS's own "Bridge to 10K" exists as a separate podcast
  series if you'd rather follow that instead.

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

Feel free to edit `js/program.js` directly if you want to adjust pacing,
add a 4th weekly run, or extend the plan further past 10K — each
session is just a list of `warmup` / `run` / `walk` / `cooldown`
segments with a duration in seconds.
