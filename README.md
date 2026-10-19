# Flag Quiz

An installable, offline-ready flag quiz (PWA) built with React, strict TypeScript, Tailwind CSS and Vite.

## Features

- **197 countries**, filtered by continent and difficulty (Easy / Medium / Hard)
- **Points by difficulty**: 100 / 200 / 300 per flag, up to +50% for fast answers, streak multiplier up to 2×. Capitals pays 1.25× and Expert 1.5×. Hints halve the points.
- **Daily Challenge**: 10 flags, the same for everyone each day, with day streaks, a 5-week calendar and a shareable 🟩🟥 result
- **Game modes**: Classic, Reverse (name → flag), Capitals, Expert (type the name, typo-tolerant), Time Attack (60s), Survival (3 lives, gets harder)
- **Practice weak flags**, built from your own mistakes
- **Flag Atlas** with search, capitals and per-flag mastery
- **Levels, stats and 24 achievements**
- Sneaky look-alike wrong answers (Chad vs Romania, Indonesia vs Monaco…)
- 50/50 hints, sound effects, vibration, dark mode, keyboard shortcuts (1–4, H)
- Works offline; progress export/import

## Development

```bash
npm install
npm run dev        # dev server
npm run typecheck
npm run build      # production build + service worker in dist/
npm run preview
```

Flag artwork comes from [flag-icons](https://github.com/lipis/flag-icons) (MIT).

## Deploying to GitHub Pages

`.github/workflows/deploy.yml` builds and deploys on every push to `main` (or run it manually from the Actions tab).

One-time setup: in the repo go to **Settings → Pages** and set **Source** to **GitHub Actions**.

The site will be at `https://<user>.github.io/<repo>/`. The workflow sets `BASE_PATH=/<repo>/` so assets, the manifest and the service worker resolve under that subpath.
