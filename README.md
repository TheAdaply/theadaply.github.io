# theadaply.github.io

The re-forge landing page, served at <https://theadaply.com/> by GitHub Pages
from the `main` branch at the repo root. `CNAME` carries the custom domain.

Fully static: one page, one stylesheet, one small script, one logo, and the
machine-readable trust artifacts. No backend, no build step.

| File | Purpose |
| --- | --- |
| `index.html` | the page |
| `static/v3.css` | all styling, including the rebuilt dashboard |
| `static/v3.js` | draws the selection funnel and runs the scroll reveals |
| `static/moon.jpg` | the hero image, also ghosted behind the closing call to action |
| `static/reforge-mark.png` | the mark |
| `FOR-AGENTS.md` | how an assistant should audit re-forge before a human installs it |
| `CAPTURE-MANIFEST.json` | machine-readable declaration of what is captured, sent, and never sent |
| `llms.txt` | orientation for language models |
| `CNAME`, `.nojekyll` | Pages configuration |

## Design notes (branch `v3`, 2026-09-10)

One atmosphere, then calm. The moon image (`static/moon.jpg`) is the only
picture on the page: it fills the hero, and returns ghosted behind the
closing call to action. Everything between is pure white, one grotesk
(Geist, regular and medium), near-black and grey type, hairlines, and a
3% film grain across the whole site. Green means exactly one thing:
passed.

- **Hero.** Headline in the empty sky, the product rising from below the
  fold with only its top visible. The dashboard is rebuilt in HTML in the
  app's monochrome idiom, with the selection funnel and the winner card
  carrying our real numbers.
- **Problem.** A single editorial statement, centred, nothing else.
- **How it works.** Three bordered cards with thin line diagrams: capture,
  breed, select.
- **Survival of the fittest.** The centrepiece: hundreds of candidates on
  the left, scored on real tasks, fading generation by generation to one
  green winner. Generated deterministically by `static/v3.js`, animated
  once as it scrolls into view.
- **Results.** Four measured numbers in hairline columns, each with the
  label it earned.
- **Close.** Black, the moon at 20%, one white button, and a footer that
  continues the same block with no seam.

The ChatGPT brief this was built from invented statistics, navigation
items and dashboard contents; those were replaced with the real ones.

Reduced motion shows the funnel and the dashboard in their final state.

Every number in the proof strip is the same measured, detected, or
upper-bound figure the previous page carried, with the same labels. The mock
data inside the app frames is interface content, not a claim.

The previous page ("The hundredth time should be faster.", lifted from the
reforge-cloud dashboard) is in git history before this branch.

## Working on it

```bash
python3 -m http.server 8123   # then open http://localhost:8123/
```

## Publishing

GitHub Pages serves `main` at the repo root; push to `main` and it redeploys.
To ship this branch:

```bash
git switch main && git merge v3 && git push origin main
```
