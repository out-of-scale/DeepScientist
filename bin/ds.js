#!/usr/bin/env node
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const srcPath = path.join(repoRoot, 'src');
const candidates = process.platform === 'win32' ? ['python', 'py'] : ['python3', 'python'];

function runPython(binary) {
  const env = {
    ...process.env,
    PYTHONPATH: process.env.PYTHONPATH ? `${srcPath}${path.delimiter}${process.env.PYTHONPATH}` : srcPath,
  };
  return spawnSync(binary, ['-m', 'deepscientist.cli', ...process.argv.slice(2)], {
    cwd: repoRoot,
    stdio: 'inherit',
    env,
  });
}

let lastError = null;
for (const binary of candidates) {
  const result = runPython(binary);
  if (!result.error) {
    process.exit(result.status ?? 0);
  }
  lastError = result.error;
}

console.error('DeepScientist could not find a working Python 3 interpreter.');
if (lastError) {
  console.error(String(lastError));
}
process.exit(1);
