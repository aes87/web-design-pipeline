/**
 * Generative art code producer.
 *
 * Generates embeddable { html, css, js } code snippets for procedural
 * backgrounds and interactive visual effects. Each snippet is self-contained,
 * uses vanilla Canvas 2D (no external deps), reads colors from CSS custom
 * properties, and respects prefers-reduced-motion.
 *
 * The generated JS uses IIFE scoping so it coexists safely with GSAP,
 * Lenis, and other scripts in the pipeline.
 *
 * @module generative-art
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

// ---------------------------------------------------------------------------
// Shared code fragments — injected into generated JS
// ---------------------------------------------------------------------------

const PERLIN_NOISE = `
// Perlin noise (compact 2D implementation)
const _perm = new Uint8Array(512);
const _grad = [[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];
(function initNoise(seed) {
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  let s = seed | 0;
  for (let i = 255; i > 0; i--) {
    s = (s * 16807 + 0) % 2147483647;
    const j = s % (i + 1);
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) _perm[i] = p[i & 255];
})(42);

function noise2D(x, y) {
  const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
  const xf = x - Math.floor(x), yf = y - Math.floor(y);
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const aa = _perm[_perm[X] + Y], ab = _perm[_perm[X] + Y + 1];
  const ba = _perm[_perm[X + 1] + Y], bb = _perm[_perm[X + 1] + Y + 1];
  const dot = (g, x, y) => _grad[g & 7][0] * x + _grad[g & 7][1] * y;
  const l1 = dot(aa, xf, yf) + u * (dot(ba, xf - 1, yf) - dot(aa, xf, yf));
  const l2 = dot(ab, xf, yf - 1) + u * (dot(bb, xf - 1, yf - 1) - dot(ab, xf, yf - 1));
  return l1 + v * (l2 - l1);
}`.trim();

const REDUCED_MOTION_CHECK = `
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;`.trim();

const CANVAS_RESIZE = (id) => `
function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio, 2);
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();`.trim();

const READ_CSS_COLORS = `
function getCSSColor(prop, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(prop).trim();
  return v || fallback;
}

function parseColor(str) {
  // Parse hex or return as-is for oklch/rgb
  if (str.startsWith('#')) {
    const n = parseInt(str.slice(1), 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  // For oklch/rgb, render to canvas to extract RGB
  const tmp = document.createElement('canvas');
  tmp.width = tmp.height = 1;
  const c = tmp.getContext('2d');
  c.fillStyle = str;
  c.fillRect(0, 0, 1, 1);
  const [r, g, b] = c.getImageData(0, 0, 1, 1).data;
  return { r, g, b };
}`.trim();

// ---------------------------------------------------------------------------
// 1. Flow Field — Perlin noise particle trails
// ---------------------------------------------------------------------------

/**
 * Generate a flow field background with Perlin noise-driven particle trails.
 *
 * @param {Object} options
 * @param {number} [options.particleCount=800]
 * @param {number} [options.noiseScale=0.003]
 * @param {number} [options.speed=1.5]
 * @param {number} [options.trailAlpha=0.02] - Trail fade rate (lower = longer trails)
 * @param {number} [options.lineWidth=1]
 * @param {string} [options.id='flow-field']
 * @returns {{ html: string, css: string, js: string }}
 */
