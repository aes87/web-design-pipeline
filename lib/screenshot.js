import path from 'node:path';
import { mkdir } from 'node:fs/promises';

/**
 * Default viewports for screenshot capture.
 */
const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 667 },
];

/**
 * Capture screenshots of a page at multiple viewports.
 * Requires Playwright to be installed.
 *
 * @param {string} url - URL to capture
 * @param {string} outputDir - directory to save screenshots
 * @param {Object} [options]
 * @param {Array} [options.viewports] - custom viewports
 * @param {boolean} [options.fullPage=true] - capture full page
 * @param {number} [options.waitMs=1000] - wait for animations to settle
 * @returns {Promise<Array<{name: string, width: number, height: number, path: string}>>}
 */
export async function captureScreenshots(url, outputDir, options = {}) {
  const { chromium } = await import('playwright');
  const viewports = options.viewports || VIEWPORTS;
  const fullPage = options.fullPage ?? true;
  const waitMs = options.waitMs ?? 1000;

  await mkdir(outputDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const results = [];

  try {
    for (const vp of viewports) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 2,
      });
      const page = await context.newPage();

      await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });

      // Wait for animations to settle
      if (waitMs > 0) {
        await page.waitForTimeout(waitMs);
      }

      const filename = `${vp.name}-${vp.width}x${vp.height}.png`;
      const filepath = path.join(outputDir, filename);

      await page.screenshot({ path: filepath, fullPage });

      results.push({
        name: vp.name,
        width: vp.width,
        height: vp.height,
        path: filepath,
      });

      await context.close();
    }
  } finally {
    await browser.close();
  }

  return results;
}

/**
 * Capture a single screenshot at a specific viewport.
 * @param {string} url
 * @param {string} outputPath
 * @param {Object} [viewport] - { width, height }
 * @returns {Promise<string>} path to screenshot
 */
export async function captureOne(url, outputPath, viewport = VIEWPORTS[0]) {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: outputPath, fullPage: true });
    await context.close();
  } finally {
    await browser.close();
  }

  return outputPath;
}
