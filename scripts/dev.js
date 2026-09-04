#!/usr/bin/env node
/**
 * Runs the backend API (:4000) and the Expo dev server together.
 * Zero dependencies — just spawns two `npm` processes and forwards their output.
 *
 *   npm run dev
 *
 * Then press `a` in the Expo output for Android, `w` for web, or scan the QR
 * code with Expo Go on a physical device.
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const procs = [
  { name: 'api   ', color: '\x1b[36m', cwd: resolve(root, 'server'), cmd: 'npm', args: ['run', 'dev'] },
  { name: 'mobile', color: '\x1b[35m', cwd: resolve(root, 'mobile'), cmd: 'npm', args: ['run', 'start'] },
];

const children = procs.map((p) => {
  const child = spawn(p.cmd, p.args, {
    cwd: p.cwd,
    shell: process.platform === 'win32',
    stdio: ['inherit', 'pipe', 'pipe'],
  });
  const tag = `${p.color}[${p.name}]\x1b[0m `;
  const pipe = (stream, out) =>
    stream.on('data', (d) =>
      d
        .toString()
        .split('\n')
        .filter(Boolean)
        .forEach((line) => out.write(tag + line + '\n')),
    );
  pipe(child.stdout, process.stdout);
  pipe(child.stderr, process.stderr);
  child.on('exit', (code) => {
    process.stdout.write(tag + `exited with code ${code}\n`);
    shutdown();
  });
  return child;
});

function shutdown() {
  children.forEach((c) => !c.killed && c.kill('SIGINT'));
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
