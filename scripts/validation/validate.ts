import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { auditPack } from './auditPack.ts';

const args = process.argv.slice(2);
const requested = args.filter((arg) => arg !== '--complete');
const files = requested.length ? requested : ['src/data/practice.json', 'src/data/book.json'];
if (!requested.length && existsSync('src/data/private'))
  for (const name of readdirSync('src/data/private'))
    if (name.endsWith('.json')) files.push(join('src/data/private', name));
for (const file of files) {
  const result = auditPack(
    JSON.parse(readFileSync(file, 'utf8')),
    args.includes('--complete') || file === 'src/data/book.json',
  );
  console.log(
    `${file}: ${result.available} available, ${result.scored} scored, ${result.studies} source studies; ${result.solutions} solution/playback lines checked`,
  );
}
