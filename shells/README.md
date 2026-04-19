# Portfolio Shell

Canonical design-system shell for aes87 portfolio pages. One file, one version, one source of truth for tokens + base layers + the reusable chrome (nav, buttons, sections, ambient effects).

## Files

- `portfolio-shell.css` — the shell itself. Read the header comment for a full inventory of what's included and excluded.
- `SPEC.md` — how the shell is organized, how to adopt it, how to evolve it.

## Current version

**1.0.0** — extracted 2026-04-18 from `designs/claude-portfolio-preview/style.css`, incorporating the mobile blob override (commit `e996db0`) and the `overflow-x: clip` / changelog / diff fixes from `claudelike-bar` commit `08fa535`.

Every consumer should carry a `/* SHELL_VERSION: X.Y.Z */` marker immediately above the pasted shell CSS so drift is greppable.

## Consumers

| Consumer | Location | Version |
|---|---|---|
| claudelike-bar demo | `/workspace/projects/claudelike-bar/index.html` (inline `<style>`) | 1.0.0 |
| claude-portfolio-preview | `designs/claude-portfolio-preview/style.css` | pre-shell (source of 1.0.0; migrate next) |

When bumping the shell, patch `portfolio-shell.css` first, then propagate the new block into every consumer and update the table above.

### Migrating claude-portfolio-preview to 1.0.0

The preview *is* the source of 1.0.0, so the diff is small but non-trivial:
1. Replace the tokens-through-`.section__description` run with the shell.
2. Re-add page-local overrides after the shell: `.nav__rabbit { opacity: 0; transform: translateY(20px); pointer-events: none }` (GSAP entrance) and the hero/about/philosophy/bento/timeline `.reveal` companions already in place.
3. Remove the duplicated `morphing-blobs` block and keyframes — the shell has them.
4. Trim the reduced-motion block down to page-specific `.hero__rings`, `.hero__rabbit`, `.nav__rabbit` lines.

Do this as its own commit so the before/after diff is clean.

## Why not a build step?

Consumers are single-file static pages (GitHub Pages). A build step (Sass, PostCSS, bundler) would add tooling weight for a two-consumer surface. The current trade-off: manual copy, explicit version marker, diff-friendly canonical file. Revisit if consumer count grows past ~4.
