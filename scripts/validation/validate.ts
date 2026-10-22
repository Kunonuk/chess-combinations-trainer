import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { validatePack } from '../../src/services/puzzleValidation.ts';
const files = ['src/data/practice.json'];
if (existsSync('src/data/private'))
  for (const name of readdirSync('src/data/private'))
    if (name.endsWith('.json')) files.push(join('src/data/private', name));
for (const file of files) {
  const pack = validatePack(JSON.parse(readFileSync(file, 'utf8')));
  console.log(
    `${file}: ${pack.puzzles.length}/${pack.collection.total} verified playable positions (${pack.collection.license})`,
  );
}
