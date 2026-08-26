# Summit Log

A personal practice project — a static webpage logging mountains I've climbed and plan to climb, built while learning HTML, CSS, and JavaScript fundamentals.

## Purpose

This is a learning project, not a client deliverable. The goal is to practice:
- Semantic HTML structure
- CSS layout (Flexbox, Grid, custom properties)
- Basic JavaScript (DOM selection, IntersectionObserver, event-driven animation)
- Git version control and a real commit workflow

Content is personal: Rinjani (climbed), Kerinci (planned), Semeru (idea) — using real elevation data as practice content instead of generic placeholder text.

## Tech stack

- Plain HTML5, CSS3, vanilla JavaScript (no framework, no build step)
- Fonts: Fraunces (headings) + Inter (body) via Google Fonts
- No backend, no database — fully static

## File structure

```
/
├── index.html      # all page content and structure
├── style.css       # all styling
├── TODO.md         # running list of bugs and planned features
└── README.md       # this file
```

## Current state (as of last update)

**Working:**
- Hero section with SVG skyline background
- "Why keep a log" about section
- Stats row (summits logged, highest point, trips planned)
- Elevation comparison bar chart (animated on load)
- Mountain card grid with status badges (Climbed / Planning / Someday)
- Scroll-reveal animations via IntersectionObserver
- Git tracked locally and pushed to GitHub

**Known issues:** see `TODO.md` → Bugs section (footer text currently has a missing sentence fragment)

## Key decisions / notes for future-me

- `.about` and `.about-text` must stay in sync between HTML classes, CSS reveal rules, and the JS `querySelectorAll` list — this broke once already (JS was watching `.about-text` but CSS reveal styles were on `.about`). Any new reveal-on-scroll section must be added consistently in all three places.
- `.skyline` uses `position: absolute` with `pointer-events: none` and a capped height (30%) to avoid overlapping `.hero-content` text — don't increase its height without also increasing `.hero-content` padding-bottom.
- Bar chart widths are calculated with `calc(var(--h) / 3805 * 100%)` — 3805 is Kerinci's elevation, used as the max reference value. If a taller mountain is added later, this max needs to be updated too, or the tallest bar will overflow.

## How to run locally

Open `index.html` directly in a browser, or use the VS Code "Live Server" extension for auto-refresh on save.

## Deployment

Not yet deployed live. Planned: GitHub Pages (see `TODO.md`).

## Git workflow

```
git add .
git commit -m "short description of change"
git push
```

## Next steps

See `TODO.md` for the current bug list and feature roadmap.