export function flowField({
  particleCount = 800,
  noiseScale = 0.003,
  speed = 1.5,
  trailAlpha = 0.02,
  lineWidth = 1,
  id = 'flow-field',
} = {}) {
  const html = `<canvas id="${id}" class="gen-art-canvas" aria-hidden="true"></canvas>`;

  const css = `#${id} {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  width: 100%;
  height: 100%;
}`;

  const js = `(function() {
  'use strict';
  const canvas = document.getElementById('${id}');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  ${PERLIN_NOISE}
  ${REDUCED_MOTION_CHECK}
  ${READ_CSS_COLORS}

  const PARTICLE_COUNT = ${particleCount};
  const NOISE_SCALE = ${noiseScale};
  const SPEED = ${speed};
  const TRAIL_ALPHA = ${trailAlpha};
  const LINE_WIDTH = ${lineWidth};

  let W, H;
  function resize() {
    const dpr = Math.min(window.devicePixelRatio, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  // Read accent color from tokens
  const accentStr = getCSSColor('--color-accent-primary', 'oklch(0.7 0.15 50)');
  const accent = parseColor(accentStr);

  // Initialize particles
  const particles = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({ x: Math.random() * W, y: Math.random() * H });
  }

  let t = 0;
  let animId;

  function draw() {
    // Fade existing trails
    ctx.fillStyle = getCSSColor('--color-bg-base', '#0a0a0a');
    ctx.globalAlpha = TRAIL_ALPHA;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;

    ctx.strokeStyle = \`rgba(\${accent.r}, \${accent.g}, \${accent.b}, 0.6)\`;
    ctx.lineWidth = LINE_WIDTH;

    for (const p of particles) {
      const angle = noise2D(p.x * NOISE_SCALE, p.y * NOISE_SCALE + t) * Math.PI * 4;
      const prevX = p.x;
      const prevY = p.y;

      p.x += Math.cos(angle) * SPEED;
      p.y += Math.sin(angle) * SPEED;

      // Wrap around edges
      if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
        p.x = Math.random() * W;
        p.y = Math.random() * H;
      } else {
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
    }

    t += 0.0003;
    animId = requestAnimationFrame(draw);
  }

  if (prefersReducedMotion) {
    // Draw a single static frame
    ctx.fillStyle = getCSSColor('--color-bg-base', '#0a0a0a');
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = \`rgba(\${accent.r}, \${accent.g}, \${accent.b}, 0.15)\`;
    ctx.lineWidth = LINE_WIDTH;
    for (let i = 0; i < 200; i++) {
      let x = Math.random() * W, y = Math.random() * H;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let s = 0; s < 40; s++) {
        const a = noise2D(x * NOISE_SCALE, y * NOISE_SCALE) * Math.PI * 4;
        x += Math.cos(a) * SPEED;
        y += Math.sin(a) * SPEED;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  } else {
    // Fill initial background
    ctx.fillStyle = getCSSColor('--color-bg-base', '#0a0a0a');
    ctx.globalAlpha = 1;
    ctx.fillRect(0, 0, W, H);
    draw();
  }
})();`;

  return { html, css, js };
}

// ---------------------------------------------------------------------------
// 2. Noise Gradient — Animated multi-color noise on Canvas 2D
// ---------------------------------------------------------------------------

/**
 * Generate an animated noise gradient background.
 *
 * @param {Object} options
 * @param {number} [options.scale=0.005]
 * @param {number} [options.speed=0.0005]
 * @param {number} [options.pixelSize=4] - Render at lower resolution for performance
 * @param {string} [options.id='noise-gradient']
 * @returns {{ html: string, css: string, js: string }}
 */
