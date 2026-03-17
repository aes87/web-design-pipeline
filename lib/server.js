import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.glsl': 'text/plain',
};

/**
 * Start a static file server for a design directory.
 * @param {string} rootDir - directory to serve
 * @param {number} [port=3333] - port number
 * @returns {{ server: import('http').Server, url: string, close: () => void }}
 */
export function startServer(rootDir, port = 3333) {
  const server = createServer(async (req, res) => {
    const urlPath = req.url.split('?')[0];
    const filePath = join(rootDir, urlPath === '/' ? 'index.html' : urlPath);

    try {
      const data = await readFile(filePath);
      const ext = extname(filePath);
      res.writeHead(200, {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Cache-Control': 'no-cache',
      });
      res.end(data);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
    }
  });

  server.listen(port);
  return {
    server,
    url: `http://localhost:${port}`,
    close: () => server.close(),
  };
}

// CLI: node lib/server.js <design-dir> [port]
if (import.meta.url === `file://${process.argv[1]}`) {
  const dir = process.argv[2];
  const port = parseInt(process.argv[3] || '3333', 10);

  if (!dir) {
    console.error('Usage: node lib/server.js <design-dir> [port]');
    process.exit(1);
  }

  const { url } = startServer(dir, port);
  console.error(`Serving ${dir} at ${url}`);
}
