# theadaply.github.io

The re-forge landing page, served at <https://theadaply.com/> by GitHub Pages
from the `main` branch at the repo root. `CNAME` carries the custom domain.

Fully static: one page, one stylesheet, one small script, one logo, and the
machine-readable trust artifacts. No backend, no build step.

| File | Purpose |
| --- | --- |
| `index.html` | the page |
| `static/site.css` | all styling, including the rebuilt app frames |
| `static/site.js` | fits the app frames to their container and plays the hero's lineage animation once |
| `static/reforge-mark.png` | the mark |
| `FOR-AGENTS.md` | how an assistant should audit re-forge before a human installs it |
| `CAPTURE-MANIFEST.json` | machine-readable declaration of what is captured, sent, and never sent |
| `llms.txt` | orientation for language models |
| `CNAME`, `.nojekyll` | Pages configuration |

## Design notes (branch `v2`, 2026-09-07)

The product is the hero. Three views of the desktop app are rebuilt in HTML
with the app's own tokens (`desktop/src/tokens.css` in `reforge-app`):
Evolution in the hero, where the lineage tree draws itself once, generation by
generation, and Patterns and Team in the product tour. Paper background, one
indigo accent, amber only for upper bounds, green only for a winner or a clean
merge. Fraunces for display, Inter for text, JetBrains Mono for data.

The hero motion has two phases. On load, two lineage vines grow out of the
top edge of the app window and climb the gutters either side of the headline,
budding into candidate nodes: on each side one bud survives (filled, pulsing)
and one is retired (faded). Only once they have finished does the tree inside
the window draw itself. The vines are sized from the viewport so they never
touch the copy, and are hidden below 1180px where there is no gutter.

Frames are drawn at 1120px and scaled with `zoom`. Below 62% they keep their
size and scroll inside their own wrapper, with an edge fade and a hint, so the
page itself never scrolls sideways. Reduced motion shows the vines and the
tree in their final state without animating.

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
git switch main && git merge v2 && git push origin main
```