export function noiseGradient({
  scale = 0.005,
  speed = 0.0005,
  pixelSize = 4,
  id = 'noise-gradient',
} = {}) {
  const html = `<canvas id="${id}" class="gen-art-canvas" aria-hidden="true"></canvas>`;

  const css = `#${id} {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  width: 100%;
  height: 100%;
  image-rendering: auto;
}`;

  const js = `(function() {
  'use strict';
  const canvas = document.getElementById('${id}');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  ${PERLIN_NOISE}
  ${REDUCED_MOTION_CHECK}
  ${READ_CSS_COLORS}

  const SCALE = ${scale};
  const SPEED = ${speed};
  const PX = ${pixelSize};

  // Read design colors
  const c1 = parseColor(getCSSColor('--color-bg-base', '#0a0a2e'));
  const c2 = parseColor(getCSSColor('--color-accent-primary', '#1a1a6e'));
  const c3 = parseColor(getCSSColor('--color-accent-secondary', '#2d1b69'));

  function lerp(a, b, t) { return a + (b - a) * t; }

  function colorAt(n) {
    // Map noise value (roughly -0.7 to 0.7) to 0-1
    const t = n * 0.5 + 0.5;
    let r, g, b;
    if (t < 0.5) {
      const u = t * 2;
      r = lerp(c1.r, c2.r, u);
      g = lerp(c1.g, c2.g, u);
      b = lerp(c1.b, c2.b, u);
    } else {
      const u = (t - 0.5) * 2;
      r = lerp(c2.r, c3.r, u);
      g = lerp(c2.g, c3.g, u);
      b = lerp(c2.b, c3.b, u);
    }
    return [r | 0, g | 0, b | 0];
  }

  let W, H, cols, rows;
  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    cols = Math.ceil(W / PX);
    rows = Math.ceil(H / PX);
    canvas.width = cols;
    canvas.height = rows;
  }
  window.addEventListener('resize', resize);
  resize();

  let t = 0;
  let animId;

  function draw() {
    const img = ctx.createImageData(cols, rows);
    const data = img.data;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const n = noise2D(x * PX * SCALE + t, y * PX * SCALE + t * 0.7)
                + noise2D(x * PX * SCALE * 2 + t * 1.3, y * PX * SCALE * 2) * 0.5;
        const [r, g, b] = colorAt(n);
        const idx = (y * cols + x) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    t += SPEED * 16;
    animId = requestAnimationFrame(draw);
  }

  if (prefersReducedMotion) {
    // Single static frame
    const img = ctx.createImageData(cols, rows);
    const data = img.data;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const n = noise2D(x * PX * SCALE, y * PX * SCALE)
                + noise2D(x * PX * SCALE * 2, y * PX * SCALE * 2) * 0.5;
        const [r, g, b] = colorAt(n);
        const idx = (y * cols + x) * 4;
        data[idx] = r; data[idx + 1] = g; data[idx + 2] = b; data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  } else {
    draw();
  }
})();`;

  return { html, css, js };
}

// ---------------------------------------------------------------------------
// 3. Particle Constellation — dots with connecting lines near cursor
// ---------------------------------------------------------------------------

/**
 * Generate a particle constellation that responds to cursor proximity.
 *
 * @param {Object} options
 * @param {number} [options.particleCount=120]
 * @param {number} [options.connectionDistance=120]
 * @param {number} [options.particleSize=2]
 * @param {number} [options.speed=0.3]
 * @param {string} [options.id='particle-constellation']
 * @returns {{ html: string, css: string, js: string }}
 */
export function particleConstellation({
  particleCount = 120,
  connectionDistance = 120,
  particleSize = 2,
  speed = 0.3,
  id = 'particle-constellation',
} = {}) {
  const html = `<canvas id="${id}" class="gen-art-canvas" aria-hidden="true"></canvas>`;

  const css = `#${id} {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  width: 100%;
  height: 100%;
}`;

  const js = `(function() {
  'use strict';
  const canvas = document.getElementById('${id}');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  ${REDUCED_MOTION_CHECK}
  ${READ_CSS_COLORS}

  const COUNT = ${particleCount};
  const CONN_DIST = ${connectionDistance};
  const SIZE = ${particleSize};
  const SPEED = ${speed};

  let W, H;
  function resize() {
    const dpr = Math.min(window.devicePixelRatio, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  const fg = parseColor(getCSSColor('--color-fg-base', '#ffffff'));
  const accent = parseColor(getCSSColor('--color-accent-primary', 'oklch(0.7 0.15 50)'));

  let mouseX = -1000, mouseY = -1000;
  document.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });
  document.addEventListener('mouseleave', () => { mouseX = -1000; mouseY = -1000; });

  const particles = [];
  for (let i = 0; i < COUNT; i++) {
    particles.push({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * SPEED,
      vy: (Math.random() - 0.5) * SPEED,
    });
  }

  let animId;

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Update positions
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      p.x = Math.max(0, Math.min(W, p.x));
      p.y = Math.max(0, Math.min(H, p.y));
    }

    // Draw connections
    const connSq = CONN_DIST * CONN_DIST;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distSq = dx * dx + dy * dy;
        if (distSq < connSq) {
          const alpha = (1 - Math.sqrt(distSq) / CONN_DIST) * 0.3;
          ctx.strokeStyle = \`rgba(\${fg.r}, \${fg.g}, \${fg.b}, \${alpha.toFixed(3)})\`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }

      // Cursor connections
      const dx = particles[i].x - mouseX;
      const dy = particles[i].y - mouseY;
      const distSq = dx * dx + dy * dy;
      const mouseDist = CONN_DIST * 1.5;
      if (distSq < mouseDist * mouseDist) {
        const alpha = (1 - Math.sqrt(distSq) / mouseDist) * 0.5;
        ctx.strokeStyle = \`rgba(\${accent.r}, \${accent.g}, \${accent.b}, \${alpha.toFixed(3)})\`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(mouseX, mouseY);
        ctx.stroke();
      }
    }

    // Draw particles
    ctx.fillStyle = \`rgba(\${fg.r}, \${fg.g}, \${fg.b}, 0.7)\`;
    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, SIZE, 0, Math.PI * 2);
      ctx.fill();
    }

    animId = requestAnimationFrame(draw);
  }

  if (prefersReducedMotion) {
    // Static snapshot
    ctx.fillStyle = \`rgba(\${fg.r}, \${fg.g}, \${fg.b}, 0.4)\`;
    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, SIZE, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        if (dx * dx + dy * dy < connSq) {
          ctx.strokeStyle = \`rgba(\${fg.r}, \${fg.g}, \${fg.b}, 0.08)\`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
  } else {
    draw();
  }
})();`;

  return { html, css, js };
}

