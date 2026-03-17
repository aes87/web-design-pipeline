import { readFileSync, existsSync } from 'node:fs';
import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

/**
 * Compare two screenshots using pixelmatch.
 * @param {string} actualPath - path to current screenshot
 * @param {string} baselinePath - path to baseline screenshot
 * @param {string} diffPath - path to save diff image
 * @param {Object} [options]
 * @param {number} [options.threshold=0.1] - matching threshold (0 = exact, 1 = any)
 * @returns {Promise<{pass: boolean, diffPixels: number, totalPixels: number, diffPercent: number}>}
 */
export async function compareScreenshots(actualPath, baselinePath, diffPath, options = {}) {
  const pixelmatch = (await import('pixelmatch')).default;
  const { PNG } = await import('pngjs');
  const threshold = options.threshold ?? 0.1;
  const maxDiffPercent = options.maxDiffPercent ?? 1.0;

  const actual = PNG.sync.read(readFileSync(actualPath));
  const baseline = PNG.sync.read(readFileSync(baselinePath));

  // Images must be same size
  if (actual.width !== baseline.width || actual.height !== baseline.height) {
    return {
      pass: false,
      diffPixels: -1,
      totalPixels: actual.width * actual.height,
      diffPercent: 100,
      error: `Size mismatch: actual ${actual.width}x${actual.height} vs baseline ${baseline.width}x${baseline.height}`,
    };
  }

  const diff = new PNG({ width: actual.width, height: actual.height });

  const diffPixels = pixelmatch(
    actual.data,
    baseline.data,
    diff.data,
    actual.width,
    actual.height,
    { threshold }
  );

  const totalPixels = actual.width * actual.height;
  const diffPercent = round((diffPixels / totalPixels) * 100);

  // Write diff image
  await mkdir(path.dirname(diffPath), { recursive: true });
  const { writeFileSync } = await import('node:fs');
  writeFileSync(diffPath, PNG.sync.write(diff));

  return {
    pass: diffPercent <= maxDiffPercent,
    diffPixels,
    totalPixels,
    diffPercent,
  };
}

/**
 * Run visual regression for a design, comparing current screenshots to baselines.
 * @param {string} designDir - design directory
 * @returns {Promise<{pass: boolean, comparisons: Array}>}
 */
export async function runVisualRegression(designDir) {
  const screenshotDir = path.join(designDir, 'output', 'screenshots');
  const baselineDir = path.join(designDir, 'output', 'baselines');
  const diffDir = path.join(designDir, 'output', 'diffs');

  if (!existsSync(baselineDir)) {
    // No baselines yet — save current as baseline
    await mkdir(baselineDir, { recursive: true });
    const { readdirSync } = await import('node:fs');
    const screenshots = readdirSync(screenshotDir).filter(f => f.endsWith('.png'));

    for (const file of screenshots) {
      await copyFile(
        path.join(screenshotDir, file),
        path.join(baselineDir, file)
      );
    }

    return {
      pass: true,
      comparisons: [],
      note: 'No baselines existed. Current screenshots saved as baselines.',
    };
  }

  const { readdirSync } = await import('node:fs');
  const screenshots = readdirSync(screenshotDir).filter(f => f.endsWith('.png'));
  const comparisons = [];

  for (const file of screenshots) {
    const actualPath = path.join(screenshotDir, file);
    const baselinePath = path.join(baselineDir, file);
    const diffPath = path.join(diffDir, file);

    if (!existsSync(baselinePath)) {
      comparisons.push({ file, pass: true, note: 'No baseline — skipped' });
      continue;
    }

    const result = await compareScreenshots(actualPath, baselinePath, diffPath);
    comparisons.push({ file, ...result });
  }

  return {
    pass: comparisons.every(c => c.pass),
    comparisons,
  };
}

/**
 * Update baselines with current screenshots.
 * @param {string} designDir
 */
export async function updateBaselines(designDir) {
  const screenshotDir = path.join(designDir, 'output', 'screenshots');
  const baselineDir = path.join(designDir, 'output', 'baselines');

  await mkdir(baselineDir, { recursive: true });

  const { readdirSync } = await import('node:fs');
  const screenshots = readdirSync(screenshotDir).filter(f => f.endsWith('.png'));

  for (const file of screenshots) {
    await copyFile(
      path.join(screenshotDir, file),
      path.join(baselineDir, file)
    );
  }

  return screenshots.length;
}

function round(n, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}
