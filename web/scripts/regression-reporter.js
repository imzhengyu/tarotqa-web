/**
 * Regression Reporter Script
 * Runs tests with coverage, parses JSON output, retries on failure,
 * and appends results with timestamp to regression_report.md
 */
import { execSync } from 'child_process';
import { readFileSync, appendFileSync, unlinkSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = resolve(__dirname, '..');
const REPORT_PATH = resolve(WEB_ROOT, 'regression_report.md');
const JSON_OUTPUT = resolve(__dirname, '.regression-output.json');

const MAX_RETRIES = 2;

function getTimestamp() {
  const now = new Date();
  return now.toISOString().replace('T', ' ').slice(0, 19);
}

function getGitInfo() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
    const sha = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
    return { branch, sha };
  } catch {
    return { branch: 'unknown', sha: 'unknown' };
  }
}

function runTests() {
  console.log('Running tests with coverage...');
  execSync(
    'pnpm vitest run --coverage --reporter=json --outputFile=scripts/.regression-output.json',
    {
      encoding: 'utf-8',
      cwd: WEB_ROOT,
      stdio: 'inherit'
    }
  );
}

function parseJsonResults() {
  if (!existsSync(JSON_OUTPUT)) {
    throw new Error('JSON output file not found: ' + JSON_OUTPUT);
  }

  const raw = readFileSync(JSON_OUTPUT, 'utf-8');
  const data = JSON.parse(raw);

  const numFailedTests = data.numFailedTests ?? 0;
  const numPassedTests = data.numPassedTests ?? 0;
  const numTotalTests = data.numTotalTests ?? 0;

  let coverage = null;
  if (data.coverageMap) {
    const summary = summarizeCoverage(data.coverageMap);
    coverage = summary;
  }

  return {
    passed: numPassedTests,
    failed: numFailedTests,
    total: numTotalTests,
    coverage
  };
}

function summarizeCoverage(coverageMap) {
  let statementsTotal = 0;
  let statementsCovered = 0;
  let branchesTotal = 0;
  let branchesCovered = 0;
  let functionsTotal = 0;
  let functionsCovered = 0;
  let linesTotal = 0;
  let linesCovered = 0;

  for (const filePath of Object.keys(coverageMap)) {
    const fileData = coverageMap[filePath];
    if (!fileData) continue;

    const s = fileData.statementMap;
    const statementCoverage = fileData.s;
    if (s && statementCoverage) {
      statementsTotal += Object.keys(s).length;
      statementsCovered += Object.values(statementCoverage).filter(v => v > 0).length;
    }

    const b = fileData.branchMap;
    const branchCoverage = fileData.b;
    if (b && branchCoverage) {
      for (const key of Object.keys(b)) {
        const branches = branchCoverage[key];
        if (Array.isArray(branches)) {
          branchesTotal += branches.length;
          branchesCovered += branches.filter(v => v > 0).length;
        }
      }
    }

    const f = fileData.fnMap;
    const functionCoverage = fileData.f;
    if (f && functionCoverage) {
      functionsTotal += Object.keys(f).length;
      functionsCovered += Object.values(functionCoverage).filter(v => v > 0).length;
    }

    const l = fileData.lineMap || fileData.l;
    const lineCoverage = fileData.l;
    if (l && lineCoverage) {
      linesTotal += Object.keys(l).length;
      linesCovered += Object.values(lineCoverage).filter(v => v > 0).length;
    }
  }

  function pct(covered, total) {
    if (total === 0) return 100;
    return parseFloat(((covered / total) * 100).toFixed(2));
  }

  return {
    statements: pct(statementsCovered, statementsTotal),
    branches: pct(branchesCovered, branchesTotal),
    functions: pct(functionsCovered, functionsTotal),
    lines: pct(linesCovered, linesTotal)
  };
}

function formatReport(result, gitInfo) {
  const timestamp = getTimestamp();
  const status = result.failed === 0 ? 'PASS' : 'FAIL';

  let report = `\n## Regression Test Report\n`;
  report += `**Timestamp**: ${timestamp}\n`;
  report += `**Branch**: ${gitInfo.branch} (${gitInfo.sha})\n`;
  report += `**Status**: ${status}\n\n`;

  report += `### Test Results\n`;
  report += `| Metric | Value |\n`;
  report += `|--------|-------|\n`;
  report += `| Passed | ${result.passed} |\n`;
  report += `| Failed | ${result.failed} |\n`;
  report += `| Total | ${result.total} |\n\n`;

  if (result.coverage) {
    report += `### Coverage Summary\n`;
    report += `| Metric | Coverage |\n`;
    report += `|--------|----------|\n`;
    report += `| Statements | ${result.coverage.statements}% |\n`;
    report += `| Branches | ${result.coverage.branches}% |\n`;
    report += `| Functions | ${result.coverage.functions}% |\n`;
    report += `| Lines | ${result.coverage.lines}% |\n\n`;
  }

  return report;
}

function initReport() {
  try {
    const content = readFileSync(REPORT_PATH, 'utf-8');
    if (content.includes('# Regression Report')) {
      return;
    }
  } catch {
    // File doesn't exist, create it
  }

  const header = `# Regression Report

This file tracks regression test results over time.

## Report Format
Each regression run is appended with:
- Timestamp (ISO 8601)
- Git branch and commit SHA
- Test pass/fail status
- Coverage metrics

---
`;
  appendFileSync(REPORT_PATH, header);
}

function cleanup() {
  try {
    if (existsSync(JSON_OUTPUT)) {
      unlinkSync(JSON_OUTPUT);
    }
  } catch {
    // ignore cleanup errors
  }
}

function main() {
  let lastError = null;
  let result = null;

  initReport();
  const gitInfo = getGitInfo();

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      console.log(`\nRetrying... (attempt ${attempt + 1} of ${MAX_RETRIES + 1})`);
    }

    try {
      runTests();
      result = parseJsonResults();

      if (result.failed === 0) {
        break;
      }

      console.log(`Tests failed: ${result.failed} failed, ${result.passed} passed.`);
      lastError = new Error(`Tests failed: ${result.failed} failed`);
    } catch (error) {
      lastError = error;
      console.error('Test run error:', error.message);
    }
  }

  cleanup();

  if (!result) {
    console.error('\nRegression reporter failed after all retries.');
    if (lastError) {
      console.error(lastError.message);
    }
    process.exit(1);
  }

  const report = formatReport(result, gitInfo);
  appendFileSync(REPORT_PATH, report);

  console.log(`\nReport appended to: ${REPORT_PATH}`);
  console.log(`Status: ${result.failed === 0 ? 'PASS' : 'FAIL'}`);
  console.log(`Passed: ${result.passed}/${result.total}`);
  if (result.coverage) {
    console.log(`Coverage — Statements: ${result.coverage.statements}%, Branches: ${result.coverage.branches}%, Functions: ${result.coverage.functions}%, Lines: ${result.coverage.lines}%`);
  }

  if (result.failed > 0) {
    process.exit(1);
  }

  process.exit(0);
}

main();
