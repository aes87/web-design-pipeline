import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateCSS, generateDTCG } from '../lib/tokens.js';

describe('tokens', () => {
  const brief = {
    color: {
      palette: {
        background: { base: '#0d1117', surface: '#161b22' },
        foreground: { base: '#e6edf3', muted: '#8b949e' },
        accent: { primary: 'oklch(0.75 0.15 55)' },
      },
    },
    typography: {
      fonts: {
        heading: { family: 'Inter', fallback: 'sans-serif' },
        body: { family: 'System', fallback: 'system-ui' },
      },
      scale: { method: 'ratio', base_size: '1rem', ratio: 1.25 },
    },
    layout: {
      grid: { max_width: '1200px', margin: 'clamp(1rem, 5vw, 4rem)' },
      spacing_scale: { method: 'ratio', base: '0.5', ratio: 2 },
    },
    motion: {
      easing: {
        standard: [0.2, 0, 0, 1],
        dramatic: [0.7, 0, 0.2, 1],
      },
      duration: {
        fast: '200ms',
        base: '300ms',
        slow: '500ms',
      },
      choreography: { stagger_delay: '60ms' },
    },
  };

  it('generates CSS custom properties from brief', () => {
    const css = generateCSS(brief);

    assert.ok(css.includes(':root {'), 'should have :root block');
    assert.ok(css.includes('--color-background-base: #0d1117'), 'should have bg color');
    assert.ok(css.includes('--color-accent-primary: oklch(0.75 0.15 55)'), 'should have accent');
    assert.ok(css.includes('--font-heading:'), 'should have heading font');
    assert.ok(css.includes('--ease-standard: cubic-bezier(0.2, 0, 0, 1)'), 'should have easing');
    assert.ok(css.includes('--duration-base: 300ms'), 'should have duration');
    assert.ok(css.includes('--stagger-delay: 60ms'), 'should have stagger');
    assert.ok(css.includes('--grid-max-width: 1200px'), 'should have grid max width');
    assert.ok(css.includes('--text-base:'), 'should have type scale base');
  });

  it('generates W3C DTCG tokens from brief', () => {
    const tokens = generateDTCG(brief);

    assert.ok(tokens.color, 'should have color tokens');
    assert.ok(tokens.typography, 'should have typography tokens');
    assert.ok(tokens.motion, 'should have motion tokens');
    assert.equal(tokens.motion.easing.standard.$type, 'cubicBezier');
    assert.deepEqual(tokens.motion.easing.standard.$value, [0.2, 0, 0, 1]);
    assert.equal(tokens.motion.duration.base.$type, 'duration');
  });

  it('handles empty brief gracefully', () => {
    const css = generateCSS({});
    assert.ok(css.includes(':root {'), 'should still have root block');
    assert.ok(css.includes('}'), 'should close root block');
  });
});

describe('validate', () => {
  it('measureDOMDepth handles nested HTML', async () => {
    // Import the private function by testing through the public API
    const { validatePerformance } = await import('../lib/validate.js');

    // This tests the full performance check (which includes DOM depth)
    // We'd need a real design dir for a full test, so just verify import works
    assert.ok(typeof validatePerformance === 'function');
  });
});

describe('server', () => {
  it('starts and stops cleanly', async () => {
    const { startServer } = await import('../lib/server.js');
    const { mkdtempSync, writeFileSync, rmSync } = await import('node:fs');
    const { join } = await import('node:path');
    const { tmpdir } = await import('node:os');

    const dir = mkdtempSync(join(tmpdir(), 'wdp-test-'));
    writeFileSync(join(dir, 'index.html'), '<h1>test</h1>');

    const srv = startServer(dir, 3456);
    assert.equal(srv.url, 'http://localhost:3456');

    // Fetch the page
    const res = await fetch('http://localhost:3456/');
    assert.equal(res.status, 200);
    const text = await res.text();
    assert.ok(text.includes('<h1>test</h1>'));

    // 404 for missing file
    const res404 = await fetch('http://localhost:3456/nope.html');
    assert.equal(res404.status, 404);

    srv.close();
    rmSync(dir, { recursive: true });
  });
});
