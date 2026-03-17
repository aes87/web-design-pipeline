#!/usr/bin/env node

import { runPass } from '../lib/loop.js';
import path from 'node:path';

const args = process.argv.slice(2);
const flags = args.filter(a => a.startsWith('--'));
const positional = args.filter(a => !a.startsWith('--'));

if (positional.length === 0) {
  console.error('Usage: node bin/validate.js <design-dir> [--screenshot-only] [--skip-screenshots]');
  console.error('');
  console.error('Options:');
  console.error('  --screenshot-only   Only capture screenshots, skip validation');
  console.error('  --skip-screenshots  Skip screenshots, validate files only');
  console.error('  --port=NNNN         Dev server port (default: 3333)');
  process.exit(1);
}

const designDir = path.resolve(positional[0]);
const portFlag = flags.find(f => f.startsWith('--port='));
const options = {
  screenshotOnly: flags.includes('--screenshot-only'),
  skipScreenshots: flags.includes('--skip-screenshots'),
  port: portFlag ? parseInt(portFlag.split('=')[1], 10) : 3333,
};

try {
  const report = await runPass(designDir, options);

  // JSON report to stdout (machine-readable)
  console.log(JSON.stringify(report, null, 2));

  // Human-readable summary to stderr
  if (options.screenshotOnly) {
    const shots = report.steps.find(s => s.step === 'screenshots');
    if (shots?.captures) {
      console.error(`\nScreenshots captured: ${shots.captures.length}`);
      for (const c of shots.captures) {
        console.error(`  ${c.name} (${c.viewport}): ${c.path}`);
      }
    }
  } else if (report.pass) {
    console.error('\nValidation PASSED');
    printSummary(report);
  } else {
    console.error('\nValidation FAILED');
    printSummary(report);
    printFailures(report);
    process.exit(1);
  }
} catch (err) {
  console.error('Fatal error:', err.message);
  if (err.stack) console.error(err.stack);
  process.exit(2);
}

function printSummary(report) {
  for (const step of report.steps) {
    if (step.status === 'error') {
      console.error(`  ${step.step}: ERROR — ${step.error}`);
    } else if (step.result) {
      const pass = step.result.pass ? 'PASS' : 'FAIL';
      const detail = formatStepDetail(step);
      console.error(`  ${step.step}: ${pass}${detail}`);
    } else {
      console.error(`  ${step.step}: OK`);
    }
  }
}

function formatStepDetail(step) {
  switch (step.step) {
    case 'html-validate':
      return ` (${step.result.errors} errors, ${step.result.warnings} warnings)`;
    case 'accessibility':
      return ` (${step.result.violations} violations: ${step.result.critical} critical, ${step.result.serious} serious)`;
    case 'performance':
      return ` (${step.result.checks.length} checks)`;
    default:
      return '';
  }
}

function printFailures(report) {
  for (const step of report.steps) {
    if (step.result && !step.result.pass) {
      console.error(`\n--- ${step.step} failures ---`);

      if (step.step === 'html-validate' && step.result.messages) {
        for (const msg of step.result.messages.slice(0, 10)) {
          console.error(`  L${msg.line}:${msg.column} [${msg.ruleId}] ${msg.message}`);
        }
        if (step.result.messages.length > 10) {
          console.error(`  ... and ${step.result.messages.length - 10} more`);
        }
      }

      if (step.step === 'accessibility' && step.result.details) {
        for (const v of step.result.details.filter(d => d.impact === 'critical' || d.impact === 'serious')) {
          console.error(`  [${v.impact}] ${v.id}: ${v.help} (${v.nodes} nodes)`);
        }
      }

      if (step.step === 'performance' && step.result.checks) {
        for (const c of step.result.checks.filter(c => !c.pass)) {
          console.error(`  ${c.name}: expected ${c.expected}, got ${c.actual}`);
        }
      }
    }
  }
}
