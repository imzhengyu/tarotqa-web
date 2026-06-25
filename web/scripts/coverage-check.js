/**
 * Coverage Check Script
 * Runs tests with coverage and compares actual coverage against thresholds.
 */
import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = resolve(__dirname, '..');
const SUMMARY_PATH = resolve(WEB_ROOT, 'coverage', 'coverage-summary.json');

const THRESHOLDS = {
  statements: 80,
  branches: 75,
  functions: 80,
  lines: 80
};

function runTests() {
  console.log('Running tests with coverage...\n');
  execSync('pnpm vitest run --coverage', {
    encoding: 'utf-8',
    cwd: WEB_ROOT,
    stdio: 'inherit'
  });
}

function readSummary() {
  if (!existsSync(SUMMARY_PATH)) {
    throw new Error('Coverage summary not found: ' + SUMMARY_PATH);
  }
  const raw = readFileSync(SUMMARY_PATH, 'utf-8');
  return JSON.parse(raw);
}

function checkThresholds(summary) {
  const total = summary.total;
  if (!total) {
    throw new Error('Missing "total" key in coverage summary');
  }

  let allPass = true;

  console.log('Coverage Check Results');
  console.log('======================');

  for (const [metric, threshold] of Object.entries(THRESHOLDS)) {
    const data = total[metric];
    if (!data || typeof data.pct !== 'number') {
      console.error(`  ${metric}: missing data in summary`);
      allPass = false;
      continue;
    }

    const actual = data.pct;
    const status = actual >= threshold ? 'PASS' : 'FAIL';
    if (status === 'FAIL') {
      allPass = false;
    }

    console.log(`  ${metric}: ${actual}% / ${threshold}% — ${status}`);
  }

  console.log('');
  return allPass;
}

function main() {
  try {
    runTests();
    const summary = readSummary();
    const allPass = checkThresholds(summary);

    if (allPass) {
      console.log('All coverage thresholds met.');
      process.exit(0);
    } else {
      console.error('Some coverage thresholds were not met.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Coverage check failed:', error.message);
    process.exit(1);
  }
}

main();
