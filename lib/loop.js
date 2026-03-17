import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { startServer } from './server.js';
import { captureScreenshots } from './screenshot.js';
import { validateHTML, validateAccessibility, validatePerformance } from './validate.js';

/**
 * Run a single validation pass for a design.
 * The agent controls looping externally — this is a pure single-pass tool.
 *
 * Steps: serve → screenshot → validate HTML → validate a11y → check performance
 *
 * @param {string} designDir - path to design directory (e.g., designs/my-page)
 * @param {Object} [options]
 * @param {boolean} [options.screenshotOnly] - only capture screenshots, skip validation
 * @param {boolean} [options.skipScreenshots] - skip screenshots, validate only
 * @param {number} [options.port=3333] - dev server port
 * @returns {Promise<Object>} structured report
 */
export async function runPass(designDir, options = {}) {
  const designName = path.basename(designDir);
  const outputDir = path.join(designDir, 'output');
  const screenshotDir = path.join(outputDir, 'screenshots');
  const htmlPath = path.join(designDir, 'index.html');

  await mkdir(outputDir, { recursive: true });
  await mkdir(screenshotDir, { recursive: true });

  const report = { designName, steps: [], pass: true };
  const port = options.port || 3333;

  // Step 1: Start dev server
  let srv;
  try {
    srv = startServer(designDir, port);
    report.steps.push({ step: 'server', status: 'ok', url: srv.url });
  } catch (err) {
    report.steps.push({ step: 'server', status: 'error', error: err.message });
    report.pass = false;
    return report;
  }

  try {
    // Step 2: Capture screenshots
    if (!options.skipScreenshots) {
      try {
        const screenshots = await captureScreenshots(srv.url, screenshotDir, {
          waitMs: 1500,
        });
        report.steps.push({
          step: 'screenshots',
          status: 'ok',
          captures: screenshots.map(s => ({
            name: s.name,
            viewport: `${s.width}x${s.height}`,
            path: s.path,
          })),
        });
      } catch (err) {
        report.steps.push({ step: 'screenshots', status: 'error', error: err.message });
        // Screenshots failing is not a hard failure — continue validation
      }
    }

    if (options.screenshotOnly) {
      return report;
    }

    // Step 3: Validate HTML
    try {
      const htmlResult = await validateHTML(htmlPath);
      report.steps.push({ step: 'html-validate', status: 'ok', result: htmlResult });
      if (!htmlResult.pass) report.pass = false;
    } catch (err) {
      report.steps.push({ step: 'html-validate', status: 'error', error: err.message });
      report.pass = false;
    }

    // Step 4: Validate accessibility (needs browser)
    try {
      const { chromium } = await import('playwright');
      const browser = await chromium.launch({ headless: true });
      const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
      });
      const page = await context.newPage();
      await page.goto(srv.url, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(500);

      const a11yResult = await validateAccessibility(page);
      report.steps.push({ step: 'accessibility', status: 'ok', result: a11yResult });
      if (!a11yResult.pass) report.pass = false;

      await context.close();
      await browser.close();
    } catch (err) {
      report.steps.push({ step: 'accessibility', status: 'error', error: err.message });
      report.pass = false;
    }

    // Step 5: Performance budget
    try {
      const perfResult = await validatePerformance(designDir);
      report.steps.push({ step: 'performance', status: 'ok', result: perfResult });
      if (!perfResult.pass) report.pass = false;
    } catch (err) {
      report.steps.push({ step: 'performance', status: 'error', error: err.message });
      report.pass = false;
    }
  } finally {
    // Always close the server
    srv.close();
  }

  // Write report to file
  const reportPath = path.join(outputDir, 'validation-report.json');
  await writeFile(reportPath, JSON.stringify(report, null, 2));

  return report;
}
