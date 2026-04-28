---
date: 2026-04-27
type: validation-report
project: web-design-pipeline / matt-patents
---

# Patents Validation Report

Cross-checked the FAMILIES array in `script.js` (10 families, 65 members)
against (a) LinkedIn data export Patents.csv, (b) resume v5 patent
listing, and (c) per-patent inventor metadata from patents.google.com.

## Result: 65/65 confirmed

Matthew V. Harte is named as an inventor on every entry currently in
the FAMILIES array.

| Source                  | Confirmed |
|-------------------------|-----------|
| LinkedIn export (9)     | 9         |
| Resume v5 (8, 1 overlap)| 7 (additional) |
| Per-patent fetch (49)   | 49        |
| **Total unique**        | **65/65** |

## Possibly missing — 2 new families surfaced by inventor search

The Google Patents inventor-by-assignee search returned 14 family
heads. 12 map cleanly onto existing FAMILIES entries; 2 do not.
Both inventor lists include Matthew V. Harte.

### 1. Smart-mounting system for a remote control device
- US20240047157A1 (published 2024-02-08) — pending US application
- WO2022140452A1 — international counterpart
- EP4268209A1 — European counterpart
- Inventors: Chris Dimberg, Matthew V. Harte, Matthew Philip McDonald,
  Robert C. Newman Jr., Daniel L. Twaddell
- Plausible suggested-id: `smart-mounting`
- Status: PENDING (no granted member yet)

### 2. Analog-adjustment actuator dimmer
- US20230036482A1 (published 2023-02-02) — pending US application
- WO2023009871A3 — international counterpart
- Inventors: Gregory S. Altonen, Edward J. Blair, Chris Dimberg,
  Matthew V. Harte, Jamie L. Ingram, Jason C. Killo, Matthew K. Olsen,
  Adam Rosenberg, William Taylor Shivell, Matthew J. Swatsky,
  Daniel L. Twaddell, Aaron J. Wilz, Noah Zinn
- Plausible suggested-id: `analog-adjustment`
- Status: PENDING (no granted member yet)

## Possibly missing — additional published-app within an existing family

### controllable-lighting (Ketra)
- US20240284567A1 — "Controllable lighting device" (published 2024)
- US20250254768A1 — "Controllable lighting device" (published 2025)
Both share the same inventor list as the existing 4 family members
(Harte, Naik, Petersen, Spicer, Taipale). Could be added as additional
published-app entries; or omitted as redundant since the family is
already represented.

## Inventor name variants observed

Some patents in the high-efficiency-loads family list "Daniel F. Carmen"
on some grants and "Daniel F. Camen" (no 'r') on US9941811. Likely a
USPTO typographic error on that one grant — unrelated to this validation
but worth noting if you ever surface co-inventor lists on the page.

## Methodology

1. Extracted 65 patent numbers from `script.js`.
2. Cross-referenced against LinkedIn export Patents.csv and resume v5
   to find direct self-corroboration (16 matches).
3. For each of the remaining 49 entries, fetched
   `https://patents.google.com/patent/US{number}{kind}/en` and read the
   inventor list from the page metadata. All 49 listed Matthew V. Harte.
4. Re-ran an inventor-only search at Google Patents to look for families
   that might be missing from FAMILIES. Surfaced the 2 pending families
   above.
