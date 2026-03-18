import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Run HTML validation using html-validate.
 * @param {string} htmlPath - path to HTML file
 * @returns {Promise<{pass: boolean, errors: number, warnings: number, messages: Array}>}
 */
export async function validateHTML(htmlPath) {
  const { exec } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const execAsync = promisify(exec);

  try {
    // html-validate outputs JSON with --formatter json
    const { stdout } = await execAsync(
      `npx html-validate --formatter json "${htmlPath}"`,
      { timeout: 30000 }
    );
    const results = JSON.parse(stdout);
    const messages = results.flatMap(r => r.messages || []);
    const errors = messages.filter(m => m.severity === 2);
    const warnings = messages.filter(m => m.severity === 1);

    return {
      pass: errors.length === 0,
      errors: errors.length,
      warnings: warnings.length,
      messages: errors.concat(warnings).map(m => ({
        severity: m.severity === 2 ? 'error' : 'warning',
        message: m.message,
        line: m.line,
        column: m.column,
        ruleId: m.ruleId,
      })),
    };
  } catch (err) {
    // html-validate exits non-zero on validation errors
    if (err.stdout) {
      try {
        const results = JSON.parse(err.stdout);
        const messages = results.flatMap(r => r.messages || []);
        const errors = messages.filter(m => m.severity === 2);
        const warnings = messages.filter(m => m.severity === 1);

        return {
          pass: errors.length === 0,
          errors: errors.length,
          warnings: warnings.length,
          messages: errors.concat(warnings).map(m => ({
            severity: m.severity === 2 ? 'error' : 'warning',
            message: m.message,
            line: m.line,
            column: m.column,
            ruleId: m.ruleId,
          })),
        };
      } catch {
        // fall through
      }
    }
    return {
      pass: false,
      errors: 1,
      warnings: 0,
      messages: [{ severity: 'error', message: err.message }],
    };
  }
}

/**
 * Run CSS validation using stylelint.
 * @param {string} cssPath - path to CSS file
 * @returns {Promise<{pass: boolean, errors: number, warnings: number, messages: Array}>}
 */
export async function validateCSS(cssPath) {
  try {
    const stylelint = await import('stylelint');
    const lint = stylelint.default?.lint ?? stylelint.lint;

    const result = await lint({
      files: cssPath,
      configFile: join(import.meta.dirname ?? new URL('.', import.meta.url).pathname, '..', '.stylelintrc.json'),
    });

    const messages = [];
    let errorCount = 0;
    let warningCount = 0;

    for (const fileResult of result.results) {
      for (const warning of fileResult.warnings) {
        const severity = warning.severity === 'error' ? 'error' : 'warning';
        if (severity === 'error') {
          errorCount++;
        } else {
          warningCount++;
        }
        messages.push({
          severity,
          message: warning.text,
          line: warning.line,
          column: warning.column,
          ruleId: warning.rule,
        });
      }
    }

    return {
      pass: errorCount === 0,
      errors: errorCount,
      warnings: warningCount,
      messages,
    };
  } catch (err) {
    return {
      pass: false,
      errors: 1,
      warnings: 0,
      messages: [{ severity: 'error', message: err.message }],
    };
  }
}

/**
 * Run accessibility checks using axe-core via Playwright.
 * @param {import('playwright').Page} page - Playwright page already navigated to the URL
 * @returns {Promise<{pass: boolean, violations: number, critical: number, serious: number, details: Array}>}
 */
export async function validateAccessibility(page) {
  const { AxeBuilder } = await import('@axe-core/playwright');

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  const critical = results.violations.filter(v => v.impact === 'critical');
  const serious = results.violations.filter(v => v.impact === 'serious');
  const moderate = results.violations.filter(v => v.impact === 'moderate');
  const minor = results.violations.filter(v => v.impact === 'minor');

  return {
    pass: critical.length === 0 && serious.length === 0,
    violations: results.violations.length,
    critical: critical.length,
    serious: serious.length,
    moderate: moderate.length,
    minor: minor.length,
    details: results.violations.map(v => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      help: v.help,
      nodes: v.nodes.length,
    })),
  };
}

/**
 * Check performance budget (file sizes, DOM complexity).
 * @param {string} designDir - path to design directory
 * @param {Object} [budget]
 * @param {number} [budget.maxTotalKB=100] - max combined HTML+CSS+JS size in KB
 * @param {number} [budget.maxDOMDepth=15] - max DOM nesting depth
 * @returns {Promise<{pass: boolean, checks: Array}>}
 */
