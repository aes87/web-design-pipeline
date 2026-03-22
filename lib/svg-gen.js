/**
 * SVG decorative element generator.
 *
 * Produces parameterized SVG strings from design tokens for use as
 * section dividers, background textures, hero decorations, and abstract art.
 *
 * All output is accessible (aria-hidden), optimized (minimal decimals),
 * and driven by design token colors.
 *
 * @module svg-gen
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

// ---------------------------------------------------------------------------
// PRNG — mulberry32 for deterministic, seedable output
// ---------------------------------------------------------------------------

function mulberry32(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/** Round to `d` decimal places. */
function r(n, d = 2) {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

/** Polar → Cartesian. Angle in radians. */
function polar(cx, cy, radius, angle) {
  return { x: r(cx + radius * Math.cos(angle)), y: r(cy + radius * Math.sin(angle)) };
}

/** Simple 1D noise approximation using PRNG. */
function smoothNoise(rng, count) {
  const raw = Array.from({ length: count }, () => rng());
  // One-pass smooth
  return raw.map((v, i) => {
    const prev = raw[(i - 1 + count) % count];
    const next = raw[(i + 1) % count];
    return r(prev * 0.25 + v * 0.5 + next * 0.25, 3);
  });
}

// ---------------------------------------------------------------------------
// 1. Wave Divider
// ---------------------------------------------------------------------------

/**
 * Generate a multi-layer wave section divider.
 *
 * @param {Object} options
 * @param {number} [options.width=1440]
 * @param {number} [options.height=120]
 * @param {number} [options.layers=3]
 * @param {string[]} [options.colors] - Fill colors per layer (cycles if fewer than layers)
 * @param {number} [options.seed=42]
 * @param {boolean} [options.flip=false] - Flip vertically (for bottom-of-section dividers)
 * @returns {string} SVG markup
 */
export function waveDivider({
  width = 1440,
  height = 120,
  layers = 3,
  colors = ['oklch(0.25 0.03 260)', 'oklch(0.2 0.025 260)', 'oklch(0.15 0.02 260)'],
  seed = 42,
  flip = false,
} = {}) {
  const rng = mulberry32(seed);
  const paths = [];

  for (let l = 0; l < layers; l++) {
    const color = colors[l % colors.length];
    const amplitude = height * (0.25 + l * 0.12);
    const baseY = height * (0.3 + l * 0.12);
    const segments = 5 + Math.floor(rng() * 3);
    const segW = width / segments;

    // Generate wave points
    const points = [];
    for (let i = 0; i <= segments; i++) {
      const x = i * segW;
      const y = baseY + (rng() - 0.5) * amplitude;
      points.push({ x: r(x), y: r(clamp(y, 2, height - 2)) });
    }

    // Build smooth cubic bezier path
    let d = `M0,${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cpx1 = r(curr.x + segW * 0.4);
      const cpx2 = r(next.x - segW * 0.4);
      d += ` C${cpx1},${curr.y} ${cpx2},${next.y} ${next.x},${next.y}`;
    }
    d += ` V${height} H0 Z`;

    const opacity = r(1 - l * 0.15, 2);
    paths.push(`    <path d="${d}" fill="${color}" opacity="${opacity}"/>`);
  }

  const transform = flip ? `\n    <g transform="scale(1,-1) translate(0,-${height})">` : '';
  const transformClose = flip ? '\n    </g>' : '';

  return [
    `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" aria-hidden="true">${transform}`,
    ...paths,
    `${transformClose}</svg>`,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// 2. Blob Shape
// ---------------------------------------------------------------------------

/**
 * Generate an organic blob shape using radial control points.
 *
 * @param {Object} options
 * @param {number} [options.size=400] - ViewBox size (square)
 * @param {string} [options.color] - Fill color
 * @param {number} [options.points=6] - Number of control points (more = complex)
 * @param {number} [options.variance=0.3] - Shape irregularity (0 = circle, 1 = very wild)
 * @param {number} [options.seed=42]
 * @param {string} [options.stroke] - Optional stroke color
 * @param {number} [options.strokeWidth=0]
 * @returns {string} SVG markup
 */
export function blobShape({
  size = 400,
  color = 'oklch(0.5 0.15 260)',
  points = 6,
  variance = 0.3,
  seed = 42,
  stroke = 'none',
  strokeWidth = 0,
} = {}) {
  const rng = mulberry32(seed);
  const cx = size / 2;
  const cy = size / 2;
  const baseRadius = size * 0.35;

  // Generate perturbed radial points
  const angleStep = (Math.PI * 2) / points;
  const radii = [];
  for (let i = 0; i < points; i++) {
    const perturbation = 1 + (rng() - 0.5) * 2 * variance;
    radii.push(baseRadius * perturbation);
  }

  // Smooth the radii for organic feel
  const smoothed = radii.map((rad, i) => {
    const prev = radii[(i - 1 + points) % points];
    const next = radii[(i + 1) % points];
    return r(prev * 0.2 + rad * 0.6 + next * 0.2, 2);
  });

  // Convert to cartesian
  const pts = smoothed.map((rad, i) => {
    const angle = angleStep * i - Math.PI / 2; // Start from top
    return polar(cx, cy, rad, angle);
  });

  // Build closed cubic bezier path with C1 continuity
  const tension = 0.3;
  let d = `M${pts[0].x},${pts[0].y}`;

  for (let i = 0; i < pts.length; i++) {
    const curr = pts[i];
    const next = pts[(i + 1) % pts.length];
    const prev = pts[(i - 1 + pts.length) % pts.length];
    const nextNext = pts[(i + 2) % pts.length];

    // Control point 1: tangent at curr toward next
    const cp1x = r(curr.x + (next.x - prev.x) * tension);
    const cp1y = r(curr.y + (next.y - prev.y) * tension);

    // Control point 2: tangent at next toward curr
    const cp2x = r(next.x - (nextNext.x - curr.x) * tension);
    const cp2y = r(next.y - (nextNext.y - curr.y) * tension);

    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${next.x},${next.y}`;
  }

  const strokeAttr = stroke !== 'none' ? ` stroke="${stroke}" stroke-width="${strokeWidth}"` : '';

  return [
    `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">`,
    `  <path d="${d}" fill="${color}"${strokeAttr}/>`,
    '</svg>',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// 3. Geometric Pattern (SVG <pattern> tile)
// ---------------------------------------------------------------------------

/**
 * Generate a repeating geometric pattern as an SVG with <pattern> + <rect>.
 *
 * @param {Object} options
 * @param {number} [options.width=800]
 * @param {number} [options.height=600]
 * @param {'hexagon'|'triangle'|'circle'|'diamond'|'cross'|'line'} [options.shape='hexagon']
 * @param {string[]} [options.colors]
 * @param {number} [options.cellSize=40] - Pattern tile size
 * @param {number} [options.gap=4] - Space between shapes
 * @param {number} [options.opacity=0.15]
 * @param {number} [options.seed=42]
 * @returns {string} SVG markup
 */
export function geometricPattern({
  width = 800,
  height = 600,
  shape = 'hexagon',
  colors = ['oklch(0.4 0.08 260)', 'oklch(0.45 0.06 280)'],
  cellSize = 40,
  gap = 4,
  opacity = 0.15,
  seed = 42,
} = {}) {
  const rng = mulberry32(seed);
  const s = cellSize;
  const inner = s - gap;
  let patternContent = '';
  let patternW = s;
  let patternH = s;

  switch (shape) {
    case 'hexagon': {
      // Hex tile — pointy-top hexagon
      const hr = inner / 2;
      const hexH = hr * Math.sqrt(3);
      patternW = r(s * 1.5);
      patternH = r(hexH);
      const hex = hexPoints(s / 2, patternH / 2, hr);
      const color = colors[0];
      patternContent = `<polygon points="${hex}" fill="${color}"/>`;
      break;
    }
    case 'triangle': {
      const triH = r(inner * Math.sqrt(3) / 2);
      const cx = s / 2;
      const pts1 = `${r(cx)},${r(gap / 2)} ${r(cx - inner / 2)},${r(gap / 2 + triH)} ${r(cx + inner / 2)},${r(gap / 2 + triH)}`;
      patternContent = `<polygon points="${pts1}" fill="${colors[0]}"/>`;
      break;
    }
    case 'circle': {
      const cr = inner / 2;
      patternContent = `<circle cx="${s / 2}" cy="${s / 2}" r="${r(cr)}" fill="${colors[0]}"/>`;
      break;
    }
    case 'diamond': {
      const d = inner / 2;
      const cx = s / 2;
      const cy = s / 2;
      const pts = `${r(cx)},${r(cy - d)} ${r(cx + d)},${r(cy)} ${r(cx)},${r(cy + d)} ${r(cx - d)},${r(cy)}`;
      patternContent = `<polygon points="${pts}" fill="${colors[0]}"/>`;
      break;
    }
    case 'cross': {
      const arm = r(inner * 0.3);
      const cx = s / 2;
      const cy = s / 2;
      const half = inner / 2;
      patternContent = [
        `<rect x="${r(cx - arm / 2)}" y="${r(cy - half)}" width="${r(arm)}" height="${r(inner)}" fill="${colors[0]}"/>`,
        `<rect x="${r(cx - half)}" y="${r(cy - arm / 2)}" width="${r(inner)}" height="${r(arm)}" fill="${colors[0]}"/>`,
      ].join('\n      ');
      break;
    }
    case 'line': {
      patternW = s;
      patternH = s;
      const sw = r(Math.max(1, gap * 0.5));
      patternContent = `<line x1="0" y1="${r(s / 2)}" x2="${s}" y2="${r(s / 2)}" stroke="${colors[0]}" stroke-width="${sw}"/>`;
      break;
    }
    default:
      patternContent = `<rect x="${gap / 2}" y="${gap / 2}" width="${r(inner)}" height="${r(inner)}" fill="${colors[0]}"/>`;
  }

  return [
    `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">`,
    '  <defs>',
    `    <pattern id="geo-pattern" x="0" y="0" width="${patternW}" height="${patternH}" patternUnits="userSpaceOnUse">`,
    `      ${patternContent}`,
    '    </pattern>',
    '  </defs>',
    `  <rect width="100%" height="100%" fill="url(#geo-pattern)" opacity="${opacity}"/>`,
    '</svg>',
  ].join('\n');
}

/** Generate pointy-top hexagon vertex string. */
function hexPoints(cx, cy, radius) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    pts.push(`${r(cx + radius * Math.cos(angle))},${r(cy + radius * Math.sin(angle))}`);
  }
  return pts.join(' ');
}

// ---------------------------------------------------------------------------
// 4. Dot Grid
// ---------------------------------------------------------------------------

/**
 * Generate a grid of dots with optional radial falloff or random variation.
 *
 * @param {Object} options
 * @param {number} [options.width=800]
 * @param {number} [options.height=600]
 * @param {number} [options.spacing=24]
 * @param {number} [options.minRadius=1]
 * @param {number} [options.maxRadius=3]
 * @param {string} [options.color]
 * @param {number} [options.opacity=0.3]
 * @param {boolean} [options.radialFalloff=false] - Dots shrink toward edges
 * @param {boolean} [options.randomSize=false] - Random dot sizes
 * @param {number} [options.seed=42]
 * @returns {string} SVG markup
 */
export function dotGrid({
  width = 800,
  height = 600,
  spacing = 24,
  minRadius = 1,
  maxRadius = 3,
  color = 'oklch(0.5 0.1 260)',
  opacity = 0.3,
  radialFalloff = false,
  randomSize = false,
  seed = 42,
} = {}) {
  const rng = mulberry32(seed);
  const cx = width / 2;
  const cy = height / 2;
  const maxDist = Math.sqrt(cx * cx + cy * cy);
  const dots = [];

  for (let y = spacing; y < height; y += spacing) {
    for (let x = spacing; x < width; x += spacing) {
      let rad = maxRadius;

      if (radialFalloff) {
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const t = 1 - dist / maxDist;
        rad = lerp(minRadius, maxRadius, t * t);
      } else if (randomSize) {
        rad = lerp(minRadius, maxRadius, rng());
      }

      // Slight position jitter for organic feel
      const jx = r(x + (rng() - 0.5) * spacing * 0.15);
      const jy = r(y + (rng() - 0.5) * spacing * 0.15);

      dots.push(`  <circle cx="${jx}" cy="${jy}" r="${r(rad)}"/>`);
    }
  }

  return [
    `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">`,
    `  <g fill="${color}" opacity="${opacity}">`,
    ...dots,
    '  </g>',
    '</svg>',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// 5. Abstract Composition
// ---------------------------------------------------------------------------

/**
 * Generate an abstract composition of circles, arcs, and lines.
 *
 * @param {Object} options
 * @param {number} [options.width=800]
 * @param {number} [options.height=600]
 * @param {number} [options.elements=15]
 * @param {string[]} [options.colors]
 * @param {number[]} [options.opacityRange=[0.05, 0.25]]
 * @param {number} [options.seed=42]
 * @returns {string} SVG markup
 */
export function abstractComposition({
  width = 800,
  height = 600,
  elements = 15,
  colors = ['oklch(0.5 0.15 260)', 'oklch(0.6 0.12 280)', 'oklch(0.45 0.18 310)'],
  opacityRange = [0.05, 0.25],
  seed = 42,
} = {}) {
  const rng = mulberry32(seed);
  const shapes = [];

  for (let i = 0; i < elements; i++) {
    const color = colors[Math.floor(rng() * colors.length)];
    const op = r(lerp(opacityRange[0], opacityRange[1], rng()), 2);
    const type = rng();

    if (type < 0.35) {
      // Circle
      const cx = r(rng() * width);
      const cy = r(rng() * height);
      const rad = r(20 + rng() * Math.min(width, height) * 0.25);
      const filled = rng() > 0.4;
      if (filled) {
        shapes.push(`  <circle cx="${cx}" cy="${cy}" r="${rad}" fill="${color}" opacity="${op}"/>`);
      } else {
        const sw = r(1 + rng() * 2);
        shapes.push(`  <circle cx="${cx}" cy="${cy}" r="${rad}" fill="none" stroke="${color}" stroke-width="${sw}" opacity="${op}"/>`);
      }
    } else if (type < 0.6) {
      // Arc
      const cx = r(rng() * width);
      const cy = r(rng() * height);
      const rad = r(30 + rng() * Math.min(width, height) * 0.2);
      const startAngle = rng() * Math.PI * 2;
      const sweep = Math.PI * 0.5 + rng() * Math.PI;
      const start = polar(cx, cy, rad, startAngle);
      const end = polar(cx, cy, rad, startAngle + sweep);
      const largeArc = sweep > Math.PI ? 1 : 0;
      const sw = r(1 + rng() * 2.5);
      shapes.push(
        `  <path d="M${start.x},${start.y} A${r(rad)},${r(rad)} 0 ${largeArc} 1 ${end.x},${end.y}" fill="none" stroke="${color}" stroke-width="${sw}" opacity="${op}" stroke-linecap="round"/>`
      );
    } else if (type < 0.8) {
      // Line
      const x1 = r(rng() * width);
      const y1 = r(rng() * height);
      const length = 40 + rng() * 200;
      const angle = rng() * Math.PI * 2;
      const x2 = r(x1 + length * Math.cos(angle));
      const y2 = r(y1 + length * Math.sin(angle));
      const sw = r(0.5 + rng() * 2);
      shapes.push(
        `  <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${sw}" opacity="${op}" stroke-linecap="round"/>`
      );
    } else {
      // Ring (concentric circles pair)
      const cx = r(rng() * width);
      const cy = r(rng() * height);
      const rad1 = r(20 + rng() * 80);
      const rad2 = r(rad1 + 8 + rng() * 20);
      const sw = r(0.5 + rng());
      shapes.push(
        `  <circle cx="${cx}" cy="${cy}" r="${rad1}" fill="none" stroke="${color}" stroke-width="${sw}" opacity="${op}"/>`,
        `  <circle cx="${cx}" cy="${cy}" r="${rad2}" fill="none" stroke="${color}" stroke-width="${r(sw * 0.6)}" opacity="${r(op * 0.6, 2)}"/>`
      );
    }
  }

  return [
    `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">`,
    ...shapes,
    '</svg>',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// 6. Noise Texture (SVG feTurbulence)
// ---------------------------------------------------------------------------

/**
 * Generate an SVG noise/grain texture overlay using feTurbulence.
 *
 * @param {Object} options
 * @param {number} [options.width=200]
 * @param {number} [options.height=200]
 * @param {number} [options.baseFrequency=0.65]
 * @param {number} [options.numOctaves=3]
 * @param {number} [options.opacity=0.4]
 * @param {'fractalNoise'|'turbulence'} [options.type='fractalNoise']
 * @param {number} [options.seed=0] - feTurbulence seed (0 = random per render)
 * @returns {string} SVG markup
 */
export function noiseTexture({
  width = 200,
  height = 200,
  baseFrequency = 0.65,
  numOctaves = 3,
  opacity = 0.4,
  type = 'fractalNoise',
  seed = 0,
} = {}) {
  return [
    `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">`,
    '  <filter id="noise">',
    `    <feTurbulence type="${type}" baseFrequency="${baseFrequency}" numOctaves="${numOctaves}" seed="${seed}" stitchTiles="stitch"/>`,
    '    <feColorMatrix type="saturate" values="0"/>',
    '  </filter>',
    `  <rect width="100%" height="100%" filter="url(#noise)" opacity="${opacity}"/>`,
    '</svg>',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// 7. Concentric Rings
// ---------------------------------------------------------------------------

/**
 * Generate concentric rings radiating from a point.
 *
 * @param {Object} options
 * @param {number} [options.size=600]
 * @param {number} [options.rings=8]
 * @param {string[]} [options.colors]
 * @param {number} [options.strokeWidth=1.5]
 * @param {number} [options.opacity=0.2]
 * @param {number} [options.centerX=0.5] - Normalized center (0-1)
 * @param {number} [options.centerY=0.5]
 * @param {boolean} [options.dashed=false]
 * @param {number} [options.seed=42]
 * @returns {string} SVG markup
 */
export function concentricRings({
  size = 600,
  rings = 8,
  colors = ['oklch(0.5 0.1 260)'],
  strokeWidth = 1.5,
  opacity = 0.2,
  centerX = 0.5,
  centerY = 0.5,
  dashed = false,
  seed = 42,
} = {}) {
  const rng = mulberry32(seed);
  const cx = r(size * centerX);
  const cy = r(size * centerY);
  const maxR = size * 0.45;
  const step = maxR / rings;
  const circles = [];

  for (let i = 1; i <= rings; i++) {
    const rad = r(step * i + (rng() - 0.5) * step * 0.3);
    const color = colors[i % colors.length];
    const op = r(opacity * (1 - (i - 1) / rings * 0.5), 2);
    const sw = r(strokeWidth * (1 - (i - 1) / rings * 0.4), 2);
    const dashAttr = dashed ? ` stroke-dasharray="${r(rad * 0.1)} ${r(rad * 0.05)}"` : '';
    circles.push(
      `  <circle cx="${cx}" cy="${cy}" r="${rad}" fill="none" stroke="${color}" stroke-width="${sw}" opacity="${op}"${dashAttr}/>`
    );
  }

  return [
    `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">`,
    ...circles,
    '</svg>',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// 8. Radial Burst
// ---------------------------------------------------------------------------

/**
 * Generate lines radiating from a center point.
 *
 * @param {Object} options
 * @param {number} [options.size=600]
 * @param {number} [options.rays=24]
 * @param {string} [options.color]
 * @param {number} [options.strokeWidth=1]
 * @param {number} [options.opacity=0.15]
 * @param {number} [options.innerRadius=0] - Start distance from center (0-1 normalized)
 * @param {number} [options.centerX=0.5]
 * @param {number} [options.centerY=0.5]
 * @param {number} [options.seed=42]
 * @returns {string} SVG markup
 */
export function radialBurst({
  size = 600,
  rays = 24,
  color = 'oklch(0.5 0.1 260)',
  strokeWidth = 1,
  opacity = 0.15,
  innerRadius = 0,
  centerX = 0.5,
  centerY = 0.5,
  seed = 42,
} = {}) {
  const rng = mulberry32(seed);
  const cx = r(size * centerX);
  const cy = r(size * centerY);
  const outerR = size * 0.5;
  const innerR = outerR * innerRadius;
  const lines = [];

  for (let i = 0; i < rays; i++) {
    const angle = (Math.PI * 2 / rays) * i + (rng() - 0.5) * 0.1;
    const rVariation = 0.85 + rng() * 0.3;
    const start = polar(cx, cy, innerR, angle);
    const end = polar(cx, cy, outerR * rVariation, angle);
    const sw = r(strokeWidth * (0.5 + rng() * 0.5), 2);
    lines.push(
      `  <line x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}" stroke="${color}" stroke-width="${sw}" opacity="${opacity}" stroke-linecap="round"/>`
    );
  }

  return [
    `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">`,
    ...lines,
    '</svg>',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Token extraction from DTCG tokens.json
// ---------------------------------------------------------------------------

/**
 * Extract flat color values from a W3C DTCG tokens object.
 * @param {Object} tokens - Parsed tokens.json
 * @returns {Object} { background, surface, foreground, accent, secondary, all[] }
 */
export function extractColors(tokens) {
  const colors = { all: [] };
  function walk(obj, path) {
    for (const [key, val] of Object.entries(obj)) {
      if (val && val.$value && val.$type === 'color') {
        const fullPath = [...path, key].join('.');
        colors.all.push(val.$value);
        if (fullPath.includes('background') && fullPath.includes('base')) colors.background = val.$value;
        if (fullPath.includes('surface')) colors.surface = val.$value;
        if (fullPath.includes('foreground') && fullPath.includes('base')) colors.foreground = val.$value;
        if (fullPath.includes('accent') && fullPath.includes('primary')) colors.accent = val.$value;
        if (fullPath.includes('accent') && fullPath.includes('secondary')) colors.secondary = val.$value;
      } else if (val && typeof val === 'object' && !val.$type) {
        walk(val, [...path, key]);
      }
    }
  }
  if (tokens.color) walk(tokens.color, []);
  return colors;
}

// ---------------------------------------------------------------------------
// Generate from brief/tokens — auto-select SVGs for a design
// ---------------------------------------------------------------------------

/**
 * Auto-generate a set of SVG assets appropriate for a design.
 * Reads tokens.json and optionally brief.yaml keywords to decide which SVGs to produce.
 *
 * @param {Object} options
 * @param {Object} tokens - Parsed DTCG tokens
 * @param {string[]} [options.types] - Explicit list of SVG types to generate
 * @param {string} [options.style] - Aesthetic keyword (dark-luxury, brutalist, etc.)
 * @param {number} [options.seed=42]
 * @returns {{ name: string, svg: string, description: string }[]}
 */
export function generateSet({
  tokens,
  types,
  style = '',
  seed = 42,
} = {}) {
  const c = extractColors(tokens);
  const bg = c.background || 'oklch(0.13 0.01 260)';
  const fg = c.foreground || 'oklch(0.95 0.01 260)';
  const accent = c.accent || 'oklch(0.7 0.15 50)';
  const secondary = c.secondary || accent;
  const surface = c.surface || bg;

  // Default type selection based on style
  const requested = types || selectTypesForStyle(style);

  const results = [];

  for (const type of requested) {
    switch (type) {
      case 'wave-divider':
        results.push({
          name: 'wave-divider',
          svg: waveDivider({ colors: [surface, bg, accent], seed, layers: 3 }),
          description: 'Section wave divider (top)',
        });
        results.push({
          name: 'wave-divider-flip',
          svg: waveDivider({ colors: [surface, bg, accent], seed: seed + 1, flip: true }),
          description: 'Section wave divider (bottom)',
        });
        break;
      case 'blob':
        results.push({
          name: 'blob-accent',
          svg: blobShape({ color: accent, seed, variance: 0.3, points: 6 }),
          description: 'Accent color blob decoration',
        });
        results.push({
          name: 'blob-secondary',
          svg: blobShape({ color: secondary, seed: seed + 10, variance: 0.25, points: 8 }),
          description: 'Secondary color blob decoration',
        });
        break;
      case 'geometric-pattern':
        results.push({
          name: 'geo-pattern',
          svg: geometricPattern({ colors: [fg, accent], opacity: 0.08, seed }),
          description: 'Geometric pattern overlay',
        });
        break;
      case 'dot-grid':
        results.push({
          name: 'dot-grid',
          svg: dotGrid({ color: fg, opacity: 0.15, radialFalloff: true, seed }),
          description: 'Dot grid with radial falloff',
        });
        break;
      case 'abstract':
        results.push({
          name: 'abstract-composition',
          svg: abstractComposition({ colors: [accent, secondary, fg], seed }),
          description: 'Abstract decorative composition',
        });
        break;
      case 'noise':
        results.push({
          name: 'noise-texture',
          svg: noiseTexture({ opacity: 0.3, seed }),
          description: 'Film grain noise texture',
        });
        break;
      case 'rings':
        results.push({
          name: 'concentric-rings',
          svg: concentricRings({ colors: [accent, secondary], opacity: 0.12, seed }),
          description: 'Concentric ring decoration',
        });
        break;
      case 'radial-burst':
        results.push({
          name: 'radial-burst',
          svg: radialBurst({ color: accent, opacity: 0.1, seed }),
          description: 'Radial burst decoration',
        });
        break;
    }
  }

  return results;
}

/** Pick sensible SVG types based on aesthetic keyword. */
function selectTypesForStyle(style) {
  const sets = {
    'dark-luxury': ['wave-divider', 'blob', 'rings', 'noise'],
    'brutalist': ['geometric-pattern', 'radial-burst', 'noise'],
    'glassmorphism': ['blob', 'rings', 'noise'],
    'editorial': ['dot-grid', 'wave-divider', 'abstract'],
    'organic': ['blob', 'wave-divider', 'dot-grid'],
    'cyberpunk': ['geometric-pattern', 'radial-burst', 'noise', 'rings'],
    'swiss': ['dot-grid', 'geometric-pattern'],
    'japanese-minimalism': ['dot-grid', 'rings'],
    'retro-futurism': ['rings', 'radial-burst', 'geometric-pattern'],
    'minimalist': ['dot-grid', 'wave-divider'],
    'maximalist': ['blob', 'abstract', 'geometric-pattern', 'noise', 'rings'],
    'immersive': ['blob', 'noise', 'wave-divider'],
    'vaporwave': ['geometric-pattern', 'radial-burst', 'blob', 'rings'],
    'corporate-clean': ['dot-grid', 'wave-divider'],
    'handcrafted': ['blob', 'wave-divider', 'dot-grid', 'noise'],
  };
  return sets[style] || ['wave-divider', 'blob', 'dot-grid', 'noise'];
}

// ---------------------------------------------------------------------------
// File I/O helpers
// ---------------------------------------------------------------------------

/**
 * Write generated SVGs to a design's assets directory.
 *
 * @param {string} designDir - Path to design directory (e.g., designs/my-site)
 * @param {{ name: string, svg: string }[]} svgs - Array of generated SVGs
 * @returns {Promise<string[]>} Array of written file paths
 */
export async function writeAssets(designDir, svgs) {
  const assetDir = join(designDir, 'assets', 'svg');
  await mkdir(assetDir, { recursive: true });
  const paths = [];
  for (const { name, svg } of svgs) {
    const filePath = join(assetDir, `${name}.svg`);
    await writeFile(filePath, svg, 'utf-8');
    paths.push(filePath);
  }
  return paths;
}

/**
 * Read tokens.json from a design directory.
 *
 * @param {string} designDir
 * @returns {Promise<Object>} Parsed tokens
 */
export async function readTokens(designDir) {
  const raw = await readFile(join(designDir, 'tokens.json'), 'utf-8');
  return JSON.parse(raw);
}