// ---------------------------------------------------------------------------
// 4. Geometric Mesh — Animated triangulated grid
// ---------------------------------------------------------------------------

/**
 * Generate an animated geometric mesh of triangulated points.
 *
 * @param {Object} options
 * @param {number} [options.cols=12]
 * @param {number} [options.rows=8]
 * @param {number} [options.jitter=0.4] - Position randomness (0-1)
 * @param {number} [options.waveSpeed=0.001]
 * @param {number} [options.waveAmplitude=15]
 * @param {string} [options.id='geometric-mesh']
 * @returns {{ html: string, css: string, js: string }}
 */
export function geometricMesh({
  cols = 12,
  rows = 8,
  jitter = 0.4,
  waveSpeed = 0.001,
  waveAmplitude = 15,
  id = 'geometric-mesh',
} = {}) {
  const html = `<canvas id="${id}" class="gen-art-canvas" aria-hidden="true"></canvas>`;

  const css = `#${id} {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  width: 100%;
  height: 100%;
}`;

  const js = `(function() {
  'use strict';
  const canvas = document.getElementById('${id}');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  ${REDUCED_MOTION_CHECK}
  ${READ_CSS_COLORS}

  const COLS = ${cols};
  const ROWS = ${rows};
  const JITTER = ${jitter};
  const WAVE_SPEED = ${waveSpeed};
  const WAVE_AMP = ${waveAmplitude};

  let W, H;
  function resize() {
    const dpr = Math.min(window.devicePixelRatio, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initGrid();
  }

  const accent = parseColor(getCSSColor('--color-accent-primary', 'oklch(0.7 0.15 50)'));
  const bg = parseColor(getCSSColor('--color-bg-base', '#0a0a0a'));
  const surface = parseColor(getCSSColor('--color-bg-surface', '#1a1a1a'));

  // Grid of base points + jittered offsets
  let basePoints = [];
  let offsets = [];

  function initGrid() {
    basePoints = [];
    offsets = [];
    const cellW = W / (COLS - 1);
    const cellH = H / (ROWS - 1);
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const bx = col * cellW;
        const by = row * cellH;
        basePoints.push({ x: bx, y: by, col, row });
        offsets.push({
          dx: (Math.random() - 0.5) * cellW * JITTER,
          dy: (Math.random() - 0.5) * cellH * JITTER,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }
  }

  function getPoint(idx, t) {
    const bp = basePoints[idx];
    const off = offsets[idx];
    return {
      x: bp.x + off.dx + Math.sin(t + off.phase) * WAVE_AMP,
      y: bp.y + off.dy + Math.cos(t * 0.7 + off.phase) * WAVE_AMP,
    };
  }

  function idx(col, row) { return row * COLS + col; }

  let t = 0;
  let animId;

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Draw triangulated mesh
    for (let row = 0; row < ROWS - 1; row++) {
      for (let col = 0; col < COLS - 1; col++) {
        const tl = getPoint(idx(col, row), t);
        const tr = getPoint(idx(col + 1, row), t);
        const bl = getPoint(idx(col, row + 1), t);
        const br = getPoint(idx(col + 1, row + 1), t);

        // Triangle 1: tl, tr, bl
        drawTriangle(tl, tr, bl, col, row);
        // Triangle 2: tr, br, bl
        drawTriangle(tr, br, bl, col + 0.5, row + 0.5);
      }
    }

    t += WAVE_SPEED * 16;
    animId = requestAnimationFrame(draw);
  }

  function drawTriangle(a, b, c, col, row) {
    // Color varies by position — subtle gradient across grid
    const brightness = (col / COLS + row / ROWS) / 2;
    const r = Math.round(bg.r + (surface.r - bg.r) * brightness + (accent.r - bg.r) * brightness * 0.1);
    const g = Math.round(bg.g + (surface.g - bg.g) * brightness + (accent.g - bg.g) * brightness * 0.1);
    const bv = Math.round(bg.b + (surface.b - bg.b) * brightness + (accent.b - bg.b) * brightness * 0.1);

    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineTo(c.x, c.y);
    ctx.closePath();
    ctx.fillStyle = \`rgb(\${r}, \${g}, \${bv})\`;
    ctx.fill();
    ctx.strokeStyle = \`rgba(\${accent.r}, \${accent.g}, \${accent.b}, 0.06)\`;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  window.addEventListener('resize', resize);
  resize();

  if (prefersReducedMotion) {
    draw();
    cancelAnimationFrame(animId);
  } else {
    draw();
  }
})();`;

  return { html, css, js };
}

