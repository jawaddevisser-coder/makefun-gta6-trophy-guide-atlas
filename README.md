# Vice City Atlas — GTA 6 Trophy Guide

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/jawaddevisser-coder/makefun-gta6-trophy-guide-atlas/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/jawaddevisser-coder/makefun-gta6-trophy-guide-atlas/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI, organised as an atlas of Leonida: every trophy sits in the district where it is earned, on a stylised neon map of the state. Tap a district to see its trophies, plan a route through the districts in your own order, and tick trophies off as you earn them — progress is saved in your browser, exportable and importable.

What it covers:

- **Atlas** — a stylised map of Leonida with 8 districts (Vice City, Ocean Beach, Port Gellhorn, Key Lento, Kelly County, Lummox County, Mariana County, and Statewide), each with its trophies as cards showing the official name, description and grade.
- **Checklist** — all 55 trophies with search, filters by kind, grade and district, hide-earned, and a spoiler setting that hides story trophy names and descriptions until they are earned.
- **Planner** — build your own route through the districts, in the order you want to play them, with live counts of what each stop still holds.
- **Roadmap** — three stages to the platinum (about 200 hours, difficulty 4/10 per PowerPyx), with the one possibly missable trophy, Positive Mental Attitude, flagged in stage 1 and on its card.
- **Guides** — every trophy has a guide in our own words with its sources named and linked (PowerPyx, KeenGamer, Push Square, GameMapa). Five trophies whose method is still unconfirmed are marked as such instead of guessed.

The app is plain static files under `app/` with no build step: it works with the network off, loads nothing from outside `app/`, and keeps no account or data anywhere but your browser. `main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to the grader's output path and writes `dossier.json` with the vendored make.fun library.

## Run it

```sh
node serve.ts
# then open http://localhost:8080
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
