#!/usr/bin/env node

import * as fs from 'fs/promises';
import * as path from 'path';

const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist', 'build']);
interface FileCounts { js: number; ts: number; }

function createProgressBar(p: number, w = 30): string {
  const filled = Math.round((w * p) / 100);
  return `[${'▓'.repeat(filled)}${'░'.repeat(w - filled)}]`;
}

async function countFiles(dir: string, counts: FileCounts): Promise<void> {
  try {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      const ext = path.extname(entry.name);
      counts.js += Number(entry.isFile() && ext === '.js');
      counts.ts += Number(entry.isFile() && ext === '.ts');
      entry.isDirectory() && !IGNORED_DIRS.has(entry.name) && await countFiles(fullPath, counts);
    }
  } catch { /* Suppress errors from inaccessible directories */ }
}

(async () => {
  console.log('🔍 Scanning for .js and .ts files...');
  const counts: FileCounts = { js: 0, ts: 0 };
  await countFiles(process.cwd(), counts);

  const total = counts.js + counts.ts;
  const percent = (counts.ts / (total || 1)) * 100;
  
  console.log(`
--- TypeScript Conversion Summary ---

📊 File Counts:
   JavaScript (.js): ${counts.js}
   TypeScript (.ts): ${counts.ts}
   --------------------
   Total Files:      ${total}

${[
  '🤷 No relevant JavaScript or TypeScript files were found.',
  `🚀 Progress:\n   ${createProgressBar(percent)} ${percent.toFixed(2)}% converted to TypeScript.`
][Number(total > 0)]}

-----------------------------------`);
})().catch(e => console.error('An unexpected error occurred:', e));