// ---------------------------------------------------------------------------
// 5. Morphing Blobs — CSS/SVG animated organic shapes
// ---------------------------------------------------------------------------

/**
 * Generate animated morphing blob shapes using SVG + CSS animations.
 * No Canvas required — pure SVG with CSS keyframe morphing.
 *
 * @param {Object} options
 * @param {number} [options.blobCount=3]
 * @param {number} [options.points=6]
 * @param {number} [options.size=600]
 * @param {number} [options.duration=20]
 * @param {string} [options.id='morphing-blobs']
 * @param {number} [options.seed=42]
 * @returns {{ html: string, css: string, js: string }}
 */
export function morphingBlobs({
  blobCount = 3,
  points = 6,
  size = 600,
  duration = 20,
  id = 'morphing-blobs',
  seed = 42,
} = {}) {
  // Generate blob paths using a simple seeded RNG
  function mulberry32(s) {
    let st = s | 0;
    return () => {
      st = (st + 0x6d2b79f5) | 0;
      let t = Math.imul(st ^ (st >>> 15), 1 | st);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function generateBlobPath(rng, cx, cy, baseR, variance, numPoints) {
    const angleStep = (Math.PI * 2) / numPoints;
    const pts = [];
    for (let i = 0; i < numPoints; i++) {
      const angle = angleStep * i - Math.PI / 2;
      const r = baseR * (1 + (rng() - 0.5) * variance);
      pts.push({
        x: Math.round((cx + r * Math.cos(angle)) * 100) / 100,
        y: Math.round((cy + r * Math.sin(angle)) * 100) / 100,
      });
    }
    // Build smooth closed path
    const tension = 0.3;
    let d = `M${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length; i++) {
      const curr = pts[i];
      const next = pts[(i + 1) % pts.length];
      const prev = pts[(i - 1 + pts.length) % pts.length];
      const nextN = pts[(i + 2) % pts.length];
      const cp1x = Math.round((curr.x + (next.x - prev.x) * tension) * 100) / 100;
      const cp1y = Math.round((curr.y + (next.y - prev.y) * tension) * 100) / 100;
      const cp2x = Math.round((next.x - (nextN.x - curr.x) * tension) * 100) / 100;
      const cp2y = Math.round((next.y - (nextN.y - curr.y) * tension) * 100) / 100;
      d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${next.x},${next.y}`;
    }
    return d;
  }

  const rng = mulberry32(seed);
  const cx = size / 2;
  const cy = size / 2;
  const baseR = size * 0.3;

  // Generate keyframe paths for each blob
  const blobs = [];
  for (let b = 0; b < blobCount; b++) {
    const paths = [];
    for (let k = 0; k < 4; k++) {
      paths.push(generateBlobPath(rng, cx, cy, baseR * (0.8 + b * 0.15), 0.4, points));
    }
    const offsetX = (rng() - 0.5) * size * 0.3;
    const offsetY = (rng() - 0.5) * size * 0.3;
    blobs.push({ paths, offsetX: Math.round(offsetX), offsetY: Math.round(offsetY) });
  }

  const svgBlobs = blobs.map((blob, i) => {
    return `    <path class="${id}__blob ${id}__blob--${i}" d="${blob.paths[0]}" transform="translate(${blob.offsetX}, ${blob.offsetY})"/>`;
  }).join('\n');

  const html = `<div id="${id}" class="${id}" aria-hidden="true">
  <svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
${svgBlobs}
  </svg>
</div>`;

  const colorVars = [
    'var(--color-accent-primary, oklch(0.6 0.15 260))',
    'var(--color-accent-secondary, oklch(0.5 0.2 310))',
    'var(--color-bg-surface, oklch(0.2 0.05 260))',
  ];

  const blobStyles = blobs.map((blob, i) => {
    const color = colorVars[i % colorVars.length];
    const dur = duration + i * 4;
    const delay = i * -3;
    return `.${id}__blob--${i} {
  fill: ${color};
  opacity: 0.3;
  animation: ${id}-morph-${i} ${dur}s ease-in-out ${delay}s infinite alternate;
  filter: blur(${40 + i * 10}px);
}

@keyframes ${id}-morph-${i} {
  0% { d: path("${blob.paths[0]}"); }
  33% { d: path("${blob.paths[1]}"); }
  66% { d: path("${blob.paths[2]}"); }
  100% { d: path("${blob.paths[3]}"); }
}`;
  }).join('\n\n');

  const css = `.${id} {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  overflow: hidden;
}

.${id} svg {
  width: 100%;
  height: 100%;
}

${blobStyles}

@media (prefers-reduced-motion: reduce) {
  .${id}__blob {
    animation: none !important;
  }
}`;

  const js = `/* Morphing blobs: pure CSS animation, no JS needed */`;

  return { html, css, js };
}

// ---------------------------------------------------------------------------
// 6. Wave Landscape — 3D perspective wave terrain
// ---------------------------------------------------------------------------

/**
 * Generate a 3D perspective wave landscape on Canvas 2D.
 *
 * @param {Object} options
 * @param {number} [options.lineCount=40]
 * @param {number} [options.pointsPerLine=80]
 * @param {number} [options.amplitude=30]
 * @param {number} [options.speed=0.01]
 * @param {number} [options.perspective=0.6] - Perspective foreshortening (0-1)
 * @param {string} [options.id='wave-landscape']
 * @returns {{ html: string, css: string, js: string }}
 */
export function waveLandscape({
  lineCount = 40,
  pointsPerLine = 80,
  amplitude = 30,
  speed = 0.01,
  perspective = 0.6,
  id = 'wave-landscape',
} = {}) {
  const html = `<canvas id="${id}" class="gen-art-canvas" aria-hidden="true"></canvas>`;

  const css = `#${id} {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  width: 100%;
  height: 100%;
}`;

  const js = `(function() {
  'use strict';
  const canvas = document.getElementById('${id}');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  ${PERLIN_NOISE}
  ${REDUCED_MOTION_CHECK}
  ${READ_CSS_COLORS}

  const LINE_COUNT = ${lineCount};
  const POINTS = ${pointsPerLine};
  const AMP = ${amplitude};
  const SPEED = ${speed};
  const PERSP = ${perspective};

  let W, H;
  function resize() {
    const dpr = Math.min(window.devicePixelRatio, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  const accent = parseColor(getCSSColor('--color-accent-primary', 'oklch(0.7 0.15 50)'));
  const bgStr = getCSSColor('--color-bg-base', '#0a0a0a');

  let t = 0;
  let animId;

  function draw() {
    ctx.fillStyle = bgStr;
    ctx.fillRect(0, 0, W, H);

    const centerY = H * 0.55;
    const startY = centerY;

    for (let line = 0; line < LINE_COUNT; line++) {
      const progress = line / LINE_COUNT; // 0 (front) to 1 (back)
      const yOffset = startY + progress * H * 0.4 * PERSP - H * 0.2;
      const scale = 1 - progress * PERSP * 0.5;
      const lineAlpha = (1 - progress * 0.8);

      ctx.strokeStyle = \`rgba(\${accent.r}, \${accent.g}, \${accent.b}, \${(lineAlpha * 0.4).toFixed(3)})\`;
      ctx.lineWidth = Math.max(0.5, (1 - progress) * 1.5);
      ctx.beginPath();

      for (let i = 0; i <= POINTS; i++) {
        const xNorm = i / POINTS;
        const x = xNorm * W;

        // Multi-octave noise for wave shape
        const n = noise2D(xNorm * 3 + t, line * 0.15 + t * 0.5)
                + noise2D(xNorm * 6 + t * 1.3, line * 0.3) * 0.4;
        const y = yOffset + n * AMP * scale;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    t += SPEED;
    animId = requestAnimationFrame(draw);
  }

  if (prefersReducedMotion) {
    draw();
    cancelAnimationFrame(animId);
  } else {
    draw();
  }
})();`;

  return { html, css, js };
}

// ---------------------------------------------------------------------------
// Style-based selection
// ---------------------------------------------------------------------------

const STYLE_MAP = {
  'dark-luxury': ['morphing-blobs', 'flow-field'],
  'brutalist': ['geometric-mesh', 'noise-gradient'],
  'glassmorphism': ['morphing-blobs', 'particle-constellation'],
  'editorial': ['flow-field', 'wave-landscape'],
  'organic': ['morphing-blobs', 'flow-field'],
  'cyberpunk': ['particle-constellation', 'geometric-mesh'],
  'swiss': ['geometric-mesh'],
  'japanese-minimalism': ['wave-landscape'],
  'retro-futurism': ['geometric-mesh', 'wave-landscape'],
  'minimalist': ['wave-landscape'],
  'maximalist': ['flow-field', 'particle-constellation', 'morphing-blobs'],
  'immersive': ['flow-field', 'morphing-blobs'],
  'vaporwave': ['noise-gradient', 'geometric-mesh'],
  'corporate-clean': ['particle-constellation'],
  'handcrafted': ['morphing-blobs', 'flow-field'],
};

const GENERATORS = {
  'flow-field': flowField,
  'noise-gradient': noiseGradient,
  'particle-constellation': particleConstellation,
  'geometric-mesh': geometricMesh,
  'morphing-blobs': morphingBlobs,
  'wave-landscape': waveLandscape,
};

// ---------------------------------------------------------------------------
// Generate from brief/tokens
// ---------------------------------------------------------------------------

/**
 * Auto-generate art code appropriate for a design's aesthetic.
 *
 * @param {Object} options
 * @param {string[]} [options.types] - Explicit list of art types to generate
 * @param {string} [options.style] - Aesthetic keyword
 * @param {number} [options.seed=42]
 * @returns {{ name: string, html: string, css: string, js: string }[]}
 */
export function generateSet({ types, style = '', seed = 42 } = {}) {
  const requested = types || STYLE_MAP[style] || ['flow-field'];
  const results = [];

  for (const type of requested) {
    const gen = GENERATORS[type];
    if (!gen) continue;
    const output = gen({ seed });
    results.push({ name: type, ...output });
  }

  return results;
}

/**
 * List all available generative art types.
 * @returns {string[]}
 */
export function listTypes() {
  return Object.keys(GENERATORS);
}

// ---------------------------------------------------------------------------
// File I/O helpers
// ---------------------------------------------------------------------------

/**
 * Write generated art snippets to a design's assets directory.
 *
 * @param {string} designDir - Path to design directory
 * @param {{ name: string, html: string, css: string, js: string }[]} arts
 * @returns {Promise<string[]>} Written file paths
 */
export async function writeAssets(designDir, arts) {
  const artDir = join(designDir, 'assets', 'art');
  await mkdir(artDir, { recursive: true });
  const paths = [];
  for (const art of arts) {
    const filePath = join(artDir, `${art.name}.json`);
    await writeFile(filePath, JSON.stringify({
      name: art.name,
      html: art.html,
      css: art.css,
      js: art.js,
    }, null, 2), 'utf-8');
    paths.push(filePath);
  }
  return paths;
}
