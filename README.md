# theadaply.github.io

The re-forge landing page, served at <https://theadaply.github.io/>.

Fully static: one `index.html` with inline CSS and JS, one logo, and two
machine-readable trust artifacts. No backend, no API calls, no build step.

## Where this came from

The page is `services/dashboard/static/landing.html` from the private
`TheAdaply/reforge-cloud` repo (commit `6f3ee7d`, 2026-07-21), where it was
served by the dashboard service. It is the "The hundredth time should be
faster." design.

| File | Source |
| --- | --- |
| `index.html` | `reforge-cloud/services/dashboard/static/landing.html` |
| `static/reforge-mark.png` | `reforge-cloud/services/dashboard/static/` |
| `FOR-AGENTS.md` | `reforge-cloud/clients/FOR-AGENTS.md` |
| `CAPTURE-MANIFEST.json` | `reforge-cloud/clients/CAPTURE-MANIFEST.json` |
| `llms.txt` | written for this repo, 2026-09-06 |

## Changes made when lifting it off the dashboard server

The original page shipped a workspace sign-in that only worked with the
dashboard backend behind it. On a static host every one of those paths is a
dead end, so they were removed:

- Dropped all three **"Open your dashboard"** buttons (nav, hero, final CTA).
  The remaining **"Join the waitlist"** button was promoted to primary in the
  nav and hero so each still has one.
- Dropped the `<dialog class="connect">` workspace-key modal and the JS that
  read/wrote `localStorage["reforge.dashboard.token"]` and redirected to
  `/overview?token=…`.
- Dropped the two hidden `already connected, open dashboard →` links.
- Final CTA subline `One key signs this device in.` →
  `One email when we open access.`, since there is no longer a key to enter.
- `<link rel="alternate" href="/FOR-AGENTS">` → `/FOR-AGENTS.md`, so the file
  resolves as a static asset instead of a server route.

Nothing else was touched. `git log` has the unmodified original as the parent
of the commit that introduced it.

## Changes made on 2026-09-06

- The three **View on GitHub** links and the footer **GitHub** link pointed at
  `github.com/TheAdaply/re-forge`, a private repo, so visitors got a 404. They
  now point at the public org page, <https://github.com/TheAdaply>.
- Copy (meta description, `og:description`, hero paragraph, the *evolve* node,
  the closing headline) now describes the current positioning: agents that
  evolve against the team's real work by Darwinian selection. Structure,
  graphics and every measured number are unchanged.
- `og:image` is now an absolute URL; social scrapers ignore relative ones.
- The trust bullet "Open-source client, read every line" claimed something a
  visitor cannot verify while the client repos are private. It now points at
  the two public trust artifacts instead. Revert it when the client is public.
- Added `llms.txt`, which the `<head>` comment already advertised.

## Publishing

GitHub Pages serves `main` at the repo root (legacy branch build, no Actions).
Push to `main` and it redeploys. `.nojekyll` stops Jekyll from processing the
files.
