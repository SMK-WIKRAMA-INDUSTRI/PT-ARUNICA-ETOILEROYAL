// Development launcher: starts the DeepSeek proxy and Vite together so the
// concierge never shows "Failed to fetch" just because you forgot one terminal.
//
//   npm run dev              # proxy (8787) + Vite (5173)
//   npm run dev -- --port 4173
//
// If something is already listening on the proxy port, that process is reused.

import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PROXY_PORT = Number(process.env.PORT) || 8787;

function portInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(true));
    server.once('listening', () => server.close(() => resolve(false)));
    server.listen(port, '127.0.0.1');
  });
}

const children = [];
function start(label, args) {
  const child = spawn(process.execPath, args, {
    cwd: ROOT,
    stdio: 'inherit',
    env: process.env
  });
  child.on('error', (error) => console.error(`[${label}] failed to start:`, error.message));
  children.push(child);
  return child;
}

if (await portInUse(PROXY_PORT)) {
  console.log(`[dev] reusing existing proxy on port ${PROXY_PORT}`);
} else {
  console.log(`[dev] starting DeepSeek proxy on port ${PROXY_PORT}`);
  start('proxy', [path.join(ROOT, 'server.mjs')]);
}

console.log('[dev] starting Vite');
start('vite', [path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js'), ...process.argv.slice(2)]);

let stopping = false;
const stop = (signal) => {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (!child.killed) child.kill(signal);
  }
  process.exit(0);
};
process.on('SIGINT', () => stop('SIGINT'));
process.on('SIGTERM', () => stop('SIGTERM'));
