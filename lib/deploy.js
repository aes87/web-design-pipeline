import { exec as execCb } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const exec = promisify(execCb);

/**
 * Deploy a design to Cloudflare Pages.
 * Requires CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID env vars.
 *
 * @param {string} designDir - path to design directory (e.g., designs/dark-portfolio)
 * @param {Object} options
 * @param {string} options.projectName - Cloudflare Pages project name
 * @param {string} [options.branch] - branch name for preview deploys (omit for production)
 * @returns {Promise<{url: string, environment: string}>}
 */
export async function deployCloudflare(designDir, options = {}) {
  const { projectName, branch } = options;

  if (!projectName) throw new Error('projectName is required');
  if (!process.env.CLOUDFLARE_API_TOKEN) {
    throw new Error('CLOUDFLARE_API_TOKEN environment variable is required');
  }
  if (!process.env.CLOUDFLARE_ACCOUNT_ID) {
    throw new Error('CLOUDFLARE_ACCOUNT_ID environment variable is required');
  }

  // Determine output directory
  const outputDir = join(designDir, 'output');
  const deployDir = existsSync(outputDir) ? outputDir : designDir;

  const branchFlag = branch ? `--branch="${branch}"` : '';

  const { stdout } = await exec(
    `npx wrangler pages deploy "${deployDir}" --project-name="${projectName}" ${branchFlag}`,
    {
      timeout: 120000,
      env: {
        ...process.env,
        CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
        CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
      },
    }
  );

  // Parse URL from wrangler output
  const urlMatch = stdout.match(/https?:\/\/[^\s]+\.pages\.dev/);
  const url = urlMatch ? urlMatch[0] : 'URL not found in output';
  const environment = branch ? 'preview' : 'production';

  return { url, environment, output: stdout };
}

/**
 * Deploy a design to GitHub Pages by copying to docs/ directory.
 * Does not push — that is the shipper agent's job.
 *
 * @param {string} designDir - path to design directory
 * @param {string} designName - design name for the URL path
 * @returns {Promise<{path: string}>}
 */
export async function deployGitHubPages(designDir, designName) {
  const docsDir = join(process.cwd(), 'docs', designName);

  await exec(`mkdir -p "${docsDir}"`);

  const outputDir = join(designDir, 'output');
  const sourceDir = existsSync(outputDir) ? outputDir : designDir;

  // Copy HTML, CSS, JS, and assets
  const filesToCopy = ['index.html', 'style.css', 'script.js', 'tokens.json'];
  for (const file of filesToCopy) {
    const src = join(sourceDir, file);
    if (existsSync(src)) {
      await exec(`cp "${src}" "${docsDir}/"`);
    }
  }

  // Copy screenshots for documentation
  const screenshotsDir = join(designDir, 'output', 'screenshots');
  if (existsSync(screenshotsDir)) {
    await exec(`mkdir -p "${docsDir}/screenshots/" && cp "${screenshotsDir}"/*.png "${docsDir}/screenshots/" 2>/dev/null || true`);
  }

  return { path: docsDir };
}
