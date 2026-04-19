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
| claude-portfolio-preview | `designs/claude-portfolio-preview/style.css` | 1.0.0 |

When bumping the shell, patch `portfolio-shell.css` first, then propagate the new block into every consumer and update the table above.

## Changelog

- **1.0.0** (2026-04-18) — Initial extraction from `claude-portfolio-preview`. First consumer on the shell: `claudelike-bar` (commit `027df0b`). Second consumer `claude-portfolio-preview` migrated in the following commit (page-local overrides: `.nav__rabbit` GSAP entrance state, `.hero__rings`/`.hero__rabbit`/`.nav__rabbit` reduced-motion additions). Includes a comment in the reduced-motion block documenting that the universal-selector rule is the backstop for static ambient layers like `.grain`.

## Why not a build step?

Consumers are single-file static pages (GitHub Pages). A build step (Sass, PostCSS, bundler) would add tooling weight for a two-consumer surface. The current trade-off: manual copy, explicit version marker, diff-friendly canonical file. Revisit if consumer count grows past ~4.
