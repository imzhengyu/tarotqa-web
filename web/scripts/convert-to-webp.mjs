import sharp from 'sharp';
import { readdir, stat } from 'node:fs/promises';
import { join, dirname, basename, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(SCRIPT_DIR, '..', 'public', 'tarot-images');

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else yield p;
  }
}

let converted = 0;
let savedBytes = 0;

for await (const file of walk(ROOT)) {
  if (extname(file).toLowerCase() !== '.jpg') continue;
  const out = join(dirname(file), `${basename(file, '.jpg')}.webp`);
  const before = (await stat(file)).size;
  await sharp(file).webp({ quality: 60, effort: 6 }).toFile(out);
  const after = (await stat(out)).size;
  converted += 1;
  savedBytes += before - after;
  process.stdout.write(`OK ${basename(file)}  ${(before / 1024).toFixed(1)}KB -> ${(after / 1024).toFixed(1)}KB\n`);
}

console.log(`\nConverted ${converted} images, saved ${(savedBytes / 1024 / 1024).toFixed(2)}MB`);