export async function validatePerformance(designDir, budget = {}) {
  const maxTotalKB = budget.maxTotalKB ?? 100;
  const maxDOMDepth = budget.maxDOMDepth ?? 15;
  const checks = [];

  // File size check
  const files = ['index.html', 'style.css', 'script.js'];
  let totalBytes = 0;
  const breakdown = {};

  for (const file of files) {
    const filepath = join(designDir, file);
    if (existsSync(filepath)) {
      const s = await stat(filepath);
      totalBytes += s.size;
      breakdown[file] = Math.round(s.size / 1024 * 10) / 10;
    }
  }

  const totalKB = Math.round(totalBytes / 1024 * 10) / 10;
  checks.push({
    name: 'file-size',
    expected: `<= ${maxTotalKB}KB`,
    actual: `${totalKB}KB`,
    breakdown,
    pass: totalKB <= maxTotalKB,
  });

  // DOM depth check (parse HTML and count nesting)
  const htmlPath = join(designDir, 'index.html');
  if (existsSync(htmlPath)) {
    const html = await readFile(htmlPath, 'utf-8');
    const depth = measureDOMDepth(html);
    checks.push({
      name: 'dom-depth',
      expected: `<= ${maxDOMDepth}`,
      actual: depth,
      pass: depth <= maxDOMDepth,
    });
  }

  // Check for prefers-reduced-motion
  const cssPath = join(designDir, 'style.css');
  if (existsSync(cssPath)) {
    const css = await readFile(cssPath, 'utf-8');
    const hasReducedMotion = css.includes('prefers-reduced-motion');
    checks.push({
      name: 'reduced-motion',
      expected: 'present',
      actual: hasReducedMotion ? 'present' : 'missing',
      pass: hasReducedMotion,
    });
  }

  // Check for prefers-reduced-motion in JS too
  const jsPath = join(designDir, 'script.js');
  if (existsSync(jsPath)) {
    const js = await readFile(jsPath, 'utf-8');
    const hasReducedMotion = js.includes('prefers-reduced-motion') || js.includes('matchMedia');
    checks.push({
      name: 'reduced-motion-js',
      expected: 'present',
      actual: hasReducedMotion ? 'present' : 'missing',
      pass: hasReducedMotion,
    });
  }

  return {
    pass: checks.every(c => c.pass),
    checks,
  };
}

/**
 * Run Lighthouse CI checks against a running dev server.
 * @param {string} url - URL to test (e.g., http://localhost:3333)
 * @returns {Promise<{pass: boolean, scores: Object, assertions: Array}>}
 */
export async function validateLighthouse(url) {
  const { exec: execCb } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const execAsync = promisify(execCb);

  try {
    const { stdout } = await execAsync(
      `npx @lhci/cli autorun --collect.url="${url}" --config=lighthouserc.js`,
      { timeout: 120000 }
    );

    // Parse Lighthouse output for scores
    const perfMatch = stdout.match(/performance:\s*([\d.]+)/i);
    const a11yMatch = stdout.match(/accessibility:\s*([\d.]+)/i);

    const scores = {
      performance: perfMatch ? parseFloat(perfMatch[1]) : null,
      accessibility: a11yMatch ? parseFloat(a11yMatch[1]) : null,
    };

    // Check if assertions passed (exit code 0 = pass)
    return {
      pass: true,
      scores,
      output: stdout,
    };
  } catch (err) {
    // Non-zero exit = assertion failures
    const stdout = err.stdout || '';
    const perfMatch = stdout.match(/performance:\s*([\d.]+)/i);
    const a11yMatch = stdout.match(/accessibility:\s*([\d.]+)/i);

    return {
      pass: false,
      scores: {
        performance: perfMatch ? parseFloat(perfMatch[1]) : null,
        accessibility: a11yMatch ? parseFloat(a11yMatch[1]) : null,
      },
      output: stdout,
      error: err.message,
    };
  }
}

/**
 * Measure max DOM depth from HTML string using a simple tag counter.
 * Not a full parser — good enough for validation.
 */
function measureDOMDepth(html) {
  let maxDepth = 0;
  let depth = 0;

  // Strip comments, scripts, styles (their content isn't DOM children)
  const stripped = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '<script></script>')
    .replace(/<style[\s\S]*?<\/style>/gi, '<style></style>');

  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*\/?>/g;
  const voidElements = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr',
  ]);

  let match;
  while ((match = tagRegex.exec(stripped))) {
    const tag = match[0];
    const name = match[1].toLowerCase();

    if (voidElements.has(name) || tag.endsWith('/>')) continue;

    if (tag.startsWith('</')) {
      depth = Math.max(0, depth - 1);
    } else {
      depth++;
      maxDepth = Math.max(maxDepth, depth);
    }
  }

  return maxDepth;
}
