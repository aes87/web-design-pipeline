#!/usr/bin/env node

/**
 * CLI: Generate SVG decorative assets for a design.
 *
 * Usage:
 *   node bin/generate-svg.js <design-dir> [options]
 *
 * Options:
 *   --type=wave-divider,blob,dot-grid   Comma-separated SVG types
 *   --style=dark-luxury                 Aesthetic keyword (auto-selects types)
 *   --seed=42                           PRNG seed for reproducibility
 *   --list                              List available SVG types
 *
 * Reads designs/<name>/tokens.json for colors.
 * Writes SVGs to designs/<name>/assets/svg/.
 */

import path from 'node:path';
import { readTokens, extractColors, generateSet, writeAssets } from '../lib/svg-gen.js';

const args = process.argv.slice(2);
const flags = args.filter(a => a.startsWith('--'));
const positional = args.filter(a => !a.startsWith('--'));

// --list
if (flags.includes('--list')) {
  const types = [
    'wave-divider   Multi-layer wave section dividers',
    'blob           Organic blob shapes',
    'geometric-pattern  Repeating tiled patterns (hex, triangle, circle, etc.)',
    'dot-grid       Grid of dots with optional radial falloff',
    'abstract       Abstract composition of circles, arcs, lines',
    'noise          SVG feTurbulence grain texture',
    'rings          Concentric ring decoration',
    'radial-burst   Lines radiating from a center point',
  ];
  console.log('Available SVG types:\n');
  for (const t of types) console.log(`  ${t}`);
  process.exit(0);
}

if (positional.length === 0) {
  console.error('Usage: node bin/generate-svg.js <design-dir> [options]');
  console.error('');
  console.error('Options:');
  console.error('  --type=wave-divider,blob   Comma-separated SVG types to generate');
  console.error('  --style=dark-luxury        Aesthetic keyword (auto-selects types)');
  console.error('  --seed=42                  PRNG seed for reproducibility');
  console.error('  --list                     List available SVG types');
  process.exit(1);
}

const designDir = path.resolve(positional[0]);
const typeFlag = flags.find(f => f.startsWith('--type='));
const styleFlag = flags.find(f => f.startsWith('--style='));
const seedFlag = flags.find(f => f.startsWith('--seed='));

const types = typeFlag ? typeFlag.split('=')[1].split(',').map(s => s.trim()) : undefined;
const style = styleFlag ? styleFlag.split('=')[1] : '';
const seed = seedFlag ? parseInt(seedFlag.split('=')[1], 10) : 42;

try {
  // Read tokens for color extraction
  let tokens;
  try {
    tokens = await readTokens(designDir);
  } catch {
    console.error(`Warning: No tokens.json found in ${designDir}, using default colors.`);
    tokens = {};
  }

  // Generate SVGs
  const svgs = generateSet({ tokens, types, style, seed });

  if (svgs.length === 0) {
    console.error('No SVGs generated. Use --list to see available types.');
    process.exit(1);
  }

  // Write to disk
  const paths = await writeAssets(designDir, svgs);

  // Report
  const report = {
    designDir,
    style,
    seed,
    generated: svgs.map((s, i) => ({
      name: s.name,
      description: s.description,
      path: paths[i],
      bytes: Buffer.byteLength(s.svg, 'utf-8'),
    })),
  };

  // JSON to stdout
  console.log(JSON.stringify(report, null, 2));

  // Human-readable to stderr
  console.error(`\nGenerated ${svgs.length} SVG asset(s):`);
  for (const item of report.generated) {
    console.error(`  ${item.name} (${item.bytes} bytes) → ${item.path}`);
  }
} catch (err) {
  console.error('Error:', err.message);
  if (err.stack) console.error(err.stack);
  process.exit(2);
}
