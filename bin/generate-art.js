#!/usr/bin/env node

/**
 * CLI: Generate generative art code snippets for a design.
 *
 * Usage:
 *   node bin/generate-art.js <design-dir> [options]
 *
 * Options:
 *   --type=flow-field,morphing-blobs   Comma-separated art types
 *   --style=dark-luxury               Aesthetic keyword (auto-selects types)
 *   --seed=42                         PRNG seed for reproducibility
 *   --stdout                          Print generated code to stdout instead of files
 *   --list                            List available art types
 *
 * Writes { html, css, js } JSON files to designs/<name>/assets/art/.
 */

import path from 'node:path';
import { generateSet, listTypes, writeAssets } from '../lib/generative-art.js';

const args = process.argv.slice(2);
const flags = args.filter(a => a.startsWith('--'));
const positional = args.filter(a => !a.startsWith('--'));

// --list
if (flags.includes('--list')) {
  const descriptions = {
    'flow-field': 'Perlin noise-driven particle trails (Canvas 2D)',
    'noise-gradient': 'Animated multi-color noise gradient (Canvas 2D)',
    'particle-constellation': 'Dots with connecting lines + cursor interaction (Canvas 2D)',
    'geometric-mesh': 'Animated triangulated grid pattern (Canvas 2D)',
    'morphing-blobs': 'CSS/SVG animated organic blob shapes (no JS needed)',
    'wave-landscape': '3D perspective wave terrain (Canvas 2D)',
  };
  console.log('Available generative art types:\n');
  for (const type of listTypes()) {
    console.log(`  ${type.padEnd(26)} ${descriptions[type] || ''}`);
  }
  process.exit(0);
}

if (positional.length === 0) {
  console.error('Usage: node bin/generate-art.js <design-dir> [options]');
  console.error('');
  console.error('Options:');
  console.error('  --type=flow-field,morphing-blobs  Comma-separated art types');
  console.error('  --style=dark-luxury               Aesthetic keyword (auto-selects types)');
  console.error('  --seed=42                         PRNG seed for reproducibility');
  console.error('  --stdout                          Print code to stdout instead of files');
  console.error('  --list                            List available art types');
  process.exit(1);
}

const designDir = path.resolve(positional[0]);
const typeFlag = flags.find(f => f.startsWith('--type='));
const styleFlag = flags.find(f => f.startsWith('--style='));
const seedFlag = flags.find(f => f.startsWith('--seed='));
const toStdout = flags.includes('--stdout');

const types = typeFlag ? typeFlag.split('=')[1].split(',').map(s => s.trim()) : undefined;
const style = styleFlag ? styleFlag.split('=')[1] : '';
const seed = seedFlag ? parseInt(seedFlag.split('=')[1], 10) : 42;

try {
  const arts = generateSet({ types, style, seed });

  if (arts.length === 0) {
    console.error('No art generated. Use --list to see available types.');
    process.exit(1);
  }

  if (toStdout) {
    // Print all snippets to stdout as JSON
    console.log(JSON.stringify(arts, null, 2));
  } else {
    // Write to disk
    const paths = await writeAssets(designDir, arts);

    const report = {
      designDir,
      style,
      seed,
      generated: arts.map((a, i) => ({
        name: a.name,
        path: paths[i],
        htmlBytes: Buffer.byteLength(a.html, 'utf-8'),
        cssBytes: Buffer.byteLength(a.css, 'utf-8'),
        jsBytes: Buffer.byteLength(a.js, 'utf-8'),
      })),
    };

    // JSON to stdout
    console.log(JSON.stringify(report, null, 2));

    // Human-readable to stderr
    console.error(`\nGenerated ${arts.length} generative art snippet(s):`);
    for (const item of report.generated) {
      const total = item.htmlBytes + item.cssBytes + item.jsBytes;
      console.error(`  ${item.name} (${total} bytes total) → ${item.path}`);
    }
  }
} catch (err) {
  console.error('Error:', err.message);
  if (err.stack) console.error(err.stack);
  process.exit(2);
}
