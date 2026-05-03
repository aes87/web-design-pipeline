(() => {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  let VIEW_X_MIN = 0, VIEW_X_MAX = 1920;
  let VIEW_Y_MIN = 0, VIEW_Y_MAX = 1080;

  document.documentElement.classList.add('js');

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const svg = document.querySelector('.circuit');
  const bgSvg = document.querySelector('.circuit-bg');
  if (!svg || !bgSvg) return;

  const latticeLayer   = document.createElementNS(SVG_NS, 'g');
  latticeLayer.setAttribute('class', 'circuit__lattice');
  latticeLayer.setAttribute('data-lattice', '');
  bgSvg.appendChild(latticeLayer);
  const componentLayer = document.createElementNS(SVG_NS, 'g');
  componentLayer.setAttribute('class', 'circuit__components');
  componentLayer.setAttribute('data-components', '');
  bgSvg.appendChild(componentLayer);
  const pulseLayer     = document.createElementNS(SVG_NS, 'g');
  pulseLayer.setAttribute('class', 'circuit__pulses');
  pulseLayer.setAttribute('data-pulses', '');
  bgSvg.appendChild(pulseLayer);

  const traces = [];
  const endpoints = [];
  const components = [];
  const bodyBoxes = [];

  const NAME_OUTER_VIAS_LOCKUP = [
    { x: -47, y: 55 }, { x: -28, y: 264 }, { x: 240, y: 50 },
    { x: 450, y: 240 }, { x: 678, y: 30 }, { x: 1010, y: 145 },
  ];
  const GROWTH_CENTER_LOCKUP = { x: 489, y: 145 };

  let NAME_OUTER_VIAS = NAME_OUTER_VIAS_LOCKUP.slice();
  let GROWTH_CENTER = { x: GROWTH_CENTER_LOCKUP.x, y: GROWTH_CENTER_LOCKUP.y };

  let _lockupPoint = null;
  function lockupToBg(p) {
    const ctm = svg.getScreenCTM && svg.getScreenCTM();
    if (!ctm) return { x: p.x, y: p.y };
    if (!_lockupPoint && svg.createSVGPoint) _lockupPoint = svg.createSVGPoint();
    if (_lockupPoint) {
      _lockupPoint.x = p.x;
      _lockupPoint.y = p.y;
      const s = _lockupPoint.matrixTransform(ctm);
      return { x: s.x, y: s.y };
    }
    return {
      x: ctm.a * p.x + ctm.c * p.y + ctm.e,
      y: ctm.b * p.x + ctm.d * p.y + ctm.f,
    };
  }

  function updateBgViewport() {
    const r = bgSvg.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width || window.innerWidth));
    const h = Math.max(1, Math.round(r.height || window.innerHeight));
    bgSvg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    bgSvg.setAttribute('preserveAspectRatio', 'none');
    VIEW_X_MIN = 0; VIEW_X_MAX = w;
    VIEW_Y_MIN = 0; VIEW_Y_MAX = h;
  }

  function refreshLockupMappedPoints() {
    NAME_OUTER_VIAS = NAME_OUTER_VIAS_LOCKUP.map(p => lockupToBg(p));
    GROWTH_CENTER = lockupToBg(GROWTH_CENTER_LOCKUP);
  }

  function registerExistingPaths() {
    const primaryPaths = svg.querySelectorAll('.circuit__primary path, .circuit__name path');
    primaryPaths.forEach(p => {
      const pts = parsePath(p.getAttribute('d'));
      if (pts && pts.length > 1) {
        const off = getCumulativeTranslate(p);
        const globalPts = pts.map(pt => lockupToBg({ x: pt.x + off.x, y: pt.y + off.y }));
        traces.push({ points: globalPts, kind: 'primary', pathEl: p });
        globalPts.forEach(pt => addEndpoint(pt.x, pt.y, true));
      }
    });
  }

  function parsePath(d) {
    if (!d) return null;
    const tokens = d.replace(/,/g, ' ').trim().split(/\s+/);
    const pts = [];
    let i = 0, firstPt = null, cmd = null;
    while (i < tokens.length) {
      const tok = tokens[i];
      if (tok === 'M' || tok === 'L') {
        cmd = tok;
        const x = parseFloat(tokens[i + 1]);
        const y = parseFloat(tokens[i + 2]);
        pts.push({ x, y });
        if (cmd === 'M') firstPt = { x, y };
        i += 3;
      } else if (tok === 'Z' || tok === 'z') {
        if (firstPt) pts.push({ x: firstPt.x, y: firstPt.y });
        i += 1;
      } else if (!isNaN(parseFloat(tok))) {
        const x = parseFloat(tokens[i]);
        const y = parseFloat(tokens[i + 1]);
        pts.push({ x, y });
        i += 2;
      } else {
        i += 1;
      }
    }
    return pts;
  }

  function getCumulativeTranslate(el) {
    let tx = 0, ty = 0, node = el;
    while (node && node !== svg) {
      const t = node.getAttribute && node.getAttribute('transform');
      if (t) {
        const m = t.match(/translate\(\s*(-?[\d.]+)[ ,]+(-?[\d.]+)\s*\)/);
        if (m) { tx += parseFloat(m[1]); ty += parseFloat(m[2]); }
      }
      node = node.parentNode;
    }
    return { x: tx, y: ty };
  }

  function addEndpoint(x, y, onPrimary = false) {
    const minDist = onPrimary ? 0.5 : 40;
    for (const ep of endpoints) {
      const dx = ep.x - x, dy = ep.y - y;
      if (Math.abs(dx) < minDist && Math.abs(dy) < minDist) {
        if (dx * dx + dy * dy < minDist * minDist) return ep;
      }
    }
    const ep = { x, y, seedsOnPrimary: onPrimary, createdAt: performance.now() };
    endpoints.push(ep);
    return ep;
  }

  function cornerMid(prev, c, next, r = 9) {
    const ax = prev.x - c.x, ay = prev.y - c.y;
    const bx = next.x - c.x, by = next.y - c.y;
    const la = Math.hypot(ax, ay), lb = Math.hypot(bx, by);
    if (la < 1e-3 || lb < 1e-3) return { x: c.x, y: c.y };
    const rr = Math.min(r, la * 0.49, lb * 0.49);
    const tax = c.x + (ax / la) * rr, tay = c.y + (ay / la) * rr;
    const tbx = c.x + (bx / lb) * rr, tby = c.y + (by / lb) * rr;
    return { x: 0.25 * tax + 0.5 * c.x + 0.25 * tbx, y: 0.25 * tay + 0.5 * c.y + 0.25 * tby };
  }

  function reuseOrCreateVia(x, y) {
    const EPS = 1.0;
    const faintVias = latticeLayer.querySelectorAll('circle.via.via--faint');
    for (const c of faintVias) {
      const cx = parseFloat(c.getAttribute('cx'));
      const cy = parseFloat(c.getAttribute('cy'));
      if (Math.abs(cx - x) <= EPS && Math.abs(cy - y) <= EPS) {
        return { el: c, reused: true };
      }
    }
    const c = document.createElementNS(SVG_NS, 'circle');
    c.setAttribute('cx', String(x));
    c.setAttribute('cy', String(y));
    c.setAttribute('r', '2.5');
    c.setAttribute('class', 'via via--faint');
    latticeLayer.appendChild(c);
    return { el: c, reused: false };
  }

  const exclusionZones = [];
  const EXCLUSION_PADDING = 8;

  function buildSvgExclusionZones() {
    for (let i = exclusionZones.length - 1; i >= 0; i--) {
      if (!exclusionZones[i].html) exclusionZones.splice(i, 1);
    }
    const sels = ['.circuit__glyphs path', '.circuit__name path', '.circuit__name circle',
                  '.circuit__primary path', '.circuit__primary circle'];
    sels.forEach(sel => svg.querySelectorAll(sel).forEach(el => {
      let r;
      try { r = el.getBoundingClientRect(); } catch (e) { return; }
      if (!r || (r.width === 0 && r.height === 0)) return;
      exclusionZones.push({
        x: r.left - EXCLUSION_PADDING,
        y: r.top  - EXCLUSION_PADDING,
        w: r.width  + EXCLUSION_PADDING * 2,
        h: r.height + EXCLUSION_PADDING * 2,
      });
    }));
  }

  function rebuildHtmlExclusionZones() {
    for (let i = exclusionZones.length - 1; i >= 0; i--) {
      if (exclusionZones[i].html) exclusionZones.splice(i, 1);
    }
    document.querySelectorAll('.hero__tagline, .terminal__label').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      exclusionZones.push({
        x: r.left - EXCLUSION_PADDING,
        y: r.top  - EXCLUSION_PADDING,
        w: r.width  + EXCLUSION_PADDING * 2,
        h: r.height + EXCLUSION_PADDING * 2,
        html: true,
      });
    });
  }

  function aabbIntersectsZone(box, zone, eps = 0) {
    return !(
      box.maxX <= zone.x + eps ||
      box.minX >= zone.x + zone.w - eps ||
      box.maxY <= zone.y + eps ||
      box.minY >= zone.y + zone.h - eps
    );
  }

  function pointInsideZone(p, zone, slack = 1.5) {
    return p.x >= zone.x - slack && p.x <= zone.x + zone.w + slack
        && p.y >= zone.y - slack && p.y <= zone.y + zone.h + slack;
  }

  function segmentHitsExclusion(a, b, ignoreZones) {
    if (exclusionZones.length === 0) return false;
    const box = {
      minX: Math.min(a.x, b.x), minY: Math.min(a.y, b.y),
      maxX: Math.max(a.x, b.x), maxY: Math.max(a.y, b.y),
    };
    for (const z of exclusionZones) {
      if (ignoreZones && ignoreZones.indexOf(z) !== -1) continue;
      if (aabbIntersectsZone(box, z)) return true;
    }
    return false;
  }

  function pointsHitExclusion(pts) {
    if (exclusionZones.length === 0) return false;
    const seedZones = exclusionZones.filter(z => pointInsideZone(pts[0], z));
    for (let i = 0; i < pts.length - 1; i++) {
      const ignore = (i === 0) ? seedZones : null;
      if (segmentHitsExclusion(pts[i], pts[i + 1], ignore)) return true;
      if (i > 0 && seedZones.length > 0) {
        for (const z of seedZones) if (pointInsideZone(pts[i + 1], z, -1)) return true;
      }
    }
    return false;
  }

  function ptsBoundingBox(pts) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of pts) {
      if (p.x < minX) minX = p.x; if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x; if (p.y > maxY) maxY = p.y;
    }
    return { minX, minY, maxX, maxY };
  }

  const COLLISION_MARGIN = 4;

  function segmentAABB(a, b, margin = COLLISION_MARGIN) {
    return {
      minX: Math.min(a.x, b.x) - margin,
      minY: Math.min(a.y, b.y) - margin,
      maxX: Math.max(a.x, b.x) + margin,
      maxY: Math.max(a.y, b.y) + margin,
    };
  }

  function aabbsOverlap(a, b) {
    return !(a.maxX < b.minX || a.minX > b.maxX || a.maxY < b.minY || a.minY > b.maxY);
  }

  function segmentCollides(a, b) {
    const newBox = segmentAABB(a, b, 3);
    for (const t of traces) {
      for (let i = 0; i < t.points.length - 1; i++) {
        const p = t.points[i];
        const q = t.points[i + 1];
        if (p.x === q.x && p.y === q.y) continue;
        const box = segmentAABB(p, q, 2);
        if (aabbsOverlap(newBox, box)) {
          const touchesA = (Math.abs(a.x - p.x) < 1 && Math.abs(a.y - p.y) < 1) ||
                           (Math.abs(a.x - q.x) < 1 && Math.abs(a.y - q.y) < 1);
          if (!touchesA) return true;
        }
      }
    }
    return false;
  }

  function inBounds(p) {
    return p.x > VIEW_X_MIN + 20 && p.x < VIEW_X_MAX - 20
        && p.y > VIEW_Y_MIN + 20 && p.y < VIEW_Y_MAX - 20;
  }

  function pointsInBounds(pts) {
    return pts.every(inBounds);
  }

  function polylineCollides(pts) {
    for (let i = 0; i < pts.length - 1; i++) {
      if (segmentCollides(pts[i], pts[i + 1])) return true;
    }
    return false;
  }

  function sampleBezier(p0, p1, p2, steps = 10) {
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
      const y = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;
      pts.push({ x, y });
    }
    return pts;
  }

  const DIRS_ORTHO = [
    { dx:  0, dy: -1 }, { dx:  0, dy:  1 },
    { dx:  1, dy:  0 }, { dx: -1, dy:  0 },
  ];

  const TOL_COS_TIGHT   = Math.cos(Math.PI *  75 / 180);
  const TOL_COS_STRICT  = Math.cos(Math.PI * 110 / 180);
  const TOL_COS_MEDIUM  = Math.cos(Math.PI * 140 / 180);
  const TOL_COS_RELAXED = Math.cos(Math.PI * 160 / 180);

  function outwardToleranceForElapsed(elapsedMs) {
    if (elapsedMs > 60000) return TOL_COS_RELAXED;
    if (elapsedMs > 20000) return TOL_COS_MEDIUM;
    if (elapsedMs > 5000)  return TOL_COS_STRICT;
    return TOL_COS_TIGHT;
  }

  function jitterEnvelopeForElapsed(elapsedMs) {
    if (elapsedMs > 60000) return 60 * Math.PI / 180;
    if (elapsedMs > 20000) return 45 * Math.PI / 180;
    if (elapsedMs > 5000)  return 30 * Math.PI / 180;
    return 18 * Math.PI / 180;
  }

  function outwardVectorForOrigin(origin) {
    const dx = origin.x - GROWTH_CENTER.x;
    const dy = origin.y - GROWTH_CENTER.y;
    const mag = Math.hypot(dx, dy);
    if (mag < 1e-3) return { dx: 1, dy: 0 };
    return { dx: dx / mag, dy: dy / mag };
  }

  function isDirectionOutward(dir, origin, tolCos) {
    const mag = Math.hypot(dir.dx, dir.dy);
    if (mag < 1e-3) return false;
    const ux = dir.dx / mag, uy = dir.dy / mag;
    const ov = outwardVectorForOrigin(origin);
    const cosA = ux * ov.dx + uy * ov.dy;
    return cosA >= tolCos - 1e-6;
  }

  function rotateDir(dir, radians) {
    const c = Math.cos(radians), s = Math.sin(radians);
    return { dx: dir.dx * c - dir.dy * s, dy: dir.dx * s + dir.dy * c };
  }

  function distanceToEdge(origin, dir) {
    const mag = Math.hypot(dir.dx, dir.dy);
    if (mag < 1e-3) return 0;
    const ux = dir.dx / mag, uy = dir.dy / mag;
    const inset = 24;
    let tMax = Infinity;
    if (ux > 1e-3) tMax = Math.min(tMax, (VIEW_X_MAX - inset - origin.x) / ux);
    if (ux < -1e-3) tMax = Math.min(tMax, (VIEW_X_MIN + inset - origin.x) / ux);
    if (uy > 1e-3) tMax = Math.min(tMax, (VIEW_Y_MAX - inset - origin.y) / uy);
    if (uy < -1e-3) tMax = Math.min(tMax, (VIEW_Y_MIN + inset - origin.y) / uy);
    return Math.max(0, tMax);
  }

  function perpDir(d) { return { dx: -d.dy, dy: d.dx }; }
  function snap(v) { return Math.round(v * 2) / 2; }
  function rand(min, max) { return min + Math.random() * (max - min); }
  function latticeScaleFor(w) {
    if (w < 480) return 0.50;
    if (w < 768) return 0.62;
    if (w < 1024) return 0.85;
    return 1.0;
  }
  let LATTICE_SCALE = latticeScaleFor(window.innerWidth);
  function S(n) { return n * LATTICE_SCALE; }
  function mv(p, v, n) { return { x: snap(p.x + v.dx * n * LATTICE_SCALE), y: snap(p.y + v.dy * n * LATTICE_SCALE) }; }
  function mv2(p, v1, n1, v2, n2) { return { x: snap(p.x + v1.dx * n1 * LATTICE_SCALE + v2.dx * n2 * LATTICE_SCALE), y: snap(p.y + v1.dy * n1 * LATTICE_SCALE + v2.dy * n2 * LATTICE_SCALE) }; }
  const LEAD_MIN = 22;
  function leadDist(n) { return Math.max(LEAD_MIN, n * LATTICE_SCALE); }
  function mvLead(p, v, n) { const d = leadDist(n); return { x: snap(p.x + v.dx * d), y: snap(p.y + v.dy * d) }; }

  function computeOutwardDir(origin, tolCos, jitterRad) {
    const base = outwardVectorForOrigin(origin);
    let dir = base;
    if (jitterRad) dir = rotateDir(base, jitterRad);
    if (!isDirectionOutward(dir, origin, tolCos)) dir = base;
    return dir;
  }

  const MIN_USEFUL_ROOM = 50;

  function originHasOutwardRoom(origin, tolCos, jitterEnvRad) {
    const env = jitterEnvRad || (30 * Math.PI / 180);
    for (let k = 0; k < 8; k++) {
      const j = (Math.random() - 0.5) * 2 * env;
      const dir = computeOutwardDir(origin, tolCos, j);
      if (!isDirectionOutward(dir, origin, tolCos)) continue;
      const d = distanceToEdge(origin, dir);
      if (d >= MIN_USEFUL_ROOM) return { away: dir, edgeDist: d, jitter: Math.abs(j) };
    }
    return null;
  }

  function generateOrthogonal(origin, away, room) {
    const segCount = 2 + Math.floor(Math.random() * 4);
    const pts = [{ x: origin.x, y: origin.y }];
    let prevDir = null;
    let remaining = Math.min(room - 16, rand(140, Math.max(180, room - 40)));

    for (let s = 0; s < segCount && remaining > 16; s++) {
      const choices = DIRS_ORTHO.slice().sort((a, b) => {
        const sa = (a.dx * away.dx + a.dy * away.dy);
        const sb = (b.dx * away.dx + b.dy * away.dy);
        return sb - sa + (Math.random() - 0.5) * 0.8;
      });
      let placed = false;
      for (const d of choices) {
        if (prevDir && d.dx === -prevDir.dx && d.dy === -prevDir.dy) continue;
        if (prevDir && s > 0 && d.dx === prevDir.dx && d.dy === prevDir.dy) continue;
        const len = Math.min(remaining, rand(32, 110));
        const last = pts[pts.length - 1];
        const next = { x: snap(last.x + d.dx * len), y: snap(last.y + d.dy * len) };
        pts.push(next);
        remaining -= len;
        prevDir = d;
        placed = true;
        break;
      }
      if (!placed) break;
    }
    if (pts.length < 2) return null;
    const eps = pts.map((p, i) => {
      if (i > 0 && i < pts.length - 1) {
        const m = cornerMid(pts[i - 1], p, pts[i + 1]);
        return { x: m.x, y: m.y };
      }
      return { x: p.x, y: p.y };
    });
    return {
      paths: [segRounded(pts)],
      vias: pts.map(p => (via(p))),
      endpoints: eps,
    };
  }

  function generateWandering(origin, away, room) {
    const segs = 3 + Math.floor(Math.random() * 5);
    const pts = [{ x: origin.x, y: origin.y }];
    let cursor = { x: origin.x, y: origin.y };
    let dir = { dx: away.dx, dy: away.dy };
    let remaining = room - 20;
    for (let i = 0; i < segs && remaining > 35; i++) {
      const turnDeg = (Math.random() - 0.5) * 130; // ±65°
      const c = Math.cos(turnDeg * Math.PI / 180);
      const s = Math.sin(turnDeg * Math.PI / 180);
      let nd = { dx: dir.dx * c - dir.dy * s, dy: dir.dx * s + dir.dy * c };
      if (nd.dx * away.dx + nd.dy * away.dy < -0.3) {
        nd = { dx: -nd.dx, dy: -nd.dy };
      }
      const len = Math.min(remaining, rand(45, 95));
      cursor = { x: snap(cursor.x + nd.dx * len), y: snap(cursor.y + nd.dy * len) };
      pts.push(cursor);
      remaining -= len;
      dir = nd;
    }
    if (pts.length < 2) return null;
    return {
      paths: [segSmooth(pts)],
      vias: [via(pts[0]), via(pts[pts.length - 1])],
      endpoints: [{ x: pts[pts.length - 1].x, y: pts[pts.length - 1].y }],
    };
  }

  function generateDiagonal45(origin, away, room) {
    const pts = [{ x: origin.x, y: origin.y }];
    if (Math.random() < 0.5) {
      const len = Math.min(rand(30, 70), room * 0.3);
      const next = { x: snap(origin.x + away.dx * len), y: snap(origin.y + away.dy * len) };
      pts.push(next);
    }
    const last = pts[pts.length - 1];
    const sx = Math.sign(away.dx || (Math.random() < 0.5 ? 1 : -1));
    const sy = Math.sign(away.dy || (Math.random() < 0.5 ? 1 : -1));
    const dx = sx !== 0 ? sx : (Math.random() < 0.5 ? 1 : -1);
    const dy = sy !== 0 ? sy : (Math.random() < 0.5 ? 1 : -1);
    const diagLen = Math.min(rand(60, 140), (room - 20) * 0.7);
    const unit = diagLen / Math.SQRT2;
    const end = { x: snap(last.x + dx * unit), y: snap(last.y + dy * unit) };
    pts.push(end);
    if (pts.length < 2) return null;
    return {
      paths: [segRounded(pts)],
      vias: pts.map(p => (via(p))),
      endpoints: [end],
    };
  }

  const ARC_SWEEPS_DEG = [30, 45, 60, 75, 90];

  function buildArcGeometry(origin, away, room, sweepDeg) {
    const sweep = sweepDeg * Math.PI / 180;
    const maxRadius = room * (sweepDeg >= 75 ? 0.5 : 0.6);
    const radius = Math.min(rand(50, 120), Math.max(40, maxRadius));
    const tangent = perpDir(away);
    if (Math.random() < 0.5) { tangent.dx = -tangent.dx; tangent.dy = -tangent.dy; }
    const sinS = Math.sin(sweep), cosS = Math.cos(sweep);
    const rotSign = (tangent.dx * away.dy - tangent.dy * away.dx) > 0 ? -1 : 1;
    const rx = tangent.dx * cosS + rotSign * tangent.dy * sinS;
    const ry = tangent.dy * cosS - rotSign * tangent.dx * sinS;
    const end = { x: snap(origin.x + rx * radius), y: snap(origin.y + ry * radius) };
    const mid = { x: (origin.x + end.x) / 2, y: (origin.y + end.y) / 2 };
    const bulgeDir = { dx: -(end.y - origin.y), dy: (end.x - origin.x) };
    const bulgeLen = Math.hypot(bulgeDir.dx, bulgeDir.dy) || 1;
    const bulgeFactor = sweepDeg >= 90 ? 0.45 : sweepDeg >= 60 ? 0.35 : 0.28;
    const bulge = radius * bulgeFactor;
    const side = (bulgeDir.dx * away.dx + bulgeDir.dy * away.dy) >= 0 ? 1 : -1;
    const control = {
      x: mid.x + (bulgeDir.dx / bulgeLen) * bulge * side,
      y: mid.y + (bulgeDir.dy / bulgeLen) * bulge * side,
    };
    const sampled = sampleBezier(origin, control, end, 16);
    const d = `M ${origin.x} ${origin.y} Q ${snap(control.x)} ${snap(control.y)} ${end.x} ${end.y}`;
    return { d, sampled, end, control, radius, sweepDeg };
  }

  function generateArc(origin, away, room) {
    const sweepDeg = ARC_SWEEPS_DEG[Math.floor(Math.random() * ARC_SWEEPS_DEG.length)];
    const a = buildArcGeometry(origin, away, room, sweepDeg);
    return {
      paths: [{ d: a.d, sampledPts: a.sampled }],
      vias: [via(a.end)],
      endpoints: [a.end],
    };
  }

  function generateSerpentineCurve(origin, away, room) {
    const perp = perpDir(away);
    const bumps = 3 + Math.floor(Math.random() * 3); // 3–5
    const bumpLen = Math.min(rand(28, 42), (room - 30) / bumps);
    if (bumpLen < 18) return null;
    const amp = rand(12, 20);
    const pts = [origin];
    let cursor = origin;
    let side = Math.random() < 0.5 ? 1 : -1;
    let dStr = `M ${origin.x} ${origin.y}`;
    for (let i = 0; i < bumps; i++) {
      const next = { x: snap(cursor.x + away.dx * bumpLen),
        y: snap(cursor.y + away.dy * bumpLen),
      };
      const ctrl = {
        x: snap((cursor.x + next.x) / 2 + perp.dx * amp * side),
        y: snap((cursor.y + next.y) / 2 + perp.dy * amp * side),
      };
      dStr += ` Q ${ctrl.x} ${ctrl.y} ${next.x} ${next.y}`;
      const sampled = sampleBezier(cursor, ctrl, next, 6);
      for (let k = 1; k < sampled.length; k++) pts.push(sampled[k]);
      cursor = next;
      side = -side;
    }
    return {
      paths: [{ d: dStr, sampledPts: pts }],
      vias: [
        via(origin),
        via(cursor),
      ],
      endpoints: [cursor],
    };
  }

  const INLINE_KINDS = ['resistor', 'diode', 'capacitor', 'fuse', 'switch', 'varistor'];
  function generateArcWithComponent(origin, away, room) {
    const sweepDeg = [45, 75, 90, 120][Math.floor(Math.random() * 4)];
    const arc = buildArcGeometry(origin, away, room, sweepDeg);
    const s = arc && arc.sampled;
    if (!s || s.length < 5) return null;
    const midIdx = Math.floor(s.length / 2);
    const tan = { dx: s[midIdx + 1].x - s[midIdx - 1].x, dy: s[midIdx + 1].y - s[midIdx - 1].y };
    const tmag = Math.hypot(tan.dx, tan.dy);
    if (tmag < 1e-3) return null;
    const tdir = { dx: tan.dx / tmag, dy: tan.dy / tmag };
    function walk(dist, sign) {
      let acc = 0, idx = midIdx, cur = s[idx];
      while (true) {
        const ni = idx + sign;
        if (ni < 0 || ni >= s.length) return { pt: cur, idx };
        const nxt = s[ni];
        const sl = Math.hypot(nxt.x - cur.x, nxt.y - cur.y);
        if (acc + sl >= dist) {
          const t = (dist - acc) / sl;
          return { pt: { x: snap(cur.x + (nxt.x - cur.x) * t), y: snap(cur.y + (nxt.y - cur.y) * t) }, idx };
        }
        acc += sl; idx = ni; cur = nxt;
      }
    }
    const back = walk(14, -1), fwd = walk(14, 1);
    const inPts = [origin];
    for (let i = 1; i <= back.idx; i++) inPts.push(s[i]);
    inPts.push(back.pt);
    const outPts = [fwd.pt];
    for (let i = fwd.idx + 1; i < s.length; i++) outPts.push(s[i]);
    const comp = buildInlineComponent(back.pt, fwd.pt, tdir,
      INLINE_KINDS[Math.floor(Math.random() * INLINE_KINDS.length)]);
    if (!comp) return null;
    return {
      paths: [
        seg(inPts),
        ...comp.paths,
        seg(outPts),
      ],
      vias: [
        via(origin),
        via(arc.end),
      ],
      endpoints: [arc.end],
    };
  }

  function buildInlineComponent(a, b, tdir, kind) {
    const perp = { dx: -tdir.dy, dy: tdir.dx };
    const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (len < 12) return null;
    const P = (px, py) => ({ x: snap(px), y: snap(py) });
    const off = (p, ax, ay) => P(p.x + tdir.dx * ax + perp.dx * ay,
                                  p.y + tdir.dy * ax + perp.dy * ay);

    if (kind === 'resistor' || kind === 'varistor') {
      const peaks = 3, amp = 5, base = (len - 4) / peaks;
      const pts = [a];
      let cursor = a, side = 1;
      for (let i = 0; i < peaks; i++) {
        pts.push(off(cursor, base / 2, amp * side));
        cursor = off(cursor, base, 0);
        pts.push(cursor);
        side = -side;
      }
      pts[pts.length - 1] = b;
      const paths = [seg(pts)];
      if (kind === 'varistor') {
        const ss = off(a, -2, -amp), se = off(b, 2, amp);
        paths.push(seg([ss, se]));
      }
      return { paths };
    }
    if (kind === 'diode') {
      const triH = 8, bH = 4;
      const back = off({x:cx,y:cy}, -triH/2, 0), tip = off({x:cx,y:cy}, triH/2, 0);
      const bt = off(back, 0,  triH/2), bb = off(back, 0, -triH/2);
      const barT = off(tip, 0, bH), barB = off(tip, 0, -bH);
      return { paths: [
        seg([a, back]),
        seg([bt, bb, tip, bt]),
        seg([barT, barB]),
        seg([tip, b]),
      ] };
    }
    if (kind === 'capacitor') {
      const gap = 5, ph = 6;
      const pA = off({x:cx,y:cy}, -gap/2, 0), pB = off({x:cx,y:cy}, gap/2, 0);
      return { paths: [
        seg([a, pA]),
        seg([off(pA, 0, ph), off(pA, 0, -ph)]),
        seg([off(pB, 0, ph), off(pB, 0, -ph)]),
        seg([pB, b]),
      ] };
    }
    if (kind === 'fuse') {
      const rW = Math.min(20, len - 6), rH = 3;
      const rs = off({x:cx,y:cy}, -rW/2, 0), re = off({x:cx,y:cy}, rW/2, 0);
      const tl = off(rs, 0, rH), bl = off(rs, 0, -rH);
      const tr = off(re, 0, rH), br = off(re, 0, -rH);
      return { paths: [
        seg([a, rs]), seg([tl, tr, br, bl, tl]),
        seg([rs, re]), seg([re, b]),
      ] };
    }
    if (kind === 'switch') {
      const gap = Math.min(10, len * 0.4);
      const cL = off({x:cx,y:cy}, -gap/2, 0), cR = off({x:cx,y:cy}, gap/2, 0);
      const armLen = gap * 0.85;
      const armEnd = off(cL, Math.cos(Math.PI/6)*armLen, Math.sin(Math.PI/6)*armLen);
      return { paths: [seg([a, cL]), seg([cL, armEnd]), seg([cR, b])] };
    }
    return null;
  }

  function generateSerpentineMeander(origin, away) {
    const perp = perpDir(away);
    const uCount = 3 + Math.floor(Math.random() * 4);
    const uAmp = rand(10, 16);
    const uPeriod = rand(8, 14);
    const pts = [{ x: origin.x, y: origin.y }];
    const leadIn = rand(16, 30);
    pts.push({
      x: snap(origin.x + away.dx * leadIn),
      y: snap(origin.y + away.dy * leadIn),
    });
    let cursor = pts[pts.length - 1];
    let side = 1;
    for (let i = 0; i < uCount; i++) {
      const outward = { x: snap(cursor.x + perp.dx * uAmp * side), y: snap(cursor.y + perp.dy * uAmp * side) };
      pts.push(outward);
      const across = { x: snap(outward.x + away.dx * uPeriod), y: snap(outward.y + away.dy * uPeriod) };
      pts.push(across);
      const back = { x: snap(across.x - perp.dx * uAmp * side), y: snap(across.y - perp.dy * uAmp * side) };
      pts.push(back);
      cursor = back;
      side = -side;
    }
    const leadOut = rand(10, 18);
    pts.push({
      x: snap(cursor.x + away.dx * leadOut),
      y: snap(cursor.y + away.dy * leadOut),
    });

    return {
      paths: [segRounded(pts)],
      vias: [
        via(pts[0]),
        via(pts[pts.length-1]),
      ],
      endpoints: [pts[pts.length - 1]],
    };
  }

  function generateInvertedFAntenna(origin, away, room) {
    const perp = perpDir(away);
    const runLen = Math.min(rand(120, 200), room - 20);
    const end = {
      x: snap(origin.x + away.dx * runLen),
      y: snap(origin.y + away.dy * runLen),
    };
    const pts = [origin, end];

    const stubs = [];
    const stubCount = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < stubCount; i++) {
      const t = rand(0.3, 0.75);
      const anchor = {
        x: snap(origin.x + (end.x - origin.x) * t),
        y: snap(origin.y + (end.y - origin.y) * t),
      };
      const stubSide = i === 0 ? 1 : -1;
      const stubLen = rand(20, 50);
      const tip = {
        x: snap(anchor.x + perp.dx * stubLen * stubSide),
        y: snap(anchor.y + perp.dy * stubLen * stubSide),
      };
      stubs.push({ anchor, tip });
    }

    const paths = [seg(pts)];
    const vias = [
      via(origin),
      via(end),
    ];
    stubs.forEach(s => {
      const stubPts = [s.anchor, s.tip];
      paths.push(seg(stubPts));
      vias.push(via(s.anchor));
      vias.push(via(s.tip));
    });
    return { paths, vias, endpoints: [], stubValid: true };
  }

  function generateZigzagAntenna(origin, away, room) {
    const perp = perpDir(away);
    const legs = Math.min(5 + Math.floor(Math.random() * 5), Math.floor(room / 28));
    const legLen = rand(12, 20);
    const pts = [{ x: origin.x, y: origin.y }];
    let cursor = pts[0];
    let side = 1;
    for (let i = 0; i < legs; i++) {
      const across = { x: snap(cursor.x + perp.dx * legLen * side), y: snap(cursor.y + perp.dy * legLen * side) };
      pts.push(across);
      const forward = { x: snap(across.x + away.dx * legLen), y: snap(across.y + away.dy * legLen) };
      pts.push(forward);
      cursor = forward;
      side = -side;
    }
    return {
      paths: [segRounded(pts)],
      vias: [
        via(pts[0]),
        via(pts[pts.length-1]),
      ],
      endpoints: [],
      stubValid: true,
    };
  }

  function generateGroundTermination(origin, away) {
    const perp = perpDir(away);
    const leadLen = rand(30, 70);
    const lead = { x: snap(origin.x + away.dx * leadLen), y: snap(origin.y + away.dy * leadLen) };
    const spacing = 3;
    const widths = [14, 9, 4];
    const paths = [seg([origin, lead])];
    for (let i = 0; i < 3; i++) {
      const cx = snap(lead.x + away.dx * spacing * (i + 1));
      const cy = snap(lead.y + away.dy * spacing * (i + 1));
      const half = widths[i] / 2;
      const a = { x: snap(cx + perp.dx * half), y: snap(cy + perp.dy * half) };
      const b = { x: snap(cx - perp.dx * half), y: snap(cy - perp.dy * half) };
      paths.push(segR([a, b], 'ground-bar'));
    }
    return { paths, vias: [via(origin)], endpoints: [], stubValid: true };
  }

  function generateVoltageRailTermination(origin, away) {
    const perp = perpDir(away);
    const leadLen = rand(40, 90);
    const lead = { x: snap(origin.x + away.dx * leadLen), y: snap(origin.y + away.dy * leadLen) };
    const half = rand(20, 40) / 2;
    const railA = { x: snap(lead.x + perp.dx * half), y: snap(lead.y + perp.dy * half) };
    const railB = { x: snap(lead.x - perp.dx * half), y: snap(lead.y - perp.dy * half) };
    return {
      paths: [
        seg([origin, lead]),
        segR([railA, railB], 'rail'),
      ],
      vias: [via(origin)],
      endpoints: [],
      stubValid: true,
    };
  }

  function generateResistorZigzag(origin, away, room) {
    const perp = perpDir(away);
    const peaks = 3 + Math.floor(Math.random() * 3);
    const pts = [origin];
    pts.push(mvLead(origin, away, 28));
    let cursor = pts[pts.length - 1], side = 1;
    for (let i = 0; i < peaks; i++) {
      pts.push(mv2(cursor, away, 5, perp, 8 * side));
      cursor = mv(cursor, away, 10);
      pts.push(cursor);
      side = -side;
    }
    pts.push(mvLead(cursor, away, 28));
    return {
      paths: [seg(pts)],
      vias: [via(pts[0]), via(pts[pts.length - 1])],
      endpoints: [pts[pts.length - 1]],
      bodyOnly: true,
    };
  }

  function generateCapacitorOrInductor(origin, away, room) {
    if (Math.random() < 0.5) return generateCapacitor(origin, away);
    return generateInductor(origin, away, room);
  }

  function generateCapacitor(origin, away) {
    const perp = perpDir(away);
    const plateA = mvLead(origin, away, 30);
    const plateB = mv(plateA, away, 8);
    const endPt = mvLead(plateB, away, 30);
    const paths = [
      seg([origin, plateA]),
      seg([mv(plateA, perp, 11), mv(plateA, perp, -11)]),
      seg([mv(plateB, perp, 11), mv(plateB, perp, -11)]),
      seg([plateB, endPt]),
    ];
    return { paths, vias: [via(origin), via(endPt)], endpoints: [endPt], bodyOnly: true };
  }

  function generateInductor(origin, away, room) {
    const perp = perpDir(away);
    const bumps = 4 + Math.floor(Math.random() * 3);
    const startBumps = mvLead(origin, away, 24);
    const paths = [seg([origin, startBumps])];
    let cursor = startBumps;
    for (let i = 0; i < bumps; i++) {
      const next = mv(cursor, away, 18);
      const ctrl = mv2({x: (cursor.x + next.x)/2, y: (cursor.y + next.y)/2}, perp, 13.5, away, 0);
      const d = `M ${cursor.x} ${cursor.y} Q ${ctrl.x} ${ctrl.y} ${next.x} ${next.y}`;
      paths.push({ d, sampledPts: sampleBezier(cursor, ctrl, next, 6) });
      cursor = next;
    }
    const endPt = mvLead(cursor, away, 24);
    paths.push(seg([cursor, endPt]));

    return {
      paths,
      vias: [
        via(origin),
        via(endPt),
      ],
      endpoints: [endPt],
      bodyOnly: true,
    };
  }

  function buildDiodeBody(origin, away, kind) {
    const perp = perpDir(away);
    if (kind === 'zener') {
      const bar = mvLead(origin, away, 28);
      const barTop = mv(bar, perp, 9);
      const barBot = mv(bar, perp, -9);
      const triBase = mv(bar, away, 17);
      const triBaseTop = mv(triBase, perp, 9);
      const triBaseBot = mv(triBase, perp, -9);
      const endPt = mvLead(triBase, away, 24);
      return { paths: [
        seg([origin, bar]),
        seg([barTop, barBot]),
        seg([triBaseTop, triBaseBot, bar, triBaseTop]),
        seg([triBase, endPt]),
        seg([mv2(barTop, perp, 5, away, -3), barTop]),
        seg([barBot, mv2(barBot, perp, -5, away, 3)]),
      ], vias: [via(origin), via(endPt)], endpoints: [endPt], bodyOnly: true };
    }
    const triBack = mvLead(origin, away, 28);
    const triBackTop = mv(triBack, perp, 9);
    const triBackBot = mv(triBack, perp, -9);
    const triTip = mv(triBack, away, 17);
    const barTop = mv(triTip, perp, 9);
    const barBot = mv(triTip, perp, -9);
    const endPt = mvLead(triTip, away, 24);
    const paths = [
      seg([origin, triBack]),
      seg([triBackTop, triBackBot, triTip, triBackTop]),
      seg([barTop, barBot]),
      seg([triTip, endPt]),
    ];
    if (kind === 'schottky') {
      paths.push(seg([mv(barTop, away, -5), barTop]));
      paths.push(seg([barBot, mv(barBot, away, 5)]));
    }
    return { paths, vias: [via(origin), via(endPt)], endpoints: [endPt], bodyOnly: true };
  }
  function generateDiode(o, a)         { return buildDiodeBody(o, a, 'plain'); }
  function generateSchottkyDiode(o, a) { return buildDiodeBody(o, a, 'schottky'); }
  function generateZenerDiode(o, a)    { return buildDiodeBody(o, a, 'zener'); }

  function buildTriacBody(origin, away, hasGate) {
    const perp = perpDir(away);
    const back = mvLead(origin, away, 24);
    const center = mv(back, away, 14);
    const front = mv(center, away, 14);
    const backTop = mv(back, perp, 13);
    const backBot = mv(back, perp, -13);
    const frontTop = mv(front, perp, 13);
    const frontBot = mv(front, perp, -13);
    const barTop = mv(center, perp, 10);
    const barBot = mv(center, perp, -10);
    const endPt = mv(front, away, rand(18, 28));
    const paths = [
      seg([origin, back]),
      seg([backTop, backBot, center, backTop]),
      seg([frontTop, frontBot, center, frontTop]),
      seg([barTop, barBot]),
      seg([front, endPt]),
    ];
    const vias = [via(origin), via(endPt)];
    const endsArr = [endPt];
    if (hasGate) {
      const gateAnchor = mv(center, perp, -10);
      const diag = { dx: -away.dx - perp.dx, dy: -away.dy - perp.dy };
      const dmag = Math.hypot(diag.dx, diag.dy);
      const ndiag = { dx: diag.dx / dmag, dy: diag.dy / dmag };
      const gateEnd = mv(gateAnchor, ndiag, rand(20, 32));
      paths.push(seg([gateAnchor, gateEnd]));
      vias.push(via(gateEnd));
      endsArr.push(gateEnd);
    }
    return { paths, vias, endpoints: endsArr, bodyOnly: true };
  }
  function generateTriac(o, a) { return buildTriacBody(o, a, true); }
  function generateDiac(o, a)  { return buildTriacBody(o, a, false); }

  function generateVaristor(origin, away) {
    const perp = perpDir(away);
    const peaks = 3, amp = 11;
    const pts = [origin, mvLead(origin, away, 22)];
    let cursor = pts[1], side = 1;
    const start = cursor;
    for (let i = 0; i < peaks; i++) {
      pts.push(mv2(cursor, away, 7, perp, amp * side));
      cursor = mv(cursor, away, 14);
      pts.push(cursor);
      side = -side;
    }
    pts.push(mv(cursor, away, rand(14, 22)));
    const slashStart = mv2(start, away, -4, perp, -amp);
    const slashEnd = mv2(slashStart, away, 14 * peaks + 8, perp, amp * 2);
    return {
      paths: [seg(pts), seg([slashStart, slashEnd])],
      vias: [via(pts[0]), via(pts[pts.length - 1])],
      endpoints: [pts[pts.length - 1]],
      bodyOnly: true,
    };
  }

  function generateFuse(origin, away) {
    const perp = perpDir(away);
    const rectStart = mvLead(origin, away, 24);
    const rectEnd = mv(rectStart, away, 24);
    const endPt = mvLead(rectEnd, away, 24);
    const tl = mv(rectStart, perp, 4), bl = mv(rectStart, perp, -4);
    const tr = mv(rectEnd, perp, 4), br = mv(rectEnd, perp, -4);
    return {
      paths: [
        seg([origin, rectStart]),
        seg([tl, tr, br, bl, tl]),
        seg([rectStart, rectEnd]),
        seg([rectEnd, endPt]),
      ],
      vias: [via(origin), via(endPt)],
      endpoints: [endPt],
      bodyOnly: true,
    };
  }

  function circleD(cx, cy, r) {
    return `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0`;
  }
  function poleCircle(p, r = 3.5) {
    return { d: circleD(p.x, p.y, r), sampledPts: [{ x: p.x, y: p.y }] };
  }

  function generateSwitch(origin, away) {
    const perp = perpDir(away);
    const ps = Math.random() < 0.5 ? 1 : -1;
    const py = { dx: perp.dx * ps, dy: perp.dy * ps };
    const cL = mvLead(origin, away, 26);
    const cR = mv(cL, away, 30);
    const endPt = mvLead(cR, away, 26);
    const armLen = 30;
    const ca = Math.cos(Math.PI / 6), sa = Math.sin(Math.PI / 6);
    const armEnd = mv2(cL, away, ca * armLen, py, sa * armLen);
    return {
      paths: [
        seg([origin, cL]),
        poleCircle(cL),
        seg([cL, armEnd]),
        poleCircle(cR),
        seg([cR, endPt]),
      ],
      vias: [via(origin), via(endPt)],
      endpoints: [endPt],
      bodyOnly: true,
    };
  }

  function generateClosedSwitch(origin, away) {
    const perp = perpDir(away);
    const ps = Math.random() < 0.5 ? 1 : -1;
    const py = { dx: perp.dx * ps, dy: perp.dy * ps };
    const cL = mvLead(origin, away, 26);
    const cR = mv(cL, away, 30);
    const endPt = mvLead(cR, away, 26);
    const lift = mv2(cR, away, 4, py, 5);
    return {
      paths: [
        seg([origin, cL]),
        poleCircle(cL),
        seg([cL, lift]),
        poleCircle(cR),
        seg([cR, endPt]),
      ],
      vias: [via(origin), via(endPt)],
      endpoints: [endPt],
      bodyOnly: true,
    };
  }

  function generateBatteryCell(origin, away) {
    const perp = perpDir(away);
    const longC  = mvLead(origin, away, 30);
    const shortC = mv(longC, away, 10);
    const endPt  = mvLead(shortC, away, 30);
    const labelSide = Math.random() < 0.5 ? 1 : -1;
    const plusC = mv2(longC, perp, 19 * labelSide, away, -7);
    const minusC = mv2(shortC, perp, 13 * labelSide, away, 7);
    return {
      paths: [
        seg([origin, longC]),
        seg([mv(longC,  perp,  14), mv(longC,  perp, -14)]),
        seg([mv(shortC, perp,   8), mv(shortC, perp,  -8)]),
        seg([shortC, endPt]),
        seg([mv(plusC, away, -3), mv(plusC, away, 3)]),
        seg([mv(plusC, perp, -3 * labelSide), mv(plusC, perp, 3 * labelSide)]),
        seg([mv(minusC, away, -3), mv(minusC, away, 3)]),
      ],
      vias: [via(origin), via(endPt)],
      endpoints: [endPt],
      bodyOnly: true,
    };
  }

  function generateThermistor(origin, away) {
    const perp = perpDir(away);
    const peaks = 4;
    const pts = [origin];
    pts.push(mvLead(origin, away, 28));
    let cursor = pts[pts.length - 1], side = 1;
    const bodyStart = cursor;
    for (let i = 0; i < peaks; i++) {
      pts.push(mv2(cursor, away, 5, perp, 8 * side));
      cursor = mv(cursor, away, 10);
      pts.push(cursor);
      side = -side;
    }
    pts.push(mvLead(cursor, away, 28));
    const slashStart = mv2(bodyStart, away, -4, perp, -13);
    const slashEnd   = mv2(bodyStart, away, 10 * peaks + 4, perp, 13);
    const hookEnd    = mv(slashStart, perp, -5);
    return {
      paths: [seg(pts), seg([hookEnd, slashStart, slashEnd])],
      vias: [via(pts[0]), via(pts[pts.length - 1])],
      endpoints: [pts[pts.length - 1]],
      bodyOnly: true,
    };
  }

  function generatePhotodiode(origin, away) {
    const perp = perpDir(away);
    const triBack = mvLead(origin, away, 28);
    const triBackTop = mv(triBack, perp, 9);
    const triBackBot = mv(triBack, perp, -9);
    const triTip = mv(triBack, away, 17);
    const barTop = mv(triTip, perp, 9);
    const barBot = mv(triTip, perp, -9);
    const endPt = mvLead(triTip, away, 24);
    const arrowSide = Math.random() < 0.5 ? 1 : -1;
    const bodyMid = mv(origin, away, rand(20, 32) + 8);
    const headInside = (anchor) => {
      const tip   = mv(anchor, perp,  4 * arrowSide);
      const start = mv(anchor, perp, 16 * arrowSide);
      const ha = mv2(tip, perp, 2 * arrowSide, away,  2);
      const hb = mv2(tip, perp, 2 * arrowSide, away, -2);
      return [seg([start, tip]), seg([ha, tip, hb])];
    };
    const arr1 = headInside(mv(bodyMid, away, -3));
    const arr2 = headInside(mv(bodyMid, away,  6));
    return {
      paths: [
        seg([origin, triBack]),
        seg([triBackTop, triBackBot, triTip, triBackTop]),
        seg([barTop, barBot]),
        seg([triTip, endPt]),
        ...arr1, ...arr2,
      ],
      vias: [via(origin), via(endPt)],
      endpoints: [endPt],
      bodyOnly: true,
    };
  }

  function generateMOSFETInCircle(origin, away, isN) {
    const perp = perpDir(away);
    const ps = Math.random() < 0.5 ? 1 : -1;
    const py = { dx: perp.dx * ps, dy: perp.dy * ps };
    const r = S(30);
    const bodyCenter = mv(origin, away, rand(28, 44) + r);
    const baseEdge = mv(bodyCenter, away, -r);

    const gateC = mv(bodyCenter, away, -r * 0.34);
    const gateHalf = r * 0.55;
    const gateTop = mv(gateC, py, gateHalf);
    const gateBot = mv(gateC, py, -gateHalf);

    const channelC = mv(bodyCenter, away, -r * 0.16);
    const channelHalf = r * 0.6;
    const channelTop = mv(channelC, py, channelHalf);
    const channelBot = mv(channelC, py, -channelHalf);

    const exitDX = r * 0.42;
    const exitDY = Math.sqrt(r * r - exitDX * exitDX);
    const drainEdge  = mv2(bodyCenter, away, exitDX, py,  exitDY);
    const sourceEdge = mv2(bodyCenter, away, exitDX, py, -exitDY);
    const drainEnd  = mv(drainEdge, py, 28);
    const sourceEnd = mv(sourceEdge, py, -28);

    const sDx = sourceEdge.x - channelBot.x;
    const sDy = sourceEdge.y - channelBot.y;
    const sLen = Math.hypot(sDx, sDy);
    const sDir = { dx: sDx / sLen, dy: sDy / sLen };
    const arrowT = isN ? 0.38 : 0.62;
    const arrowAnchor = {
      x: channelBot.x + sDx * arrowT,
      y: channelBot.y + sDy * arrowT,
    };
    const arrowDir = isN ? { dx: -sDir.dx, dy: -sDir.dy } : sDir;
    const arrowPerp = { dx: -arrowDir.dy, dy: arrowDir.dx };
    const tipLen = 7;
    const tip = mv(arrowAnchor, arrowDir, tipLen * 0.55);
    const baseLeft  = mv2(arrowAnchor, arrowDir, -tipLen * 0.45, arrowPerp,  tipLen * 0.55);
    const baseRight = mv2(arrowAnchor, arrowDir, -tipLen * 0.45, arrowPerp, -tipLen * 0.55);
    const arrowPts = [tip, baseLeft, baseRight];

    const paths = [
      segR([origin, baseEdge], 'gate'),
      segR([drainEdge, drainEnd], 'drain'),
      segR([sourceEdge, sourceEnd], 'source'),
    ];
    const component = {
      type: 'bjt',
      variant: isN ? 'nmos' : 'pmos',
      body: {
        shape: 'circle',
        cx: bodyCenter.x, cy: bodyCenter.y, r,
        baseBar: [gateTop, gateBot],
        collectorInternal: [channelTop, drainEdge],
        emitterInternal:   [channelBot, sourceEdge],
        extraInternal: [[channelTop, channelBot]],
      },
      baseLead: { path: [origin, baseEdge], role: 'gate' },
      collectorLead: { path: [drainEdge, drainEnd], role: 'drain' },
      emitterLead: { path: [sourceEdge, sourceEnd], role: 'source' },
      arrow: { points: arrowPts, isNPN: isN },
    };
    return {
      paths,
      vias: [via(origin), via(drainEnd), via(sourceEnd)],
      endpoints: [drainEnd, sourceEnd],
      component,
    };
  }
  function generateNMOSFETCircle(o, a) { return generateMOSFETInCircle(o, a, true); }
  function generatePMOSFETCircle(o, a) { return generateMOSFETInCircle(o, a, false); }

  function generateTransistor(origin, away, room) {
    return Math.random() < 0.5 ? generateBJT(origin, away) : generateMOSFET(origin, away);
  }

  function generateBJT(origin, away) {
    const perp = perpDir(away);
    const ps = Math.random() < 0.5 ? 1 : -1;
    const py = { dx: perp.dx * ps, dy: perp.dy * ps };
    const isNPN = Math.random() < 0.5;
    const r = S(30);
    const bodyCenter = mv(origin, away, rand(28, 44) + r);
    const baseEdge = mv(bodyCenter, away, -r);

    // Base bar inside the circle, perpendicular to base lead, offset toward base side.
    const barC = mv(bodyCenter, away, -r * 0.5);
    const barHalf = r * 0.65;
    const barTop    = mv(barC, py, barHalf);
    const barBottom = mv(barC, py, -barHalf);

    // Collector / emitter exit points on the circle, shifted toward the front
    // so internal diagonals look natural rather than crossing the base bar.
    const exitDX = r * 0.42;
    const exitDY = Math.sqrt(r * r - exitDX * exitDX);
    const collectorEdge = mv2(bodyCenter, away, exitDX, py, exitDY);
    const emitterEdge   = mv2(bodyCenter, away, exitDX, py, -exitDY);
    const collectorEnd  = mv(collectorEdge, py, 28);
    const emitterEnd    = mv(emitterEdge, py, -28);

    // Internal diagonals: from bar top → collectorEdge, from bar bottom → emitterEdge.
    // These end exactly where the leads enter the circle, so the body symbol
    // and the lead trace are continuous.
    const colDx = collectorEdge.x - barTop.x, colDy = collectorEdge.y - barTop.y;
    const colLen = Math.hypot(colDx, colDy);
    const emDx = emitterEdge.x - barBottom.x, emDy = emitterEdge.y - barBottom.y;
    const emLen = Math.hypot(emDx, emDy);
    const emDir = { dx: emDx / emLen, dy: emDy / emLen };

    // Arrow on the emitter diagonal, inside the circle.
    // NPN: arrow points outward (toward emitterEdge).
    // PNP: arrow points inward (toward base bar).
    const arrowT = isNPN ? 0.62 : 0.38;
    const arrowAnchor = {
      x: barBottom.x + emDx * arrowT,
      y: barBottom.y + emDy * arrowT,
    };
    const arrowDir = isNPN ? emDir : { dx: -emDir.dx, dy: -emDir.dy };
    const arrowPerp = { dx: -arrowDir.dy, dy: arrowDir.dx };
    const tipLen = 7;
    const tip = mv(arrowAnchor, arrowDir, tipLen * 0.55);
    const baseLeft  = mv2(arrowAnchor, arrowDir, -tipLen * 0.45, arrowPerp,  tipLen * 0.55);
    const baseRight = mv2(arrowAnchor, arrowDir, -tipLen * 0.45, arrowPerp, -tipLen * 0.55);
    const arrowPts = [tip, baseLeft, baseRight];

    const paths = [
      segR([origin, barC], 'base'),
      segR([collectorEdge, collectorEnd], 'collector'),
      segR([emitterEdge, emitterEnd], 'emitter'),
    ];
    const component = {
      type: 'bjt',
      variant: isNPN ? 'npn' : 'pnp',
      body: {
        shape: 'circle',
        cx: bodyCenter.x, cy: bodyCenter.y, r,
        baseBar: [barTop, barBottom],
        collectorInternal: [barTop, collectorEdge],
        emitterInternal:   [barBottom, emitterEdge],
      },
      baseLead:      { path: [origin, barC], role: 'base' },
      collectorLead: { path: [collectorEdge, collectorEnd], role: 'collector' },
      emitterLead:   { path: [emitterEdge, emitterEnd], role: 'emitter' },
      arrow: { points: arrowPts, isNPN },
    };
    return {
      paths,
      vias: [via(origin), via(collectorEnd), via(emitterEnd)],
      endpoints: [collectorEnd, emitterEnd],
      component,
    };
  }

  function generateMOSFET(origin, away) {
    const perp = perpDir(away);
    const ps = Math.random() < 0.5 ? 1 : -1;
    const py = { dx: perp.dx * ps, dy: perp.dy * ps };
    const isN = Math.random() < 0.7;
    const gpC = mv(origin, away, rand(34, 56));
    const gatePlateTop    = mv(gpC, py, 8);
    const gatePlateBottom = mv(gpC, py, -8);
    const cLX = mv(gpC, away, 6);
    const segCenters = [mv(cLX, py, 8), { x: cLX.x, y: cLX.y }, mv(cLX, py, -8)];
    const segments = segCenters.map(c => [{ x: c.x, y: c.y }, mv(c, away, 20)]);
    const railTop = segments[0][1], railBottom = segments[2][1];
    const rail = [railTop, railBottom];
    const drainBend  = mv(railTop, py, 20);
    const drainEnd   = mv(drainBend, away, 22);
    const sourceBend = mv(railBottom, py, -20);
    const sourceEnd  = mv(sourceBend, away, 22);
    const dir = isN ? 1 : -1;
    const tip = mv(mv(railBottom, py, -8), py, 7 * dir);
    const baseMid = mv(tip, py, -10 * dir);
    const arrowPts = [tip, mv(baseMid, away, 4.2), mv(baseMid, away, -4.2)];

    const paths = [
      segR([origin, gpC], 'gate'),
      segR([railTop, drainBend, drainEnd], 'drain'),
      segR([railBottom, sourceBend, sourceEnd], 'source'),
    ];
    const component = {
      type: 'mosfet',
      variant: isN ? 'n' : 'p',
      body: {
        shape: 'mosfet-body',
        gatePlate: [gatePlateTop, gatePlateBottom],
        channelSegments: segments,
        rail,
      },
      gateLead:   { path: [origin, gpC], role: 'gate' },
      drainLead:  { path: [railTop, drainBend, drainEnd], role: 'drain' },
      sourceLead: { path: [railBottom, sourceBend, sourceEnd], role: 'source' },
      arrow: { points: arrowPts, isN },
    };
    return {
      paths,
      vias: [
        via(origin),
        via(drainEnd),
        via(sourceEnd),
      ],
      endpoints: [drainEnd, sourceEnd],
      component,
    };
  }

  function polylineD(pts) {
    if (pts.length < 2) return '';
    return 'M ' + pts[0].x + ' ' + pts[0].y +
      pts.slice(1).map(p => ` L ${p.x} ${p.y}`).join('');
  }
  function seg(pts) { return { d: polylineD(pts), sampledPts: pts }; }
  function segR(pts, role) { return { d: polylineD(pts), sampledPts: pts, role }; }

  function roundedPolyD(pts, r = 9) {
    if (pts.length < 3) return polylineD(pts);
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const c = pts[i], a = pts[i - 1], b = pts[i + 1];
      const ax = a.x - c.x, ay = a.y - c.y, bx = b.x - c.x, by = b.y - c.y;
      const la = Math.hypot(ax, ay), lb = Math.hypot(bx, by);
      if (la < 1e-3 || lb < 1e-3) { d += ` L ${c.x} ${c.y}`; continue; }
      const rr = Math.min(r, la * 0.49, lb * 0.49);
      d += ` L ${c.x + (ax / la) * rr} ${c.y + (ay / la) * rr}`;
      d += ` Q ${c.x} ${c.y} ${c.x + (bx / lb) * rr} ${c.y + (by / lb) * rr}`;
    }
    return d + ` L ${pts[pts.length - 1].x} ${pts[pts.length - 1].y}`;
  }
  function segRounded(pts) { return { d: roundedPolyD(pts), sampledPts: pts, rounded: 1 }; }

  function smoothPolyD(pts) {
    if (pts.length < 3) return polylineD(pts);
    const m0 = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
    let d = `M ${pts[0].x} ${pts[0].y} L ${m0.x} ${m0.y}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const mE = { x: (pts[i].x + pts[i + 1].x) / 2, y: (pts[i].y + pts[i + 1].y) / 2 };
      d += ` Q ${pts[i].x} ${pts[i].y} ${mE.x} ${mE.y}`;
    }
    const last = pts[pts.length - 1];
    d += ` L ${last.x} ${last.y}`;
    return d;
  }
  function segSmooth(pts) {
    if (pts.length < 3) return seg(pts);
    const samp = [pts[0]];
    let s = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
    samp.push(s);
    for (let i = 1; i < pts.length - 1; i++) {
      const e = { x: (pts[i].x + pts[i + 1].x) / 2, y: (pts[i].y + pts[i + 1].y) / 2 };
      for (let t = 1; t <= 4; t++) {
        const u = t / 4, iu = 1 - u;
        samp.push({
          x: iu * iu * s.x + 2 * iu * u * pts[i].x + u * u * e.x,
          y: iu * iu * s.y + 2 * iu * u * pts[i].y + u * u * e.y,
        });
      }
      s = e;
    }
    samp.push(pts[pts.length - 1]);
    return { d: smoothPolyD(pts), sampledPts: samp };
  }
  function via(p) { return { x: p.x, y: p.y, variant: 'faint' }; }

  const A_DEFS = [
    ['orthogonal',0.01,generateOrthogonal,80,800,0],
    ['diagonal_45',0.01,generateDiagonal45,80,800,0],
    ['wandering',0.10,generateWandering,100,800,0],
    ['arc',0.14,generateArc,80,800,0],
    ['arc_with_component',0.18,generateArcWithComponent,120,600,0],
    ['serpentine_curve',0.10,generateSerpentineCurve,100,350,0],
    ['serpentine_meander',0.01,generateSerpentineMeander,80,250,0],
    ['inverted_f_antenna',0.05,generateInvertedFAntenna,100,250,1],
    ['zigzag_antenna',0.04,generateZigzagAntenna,80,200,1],
    ['ground_termination',0.05,generateGroundTermination,80,200,1],
    ['voltage_rail_termination',0.05,generateVoltageRailTermination,80,200,1],
    ['resistor_zigzag',0.08,generateResistorZigzag,80,800,0],
    ['capacitor_or_inductor',0.08,generateCapacitorOrInductor,80,800,0],
    ['diode',0.08,generateDiode,80,800,0],
    ['schottky_diode',0.04,generateSchottkyDiode,80,800,0],
    ['zener_diode',0.04,generateZenerDiode,80,800,0],
    ['triac',0.03,generateTriac,80,500,0],
    ['diac',0.03,generateDiac,80,500,0],
    ['varistor',0.04,generateVaristor,80,500,0],
    ['fuse',0.04,generateFuse,80,500,0],
    ['switch_open',0.035,generateSwitch,80,500,0],
    ['switch_closed',0.035,generateClosedSwitch,80,500,0],
    ['battery_cell',0.05,generateBatteryCell,80,500,0],
    ['thermistor',0.04,generateThermistor,80,500,0],
    ['photodiode',0.04,generatePhotodiode,80,500,0],
    ['transistor',0.03,generateTransistor,140,500,0],
    ['nmos_circle',0.025,generateNMOSFETCircle,140,500,0],
    ['pmos_circle',0.025,generatePMOSFETCircle,140,500,0],
  ];
  const COMPONENT_ARCHETYPE_KEYS = new Set([
    'resistor_zigzag', 'capacitor_or_inductor', 'diode', 'schottky_diode',
    'zener_diode', 'triac', 'diac', 'varistor', 'fuse',
    'switch_open', 'switch_closed', 'battery_cell', 'thermistor',
    'photodiode', 'transistor', 'nmos_circle', 'pmos_circle',
    'arc_with_component',
  ]);

  const ARCHETYPES = A_DEFS.map(a => ({
    key: a[0], weight: a[1], fn: a[2], min: a[3], max: a[4], terminating: !!a[5],
    isComponent: COMPONENT_ARCHETYPE_KEYS.has(a[0]),
  }));

  const COMPONENT_KEYS = new Set(['transistor', 'nmos_circle', 'pmos_circle']);
  const COMPONENT_CAP = 8;

  function componentBiasForElapsed(ms) {
    if (ms < 6000) return 6.0;
    if (ms < 14000) return 3.0;
    return 1.2;
  }

  const FORCED_OPENING = ['resistor_zigzag', 'diode'];
  function pickArchetypeForRoom(room, skipForced) {
    const elapsed = growthStartMs ? Math.max(0, performance.now() - growthStartMs) : 0;
    let pool = ARCHETYPES.filter(a => room >= a.min && room <= a.max);
    if (components.length >= COMPONENT_CAP) {
      pool = pool.filter(a => !COMPONENT_KEYS.has(a.key));
    }
    if (pool.length === 0) pool = [ARCHETYPES[0]];
    if (!skipForced && branchCount < FORCED_OPENING.length) {
      const want = FORCED_OPENING[branchCount];
      const forced = pool.find(a => a.key === want);
      if (forced) return forced;
    }
    const bias = componentBiasForElapsed(elapsed);
    const wOf = (a) => a.weight * (a.isComponent ? bias : 1);
    const total = pool.reduce((s, a) => s + wOf(a), 0);
    let r = Math.random() * total;
    for (const a of pool) { r -= wOf(a); if (r <= 0) return a; }
    return pool[pool.length - 1];
  }

  function genericOrthogonal(origin, away, room) {
    const len = Math.min(room - 20, S(220));
    const perp = perpDir(away);
    const flip = Math.random() < 0.5 ? 1 : -1;
    const bulge = len * (0.18 + Math.random() * 0.18);
    const end = { x: snap(origin.x + away.dx * len), y: snap(origin.y + away.dy * len) };
    const ctrl = {
      x: snap(origin.x + away.dx * len * 0.5 + perp.dx * bulge * flip),
      y: snap(origin.y + away.dy * len * 0.5 + perp.dy * bulge * flip),
    };
    const sampled = sampleBezier(origin, ctrl, end, 14);
    return {
      paths: [{ d: `M ${origin.x} ${origin.y} Q ${ctrl.x} ${ctrl.y} ${end.x} ${end.y}`, sampledPts: sampled }],
      vias: [via(origin), via(end)],
      endpoints: [end],
    };
  }

  const placedSeedIndices = new Set();

  function viableOrigins(tolCos, jitterEnvRad) {
    const out = [];
    for (let i = 0; i < NAME_OUTER_VIAS.length; i++) {
      if (placedSeedIndices.has(i)) continue;
      const seed = Object.assign({}, NAME_OUTER_VIAS[i], { _seedIdx: i });
      const room = originHasOutwardRoom(seed, tolCos, jitterEnvRad);
      if (room && room.edgeDist >= MIN_USEFUL_ROOM) {
        out.push({ ep: seed, room, isStub: true });
      }
    }
    for (const e of endpoints) {
      const room = originHasOutwardRoom(e, tolCos, jitterEnvRad);
      if (room && room.edgeDist >= MIN_USEFUL_ROOM) {
        out.push({ ep: e, room, isStub: false });
      }
    }
    return out;
  }

  function pickFromViable(viable) {
    const stubs = viable.filter(v => v.isStub);
    if (stubs.length > 0) {
      const sorted = stubs.slice().sort((a, b) => b.room.edgeDist - a.room.edgeDist);
      if (branchCount < FORCED_OPENING.length) return sorted[0];
      const take = Math.max(1, Math.ceil(sorted.length * 0.4));
      return sorted[Math.floor(Math.random() * take)];
    }
    const pool = viable.filter(v => !v.isStub);
    if (pool.length === 0) return null;
    const r = Math.random();
    if (r < 0.5) {
      const sorted = pool.slice().sort((a, b) => (b.ep.createdAt || 0) - (a.ep.createdAt || 0));
      const take = Math.max(1, Math.ceil(sorted.length * 0.4));
      return sorted[Math.floor(Math.random() * take)];
    }
    if (r < 0.8) {
      const sorted = pool.slice().sort((a, b) => b.room.edgeDist - a.room.edgeDist);
      const take = Math.max(1, Math.ceil(sorted.length * 0.3));
      return sorted[Math.floor(Math.random() * take)];
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function distFromCenter(p) {
    return Math.hypot(p.x - GROWTH_CENTER.x, p.y - GROWTH_CENTER.y);
  }

  function draftIsStrictlyOutward(draft, origin) {
    if (!draft) return false;
    const checkPts = [];
    if (draft.endpoints && draft.endpoints.length > 0) {
      checkPts.push(...draft.endpoints);
    } else if (draft.paths && draft.paths.length > 0) {
      for (const p of draft.paths) {
        const last = p.sampledPts[p.sampledPts.length - 1];
        if (last) checkPts.push(last);
      }
    }
    if (checkPts.length === 0) return false;
    const originDist = distFromCenter(origin);
    for (const ep of checkPts) {
      if (Math.abs(ep.x - origin.x) < 0.5 && Math.abs(ep.y - origin.y) < 0.5) continue;
      if (distFromCenter(ep) > originDist - 30) return true;
    }
    return false;
  }

  function draftIsValid(draft) {
    if (!draft) return false;
    const allSegmentSets = draft.paths.map(p => p.sampledPts);
    if (draft.bodySampled) allSegmentSets.push(draft.bodySampled);
    for (const pts of allSegmentSets) {
      if (!pointsInBounds(pts)) return false;
      if (polylineCollides(pts)) return false;
      if (pointsHitExclusion(pts)) return false;
    }
    if (draft.component) {
      const cb = draft.component.body;
      if (cb && cb.shape === 'circle') {
        const r = cb.r || 0;
        const pad = 4;
        const cBox = {
          minX: cb.cx - r - pad, minY: cb.cy - r - pad,
          maxX: cb.cx + r + pad, maxY: cb.cy + r + pad,
        };
        for (const z of exclusionZones) {
          if (aabbIntersectsZone(cBox, z)) return false;
        }
        for (const b of bodyBoxes) {
          if (aabbsOverlap(cBox, b)) return false;
        }
        for (const t of traces) {
          for (let i = 0; i < t.points.length - 1; i++) {
            const a = t.points[i], q = t.points[i + 1];
            if (a.x === q.x && a.y === q.y) continue;
            const segBox = segmentAABB(a, q, 0);
            if (aabbsOverlap(cBox, segBox)) {
              const touchesA = (Math.abs(draft.component.baseLead.path[0].x - a.x) < 1 && Math.abs(draft.component.baseLead.path[0].y - a.y) < 1) ||
                               (Math.abs(draft.component.baseLead.path[0].x - q.x) < 1 && Math.abs(draft.component.baseLead.path[0].y - q.y) < 1);
              if (!touchesA) return false;
            }
          }
        }
      }
    }
    return true;
  }

  function drawDraft(draft) {
    draft.paths.forEach((pe) => {
      const el = document.createElementNS(SVG_NS, 'path');
      el.setAttribute('d', pe.d);
      let cls = 'trace trace--lattice';
      if (pe.role === 'ground-bar' || pe.role === 'rail') cls += ' trace--terminator';
      el.setAttribute('class', cls);
      latticeLayer.appendChild(el);
      traces.push({ points: pe.sampledPts.slice(), kind: 'lattice', pathEl: el });
    });

    draft.vias.forEach(v => { reuseOrCreateVia(v.x, v.y, v.variant); });

    if (draft.endpoints) {
      draft.endpoints.forEach(p => addEndpoint(p.x, p.y, false));
    }
    sampleInteriorEndpoints(draft);

    if (draft.component) {
      const cmp = renderComponent(draft.component, false, 0);
      if (cmp) components.push(cmp);
      registerBodyBox(draft.component);
    }
  }

  function registerBodyBox(spec) {
    const cb = spec && spec.body;
    if (!cb || cb.shape !== 'circle') return;
    const r = cb.r || 0;
    const pad = 4;
    bodyBoxes.push({
      minX: cb.cx - r - pad, minY: cb.cy - r - pad,
      maxX: cb.cx + r + pad, maxY: cb.cy + r + pad,
    });
  }

  function sampleInteriorEndpoints(draft) {
    if (!draft.paths || draft.terminating || draft.component || draft.bodyOnly) return;
    const STRIDE = 70;
    for (const pe of draft.paths) {
      const pts = pe.sampledPts;
      if (!pts || pts.length < 2) continue;
      let acc = 0, last = pts[0];
      for (let i = 1; i < pts.length - 1; i++) {
        const p = pts[i];
        acc += Math.hypot(p.x - last.x, p.y - last.y);
        last = p;
        if (acc >= STRIDE) {
          const sample = pe.rounded ? cornerMid(pts[i - 1], p, pts[i + 1]) : p;
          addEndpoint(sample.x, sample.y, false);
          acc = 0;
        }
      }
    }
  }

  function drawDraftAnimated(draft) {
    return new Promise(resolve => {
      const pathRecords = [];
      draft.paths.forEach(pe => {
        const el = document.createElementNS(SVG_NS, 'path');
        el.setAttribute('d', pe.d);
        let cls = 'trace trace--lattice';
        if (pe.role === 'ground-bar' || pe.role === 'rail') cls += ' trace--terminator';
        el.setAttribute('class', cls);
        latticeLayer.appendChild(el);
        let len = 0;
        try { len = el.getTotalLength(); } catch (e) { len = 0; }
        if (len > 0) {
          el.style.strokeDasharray = String(len);
          el.style.strokeDashoffset = String(len);
        }
        traces.push({ points: pe.sampledPts.slice(), kind: 'lattice', pathEl: el });
        pathRecords.push({ el, len });
      });
      const totalLen = pathRecords.reduce((s, r) => s + r.len, 0);

      const viaRecords = [];
      draft.vias.forEach(v => {
        const { el, reused } = reuseOrCreateVia(v.x, v.y, v.variant);
        if (!reused && el.classList.contains('via--faint')) {
          el.style.opacity = '0';
          el.style.transition = 'opacity 200ms linear';
        }
        viaRecords.push({ el, x: v.x, y: v.y, revealed: reused });
      });

      let cmpRecord = null;
      if (draft.component) {
        const cmp = renderComponent(draft.component, true, 0);
        if (cmp) {
          components.push(cmp);
          cmpRecord = cmp;
        }
        registerBodyBox(draft.component);
      }

      if (draft.endpoints) draft.endpoints.forEach(p => addEndpoint(p.x, p.y, false));
      sampleInteriorEndpoints(draft);

      const dot = document.createElementNS(SVG_NS, 'circle');
      dot.setAttribute('r', '3');
      dot.setAttribute('class', 'pulse-dot');
      const origin = pathRecords[0] && pathRecords[0].el ? draft.paths[0].sampledPts[0] : null;
      if (origin) {
        dot.setAttribute('cx', String(origin.x));
        dot.setAttribute('cy', String(origin.y));
      }
      dot.style.opacity = '0';
      pulseLayer.appendChild(dot);

      const PLAY_MS = 320;
      const playStart = performance.now();
      function playFrame(now) {
        if (document.hidden) { requestAnimationFrame(playFrame); return; }
        const t = Math.min(1, (now - playStart) / PLAY_MS);
        dot.style.opacity = String(Math.min(1, t * 2.4));
        const scale = 1 + 0.4 * Math.sin(t * Math.PI);
        dot.setAttribute('r', String(3 * scale));
        if (t < 1) { requestAnimationFrame(playFrame); }
        else { dot.setAttribute('r', '3'); startReveal(); }
      }

      function startReveal() {
        if (totalLen <= 0 || pathRecords.length === 0) {
          if (dot.parentNode) dot.parentNode.removeChild(dot);
          resolve();
          return;
        }

        const REVEAL_MS = Math.max(700, Math.min(1300, 600 + totalLen * 1.6));
        const revealStart = performance.now();
        const segs = pathRecords.filter(r => r.len > 0);
        const segTimes = segs.map(r => (r.len / totalLen) * REVEAL_MS);
        const segSamples = segs.map(s => {
          const N = Math.max(8, Math.min(120, Math.ceil(s.len / 4)));
          const arr = new Array(N + 1);
          for (let i = 0; i <= N; i++) {
            try { arr[i] = s.el.getPointAtLength(s.len * i / N); }
            catch (_) { arr[i] = { x: 0, y: 0 }; }
          }
          return arr;
        });
        let segIdx = 0;
        let segElapsedAtStart = 0;
        const cmpFadeAt = REVEAL_MS - 250;
        let cmpFaded = false;

        function revealFrame(now) {
          if (document.hidden) { requestAnimationFrame(revealFrame); return; }
          const elapsed = now - revealStart;

          while (segIdx < segs.length && (elapsed - segElapsedAtStart) >= segTimes[segIdx]) {
            segs[segIdx].el.style.strokeDashoffset = '0';
            segElapsedAtStart += segTimes[segIdx];
            segIdx++;
          }

          if (segIdx < segs.length) {
            const seg = segs[segIdx];
            const localT = Math.max(0, Math.min(1, (elapsed - segElapsedAtStart) / segTimes[segIdx]));
            const eased = 1 - Math.pow(1 - localT, 2.4);
            seg.el.style.strokeDashoffset = String(seg.len * (1 - eased));
            const arr = segSamples[segIdx];
            const idx = Math.min(arr.length - 1, Math.floor(eased * (arr.length - 1)));
            const pt = arr[idx];
            dot.setAttribute('cx', String(pt.x));
            dot.setAttribute('cy', String(pt.y));
            for (const vr of viaRecords) {
              if (vr.revealed) continue;
              const dx = vr.x - pt.x;
              const dy = vr.y - pt.y;
              if (dx * dx + dy * dy < 36) {
                vr.el.style.opacity = '1';
                vr.revealed = true;
              }
            }
          }

          if (!cmpFaded && cmpRecord && elapsed >= cmpFadeAt) {
            cmpFaded = true;
            cmpRecord.g.style.opacity = '1';
          }

          if (elapsed >= REVEAL_MS) {
            segs.forEach(s => { s.el.style.strokeDashoffset = '0'; });
            viaRecords.forEach(vr => { if (!vr.revealed) { vr.el.style.opacity = '1'; vr.revealed = true; } });
            if (cmpRecord && !cmpFaded) cmpRecord.g.style.opacity = '1';
            const lastSamples = segSamples[segSamples.length - 1];
            const endPt = lastSamples[lastSamples.length - 1];
            dot.setAttribute('cx', String(endPt.x));
            dot.setAttribute('cy', String(endPt.y));
            dot.style.transition = 'opacity 240ms linear';
            requestAnimationFrame(() => { dot.style.opacity = '0'; });
            setTimeout(() => {
              if (dot.parentNode) dot.parentNode.removeChild(dot);
              resolve();
            }, 280);
            return;
          }
          requestAnimationFrame(revealFrame);
        }
        requestAnimationFrame(revealFrame);
      }

      requestAnimationFrame(playFrame);
    });
  }

  function renderComponent(spec, animated) {
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('class',
      'component component--' + spec.type
      + (spec.variant ? ' component--' + spec.variant : '')
    );
    componentLayer.appendChild(g);

    const addLine = (a, b, cls, extraStyle) => {
      const ln = document.createElementNS(SVG_NS, 'line');
      ln.setAttribute('x1', String(a.x));
      ln.setAttribute('y1', String(a.y));
      ln.setAttribute('x2', String(b.x));
      ln.setAttribute('y2', String(b.y));
      ln.setAttribute('class', cls);
      if (extraStyle) Object.assign(ln.style, extraStyle);
      g.appendChild(ln);
      return ln;
    };

    const bodyEls = [];
    const extras = {};

    if (spec.type === 'bjt') {
      const circle = document.createElementNS(SVG_NS, 'circle');
      circle.setAttribute('cx', String(spec.body.cx));
      circle.setAttribute('cy', String(spec.body.cy));
      circle.setAttribute('r', String(spec.body.r));
      circle.setAttribute('class', 'component__body');
      g.appendChild(circle);
      bodyEls.push(circle);
      if (spec.body.baseBar) bodyEls.push(addLine(spec.body.baseBar[0], spec.body.baseBar[1], 'component__body'));
      if (spec.body.collectorInternal) bodyEls.push(addLine(spec.body.collectorInternal[0], spec.body.collectorInternal[1], 'component__body'));
      if (spec.body.emitterInternal) bodyEls.push(addLine(spec.body.emitterInternal[0], spec.body.emitterInternal[1], 'component__body'));
      if (spec.body.extraInternal) spec.body.extraInternal.forEach(seg => bodyEls.push(addLine(seg[0], seg[1], 'component__body')));
      if (spec.arrow) {
        const tri = document.createElementNS(SVG_NS, 'polygon');
        tri.setAttribute('points', spec.arrow.points.map(p => `${p.x},${p.y}`).join(' '));
        tri.setAttribute('class', 'component__body component__body--fill');
        g.appendChild(tri);
        bodyEls.push(tri);
        extras.arrow = tri;
      }
    } else if (spec.type === 'mosfet') {
      const segEls = [];
      spec.body.channelSegments.forEach((seg, idx) => {
        const ln = addLine(seg[0], seg[1], 'component-mosfet__channel-seg');
        ln.dataset.segIndex = String(idx);
        segEls.push(ln);
        bodyEls.push(ln);
      });
      extras.channelSegments = segEls;
      extras.rail = addLine(spec.body.rail[0], spec.body.rail[1], 'component__body');
      bodyEls.push(extras.rail);
      extras.gatePlate = addLine(spec.body.gatePlate[0], spec.body.gatePlate[1], 'component-mosfet__gate-plate');
      bodyEls.push(extras.gatePlate);
      if (spec.arrow) {
        const tri = document.createElementNS(SVG_NS, 'polygon');
        tri.setAttribute('points', spec.arrow.points.map(p => `${p.x},${p.y}`).join(' '));
        tri.setAttribute('class', 'component__body component__body--fill');
        g.appendChild(tri);
        bodyEls.push(tri);
        extras.arrow = tri;
      }
    }

    if (animated) {
      g.style.opacity = '0';
      g.style.transition = 'opacity 360ms linear';
    }

    return { spec, g, bodyEls, extras };
  }

  const LATTICE_SOFT_CAP = Infinity;
  let branchCount = 0;
  let growthStartMs = 0;
  let growthStopped = false;
  let growthTimer = null;
  let activeGrowth = 0;
  const activeWatchdogs = new Set();

  function maxConcurrentForElapsed(ms) {
    return ms < 3000 ? 2 : 3;
  }

  function scheduleNextBranch(delay) {
    clearTimeout(growthTimer);
    growthTimer = setTimeout(growthTick, delay);
  }

  function tryDraftAt(viableEntry, archetype, jitterRetry) {
    const { ep, room } = viableEntry;
    const draft = archetype.fn(ep, room.away, room.edgeDist);
    if (!draft) return null;
    if (!draftIsStrictlyOutward(draft, ep)) return null;
    if (!draftIsValid(draft)) return null;
    return draft;
  }

  function attemptBranch() {
    const elapsed = growthStartMs ? (performance.now() - growthStartMs) : 0;
    const tolCos = outwardToleranceForElapsed(elapsed);
    const jitterEnv = jitterEnvelopeForElapsed(elapsed);
    const viable = viableOrigins(tolCos, jitterEnv);
    if (viable.length === 0) {
      scheduleNextBranch(1500 + Math.random() * 1500);
      return false;
    }

    const exhausted = new Set();
    for (let attempt = 0; attempt < 3; attempt++) {
      const candidates = viable.filter(v => !exhausted.has(v.ep));
      if (candidates.length === 0) break;
      const pick = pickFromViable(candidates);
      if (!pick) break;

      const archetype = pickArchetypeForRoom(pick.room.edgeDist);
      if (!archetype) { exhausted.add(pick.ep); continue; }
      let draft = tryDraftAt(pick, archetype);
      if (!draft) {
        const jitter = (Math.random() - 0.5) * 2 * jitterEnv;
        const dir = computeOutwardDir(pick.ep, tolCos, jitter);
        if (isDirectionOutward(dir, pick.ep, tolCos)) {
          const altRoom = { away: dir, edgeDist: distanceToEdge(pick.ep, dir) };
          if (altRoom.edgeDist >= MIN_USEFUL_ROOM) {
            draft = tryDraftAt({ ep: pick.ep, room: altRoom }, archetype);
          }
        }
      }
      if (!draft && elapsed < 12000 && archetype.isComponent) {
        for (let r = 0; r < 4 && !draft; r++) {
          const alt = pickArchetypeForRoom(pick.room.edgeDist, true);
          if (!alt || !alt.isComponent) continue;
          if (alt === archetype) continue;
          draft = tryDraftAt(pick, alt);
        }
      }
      if (!draft) { exhausted.add(pick.ep); continue; }
      commitAndDraw(draft, pick.ep);
      return true;
    }

    if (elapsed < 12000) return false;
    const last = viable[0];
    const draft = genericOrthogonal(last.ep, last.room.away, last.room.edgeDist);
    if (draft && draftIsValid(draft)) {
      commitAndDraw(draft, last.ep);
      return true;
    }
    return false;
  }

  function commitAndDraw(draft, ep) {
    if (ep._seedIdx !== undefined) {
      placedSeedIndices.add(ep._seedIdx);
      addEndpoint(ep.x, ep.y, true);
    }
    activeGrowth++;
    let watchdog;
    const after = () => {
      if (watchdog) { clearTimeout(watchdog); activeWatchdogs.delete(watchdog); }
      activeGrowth = Math.max(0, activeGrowth - 1);
      if (!growthStopped && !document.hidden) scheduleNextBranch(0);
    };
    watchdog = setTimeout(after, 5000);
    activeWatchdogs.add(watchdog);
    drawDraftAnimated(draft).then(after).catch(after);
    branchCount++;
  }

  function growthTick() {
    if (growthStopped || document.hidden) return;
    const elapsed = growthStartMs ? (performance.now() - growthStartMs) : 0;
    const maxC = maxConcurrentForElapsed(elapsed);
    if (activeGrowth >= maxC) return;
    const placed = attemptBranch();
    if (!placed && !growthStopped) {
      scheduleNextBranch(200);
      return;
    }
    if (activeGrowth < maxConcurrentForElapsed(elapsed)) scheduleNextBranch(0);
  }

  function drawPrimaryRails() {
    const dur = 1300;
    const primaries = Array.from(svg.querySelectorAll('.circuit__primary path'));
    const vias = Array.from(svg.querySelectorAll('.circuit__primary circle'));
    vias.forEach(v => { v.style.opacity = '0'; });

    primaries.forEach(p => {
      let len = 0;
      try { len = p.getTotalLength(); } catch (_) { len = 0; }
      if (len <= 0) return;
      p.style.strokeDasharray = String(len);
      p.style.strokeDashoffset = String(len);
      if (p.dataset.drawn === '1') return;
      p.dataset.drawn = '1';

      const dot = document.createElementNS(SVG_NS, 'circle');
      dot.setAttribute('r', '3');
      dot.setAttribute('class', 'pulse-dot');
      dot.dataset.t0 = String(performance.now());
      pulseLayer.appendChild(dot);

      let start = null;
      function frame(now) {
        if (document.hidden) { requestAnimationFrame(frame); return; }
        if (start === null) start = now;
        const t = Math.max(0, Math.min(1, (now - start) / dur));
        const eased = 1 - Math.pow(1 - t, 3);
        p.style.strokeDashoffset = String(len * (1 - eased));
        let pos;
        try { pos = lockupToBg(p.getPointAtLength(len * eased)); }
        catch (_) { pos = { x: 0, y: 0 }; }
        dot.setAttribute('cx', String(pos.x));
        dot.setAttribute('cy', String(pos.y));
        for (const v of vias) {
          if (v.style.opacity === '1') continue;
          const lc = lockupToBg({
            x: parseFloat(v.getAttribute('cx')),
            y: parseFloat(v.getAttribute('cy')),
          });
          const dx = lc.x - pos.x, dy = lc.y - pos.y;
          if (dx * dx + dy * dy < 100) v.style.opacity = '1';
        }
        if (t < 1) requestAnimationFrame(frame);
        else {
          p.style.strokeDashoffset = '0';
          dot.style.transition = 'opacity 240ms linear';
          requestAnimationFrame(() => { dot.style.opacity = '0'; });
          setTimeout(() => { if (dot.parentNode) dot.parentNode.removeChild(dot); }, 280);
        }
      }
      requestAnimationFrame(frame);
    });

    setTimeout(() => { vias.forEach(v => { v.style.opacity = '1'; }); }, dur + 100);
  }

  function flashTerminalLabels() {
    document.querySelectorAll('.terminal__label').forEach(l => {
      l.classList.add('is-flash');
      setTimeout(() => l.classList.remove('is-flash'), 700);
    });
  }

  function travelPointsPulse(pts, opts = {}) {
    return new Promise(resolve => {
      if (!pts || pts.length < 2) { resolve(); return; }
      const dot = document.createElementNS(SVG_NS, 'circle');
      dot.setAttribute('r', '3');
      dot.setAttribute('class', 'pulse-dot');
      dot.setAttribute('cx', String(pts[0].x));
      dot.setAttribute('cy', String(pts[0].y));
      pulseLayer.appendChild(dot);

      const segLens = [];
      let total = 0;
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        const l = Math.hypot(b.x - a.x, b.y - a.y);
        segLens.push(l);
        total += l;
      }
      if (total === 0) {
        pulseLayer.removeChild(dot);
        resolve();
        return;
      }

      const duration = opts.duration || (800 + Math.random() * 600);
      const reverse = !!opts.reverse;
      const start = performance.now();

      function frame(now) {
        if (document.hidden) { requestAnimationFrame(frame); return; }
        let t = (now - start) / duration;
        if (t >= 1) {
          if (dot.parentNode) dot.parentNode.removeChild(dot);
          resolve();
          return;
        }
        let d = (reverse ? (1 - t) : t) * total;
        for (let i = 0; i < segLens.length; i++) {
          if (d <= segLens[i] || i === segLens.length - 1) {
            const a = pts[i];
            const b = pts[i + 1];
            const u = segLens[i] === 0 ? 0 : Math.max(0, Math.min(1, d / segLens[i]));
            const x = a.x + (b.x - a.x) * u;
            const y = a.y + (b.y - a.y) * u;
            dot.setAttribute('cx', String(x));
            dot.setAttribute('cy', String(y));
            break;
          }
          d -= segLens[i];
        }
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
  }

  let activationBusy = false;
  let activationLoopTimer = null;
  let activationLoopStopped = false;

  function pickActivatableComponent() {
    if (components.length === 0) return null;
    const pool = components.length > 1 ? components.slice(0, -1) : components;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function activateComponent(cmp) {
    if (!cmp || activationBusy) return;
    const { spec } = cmp;
    activationBusy = true;
    if (spec.type === 'bjt') activateBJT(cmp);
    else if (spec.type === 'mosfet') activateMOSFET(cmp);
    else activationBusy = false;
  }

  function reversePts(pts) { return pts.slice().reverse(); }

  function activateBJT(cmp) {
    const { spec, g, extras } = cmp;
    const isNPN = spec.variant === 'npn';
    const inboundPath  = isNPN ? spec.baseLead.path    : reversePts(spec.emitterLead.path);
    const outboundPath = isNPN ? spec.emitterLead.path : reversePts(spec.baseLead.path);
    travelPointsPulse(inboundPath, { duration: 500 }).then(() => {
      g.classList.add('is-active');
      if (extras && extras.arrow) {
        setTimeout(() => {
          extras.arrow.classList.add('is-arrow-fire');
          setTimeout(() => extras.arrow.classList.remove('is-arrow-fire'), 220);
        }, 300);
      }
      setTimeout(() => travelPointsPulse(outboundPath, { duration: 900 }), 400);
      setTimeout(() => {
        g.classList.remove('is-active');
        activationBusy = false;
      }, 600);
    });
  }

  function activateMOSFET(cmp) {
    const { spec, extras } = cmp;
    travelPointsPulse(spec.gateLead.path, { duration: 500 }).then(() => {
      if (extras && extras.gatePlate) {
        extras.gatePlate.classList.add('is-gate-fire');
        setTimeout(() => extras.gatePlate.classList.remove('is-gate-fire'), 400);
      }
      if (Math.random() >= 0.65) {
        setTimeout(() => { activationBusy = false; }, 450);
        return;
      }
      setTimeout(() => {
        travelPointsPulse(spec.drainLead.path, { duration: 350, reverse: true }).then(() => {
          const segs = (extras && extras.channelSegments) || [];
          segs.forEach((segEl, i) => setTimeout(() => {
            segEl.classList.add('is-channel-fire');
            setTimeout(() => segEl.classList.remove('is-channel-fire'), 100);
          }, i * 60));
          setTimeout(() => {
            travelPointsPulse(spec.sourceLead.path, { duration: 450 }).then(() => {
              activationBusy = false;
            });
          }, 80);
        });
      }, 300);
    });
  }

  function pulseFromNameToLeaf(opts) {
    const startTrace = opts && opts.startTrace ? opts.startTrace : null;
    const primaries = traces.filter(t => t.kind === 'primary' && t.points.length >= 2);
    if (primaries.length === 0) return false;
    const start = startTrace || primaries[Math.floor(Math.random() * primaries.length)];
    const startPts = Math.random() < 0.5 ? start.points : start.points.slice().reverse();
    const TOL = 8;
    const visitedInit = new Set([start]);

    function neighbors(cursor, visited) {
      const out = [];
      for (const t of traces) {
        if (visited.has(t) || t.points.length < 2) continue;
        const head = t.points[0], tail = t.points[t.points.length - 1];
        if (Math.hypot(head.x - cursor.x, head.y - cursor.y) < TOL) out.push({ t, reverse: false });
        else if (Math.hypot(tail.x - cursor.x, tail.y - cursor.y) < TOL) out.push({ t, reverse: true });
      }
      return out;
    }

    let bestPath = null;
    let bestLen = -1;
    const MAX_NODES = 600;
    let nodes = 0;

    function dfs(cursor, visited, path) {
      if (++nodes > MAX_NODES) return;
      const next = neighbors(cursor, visited);
      if (next.length === 0) {
        const len = path.length;
        if (len > bestLen) { bestLen = len; bestPath = path.slice(); }
        return;
      }
      const order = next.slice().sort((a, b) => b.t.points.length - a.t.points.length);
      for (const pick of order) {
        if (nodes > MAX_NODES) break;
        visited.add(pick.t);
        const segPts = pick.reverse ? pick.t.points.slice().reverse() : pick.t.points;
        const before = path.length;
        for (let i = 1; i < segPts.length; i++) path.push(segPts[i]);
        dfs(path[path.length - 1], visited, path);
        path.length = before;
        visited.delete(pick.t);
      }
    }

    const path0 = startPts.slice();
    dfs(path0[path0.length - 1], visitedInit, path0);

    const finalPath = bestPath || (path0.length >= 3 ? path0 : null);
    if (!finalPath || finalPath.length < 3) return false;
    const len = finalPath.reduce((s, p, i) => i === 0 ? 0 : s + Math.hypot(p.x - finalPath[i - 1].x, p.y - finalPath[i - 1].y), 0);
    travelPointsPulse(finalPath, { duration: Math.max(1200, Math.min(5000, len * 2.0)) });
    return true;
  }

  let activationTickCount = 0;
  function activationTick() {
    if (activationLoopStopped) return;
    if (!document.hidden) {
      activationTickCount++;
      let fired = pulseFromNameToLeaf();
      for (let r = 0; r < 2 && !fired; r++) fired = pulseFromNameToLeaf();

      if (activationTickCount % 4 === 0) {
        const primaries = traces.filter(t => t.kind === 'primary' && t.points.length >= 2);
        const shuffled = primaries.slice().sort(() => Math.random() - 0.5);
        shuffled.slice(0, Math.min(3, primaries.length)).forEach((t, i) => {
          setTimeout(() => { if (!document.hidden) pulseFromNameToLeaf({ startTrace: t }); }, i * 220);
        });
      } else if (Math.random() < 0.55) {
        setTimeout(() => { if (!document.hidden) pulseFromNameToLeaf(); }, 600 + Math.random() * 800);
      }

      if (Math.random() < 0.35 && !activationBusy) {
        const cmp = pickActivatableComponent();
        if (cmp) activateComponent(cmp);
      }
    }
    const delay = 1800 + Math.random() * 2000;
    activationLoopTimer = setTimeout(activationTick, delay);
  }

  function pulseBackFromTerminal(side) {
    const pathEl = svg.querySelector(`.circuit__primary path[data-primary-id="${side}"]`);
    if (!pathEl) return;
    const trace = traces.find(t => t.pathEl === pathEl);
    if (!trace || trace.points.length < 2) return;
    travelPointsPulse(trace.points, { reverse: true, duration: 900 });
  }

  function wireTerminals() {
    const terminals = document.querySelectorAll('.terminal');
    terminals.forEach(el => {
      const side = el.getAttribute('data-terminal');
      const wrap = el.closest('.terminal-wrap');
      let lastFire = 0;
      const fire = () => {
        const now = performance.now();
        if (now - lastFire < 500) return;
        lastFire = now;
        if (!prefersReduced) pulseBackFromTerminal(side);
      };
      el.addEventListener('pointerenter', fire);
      el.addEventListener('focus', fire);

      el.addEventListener('click', (e) => {
        if (!wrap) return;
        const willOpen = !wrap.classList.contains('is-open');
        document.querySelectorAll('.terminal-wrap.is-open').forEach(w => {
          if (w !== wrap) w.classList.remove('is-open');
        });
        wrap.classList.toggle('is-open', willOpen);
        if (!willOpen) el.blur();
        e.stopPropagation();
      });
    });

    document.addEventListener('click', (e) => {
      const inside = e.target && e.target.closest && e.target.closest('.terminal-wrap');
      if (inside) return;
      document.querySelectorAll('.terminal-wrap.is-open').forEach(w => w.classList.remove('is-open'));
      document.querySelectorAll('.terminal').forEach(t => t.blur());
    });

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      document.querySelectorAll('.terminal-wrap.is-open').forEach(w => w.classList.remove('is-open'));
      document.querySelectorAll('.terminal').forEach(t => t.blur());
    });
  }

  function buildStaticLattice() {
    const target = 60;
    const maxAttempts = target * 20;
    let attempts = 0;
    while (branchCount < target && attempts < maxAttempts) {
      attempts++;
      const viable = viableOrigins(TOL_COS_RELAXED, 30 * Math.PI / 180);
      if (viable.length === 0) break;
      const pick = pickFromViable(viable);
      if (!pick) break;
      const archetype = pickArchetypeForRoom(pick.room.edgeDist);
      if (!archetype) continue;
      const draft = tryDraftAt(pick, archetype);
      if (!draft) continue;
      if (pick.ep._seedIdx !== undefined) {
        placedSeedIndices.add(pick.ep._seedIdx);
        addEndpoint(pick.ep.x, pick.ep.y, true);
      }
      drawDraft(draft);
      branchCount++;
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearTimeout(growthTimer);
      clearTimeout(activationLoopTimer);
    } else if (!prefersReduced) {
      if (!growthStopped) scheduleNextBranch(0);
      if (!activationLoopStopped) activationLoopTimer = setTimeout(activationTick, 2000);
    }
  });

  function refreshAllForViewport() {
    LATTICE_SCALE = latticeScaleFor(window.innerWidth);
    updateBgViewport();
    refreshLockupMappedPoints();
    buildSvgExclusionZones();
    rebuildHtmlExclusionZones();
  }

  function resetAndRegrowLattice() {
    clearTimeout(growthTimer);
    for (const w of activeWatchdogs) clearTimeout(w);
    activeWatchdogs.clear();
    activeGrowth = 0;

    latticeLayer.replaceChildren();
    componentLayer.replaceChildren();
    pulseLayer.replaceChildren();

    for (let i = traces.length - 1; i >= 0; i--) {
      if (traces[i].kind !== 'primary') traces.splice(i, 1);
    }
    endpoints.length = 0;
    components.length = 0;
    bodyBoxes.length = 0;
    placedSeedIndices.clear();
    branchCount = 0;

    for (const t of traces) {
      if (t.kind === 'primary') t.points.forEach(p => addEndpoint(p.x, p.y, true));
    }

    growthStartMs = performance.now();
    scheduleNextBranch(0);
  }

  function boot() {
    updateBgViewport();
    refreshLockupMappedPoints();

    let resizeTimer = null;
    let lastResizeW = window.innerWidth;
    window.addEventListener('resize', () => {
      const w = window.innerWidth;
      if (Math.abs(w - lastResizeW) < 50) return;
      lastResizeW = w;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        refreshAllForViewport();
        if (!prefersReduced) resetAndRegrowLattice();
      }, 600);
    });

    wireTerminals();

    function whenLayoutReady(fn) {
      const ready = document.fonts && document.fonts.ready
        ? document.fonts.ready
        : Promise.resolve();
      const start = performance.now();
      let lastWidth = 0;
      let stableFrames = 0;
      function check() {
        const r = svg.getBoundingClientRect();
        const w = Math.round(r.width * 10) / 10;
        if (w > 0 && w === lastWidth) stableFrames++;
        else { stableFrames = 0; lastWidth = w; }
        const elapsed = performance.now() - start;
        if ((stableFrames >= 3 && elapsed >= 200) || elapsed >= 2500) {
          fn();
          return;
        }
        requestAnimationFrame(check);
      }
      ready.then(() => requestAnimationFrame(check));
    }

    whenLayoutReady(() => {
      updateBgViewport();
      refreshLockupMappedPoints();
      registerExistingPaths();
      buildSvgExclusionZones();
      rebuildHtmlExclusionZones();
      setTimeout(refreshAllForViewport, 600);
      setTimeout(refreshAllForViewport, 1800);

      if (prefersReduced) {
        buildStaticLattice();
        return;
      }

      drawPrimaryRails();
      setTimeout(flashTerminalLabels, 1900);
      growthStartMs = performance.now() + 2600;
      setTimeout(() => { scheduleNextBranch(0); }, 2600);
      setTimeout(() => {
        activationLoopTimer = setTimeout(activationTick, 0);
      }, 14000);
    });

    let lastBC = branchCount, lastBA = performance.now();
    setInterval(() => {
      const now = performance.now();
      bgSvg.querySelectorAll('.pulse-dot').forEach(d => {
        if (!d.dataset.t0) d.dataset.t0 = String(now);
        else if (now - +d.dataset.t0 > 3000 && d.parentNode) d.parentNode.removeChild(d);
      });
      document.querySelectorAll(
        '.component.is-active, .is-arrow-fire, .is-gate-fire, .is-channel-fire'
      ).forEach(el => {
        if (!el.dataset.activeAt) el.dataset.activeAt = String(now);
        else if (now - +el.dataset.activeAt > 2000) {
          el.classList.remove('is-active', 'is-arrow-fire', 'is-gate-fire', 'is-channel-fire');
          delete el.dataset.activeAt;
          activationBusy = false;
        }
      });
      if (branchCount !== lastBC) { lastBC = branchCount; lastBA = now; }
      else if (now - lastBA > 8000 && activeGrowth > 0) {
        activeGrowth = 0;
        if (!growthStopped && !document.hidden) scheduleNextBranch(0);
        lastBA = now;
      }
    }, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
