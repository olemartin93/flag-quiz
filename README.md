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
