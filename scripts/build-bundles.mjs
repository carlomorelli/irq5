import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { zipSync } from 'fflate';

const root = fileURLToPath(new URL('..', import.meta.url));
const gamesRoot = join(root, 'games-src');
const outRoot = join(root, 'public', 'games');
const templatePath = join(root, 'scripts', 'dosbox.conf');

const dosboxTemplate = readFileSync(templatePath, 'utf8').trimEnd();
const encoder = new TextEncoder();

mkdirSync(outRoot, { recursive: true });

if (!existsSync(gamesRoot)) {
  console.warn('[irq5] games-src/ not found; no bundles generated.');
  process.exit(0);
}

const folders = readdirSync(gamesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

let built = 0;

for (const slug of folders) {
  const dir = join(gamesRoot, slug);
  const autoexecPath = join(dir, 'autoexec.txt');

  if (!existsSync(autoexecPath)) {
    console.warn(`[irq5] ${slug}: missing autoexec.txt, skipped.`);
    continue;
  }

  const requiredPath = join(dir, 'required-files.txt');
  if (existsSync(requiredPath)) {
    const required = readFileSync(requiredPath, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'));

    const missing = required.filter((entry) => {
      const alternatives = entry
        .split('|')
        .map((name) => name.trim())
        .filter(Boolean);
      return (
        alternatives.length === 0 ||
        !alternatives.some((name) => existsSync(join(dir, name)))
      );
    });

    if (missing.length > 0) {
      console.warn(`[irq5] ${slug}: missing ${missing.join(', ')}, skipped.`);
      continue;
    }
  }

  const autoexec = readFileSync(autoexecPath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (autoexec.length === 0) {
    console.warn(`[irq5] ${slug}: autoexec.txt is empty, skipped.`);
    continue;
  }

  const files = {};
  collectFiles(dir, dir, files);

  delete files['autoexec.txt'];
  delete files['required-files.txt'];

  const conf = [
    dosboxTemplate,
    '',
    '[autoexec]',
    'echo off',
    'mount c .',
    'c:',
    ...autoexec,
    '',
  ].join('\n');

  files['.jsdos/dosbox.conf'] = encoder.encode(conf);

  const zipped = zipSync(files, { level: 9 });
  const outPath = join(outRoot, `${slug}.jsdos`);
  const gameFileCount = Object.keys(files).length - 1;

  writeFileSync(outPath, zipped);

  const kib = (zipped.length / 1024).toFixed(1);
  console.log(
    `[irq5] ${slug}: ${gameFileCount} game file(s) -> ${relative(root, outPath)} (${kib} KiB)`
  );

  if (zipped.length > 25 * 1024 * 1024) {
    console.warn(
      `[irq5] ${slug}: bundle exceeds Cloudflare Pages' 25 MiB per-file limit.`
    );
  }

  built += 1;
}

console.log(`[irq5] ${built} bundle(s) generated.`);

function collectFiles(baseDir, currentDir, output) {
  for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) {
      continue;
    }

    const fullPath = join(currentDir, entry.name);

    if (entry.isDirectory()) {
      collectFiles(baseDir, fullPath, output);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const relPath = relative(baseDir, fullPath).split(sep).join('/');
    output[relPath] = new Uint8Array(readFileSync(fullPath));
  }
}
