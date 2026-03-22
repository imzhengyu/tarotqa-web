/**
 * Regression Reporter Script
 * Runs tests and appends results with timestamp to regression_report.md
 */
import { execSync } from 'child_process';
import { readFileSync, appendFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = resolve(__dirname, '..');
const REPORT_PATH = resolve(WEB_ROOT, 'regression_report.md');

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
  const output = execSync('npx vitest run --coverage', {
    encoding: 'utf-8',
    cwd: WEB_ROOT
  });
  return output;
}

function parseCoverage(output) {
  const lines = output.split('\n');
  const result = {
    passed: 0,
    failed: 0,
    total: 0,
    coverage: null,
    files: []
  };

  // Parse test results
  const testMatch = output.match(/Tests\s+.*?(\d+)\s+failed.*?(\d+)\s+passed.*?\((\d+)\)/s);
  if (testMatch) {
    result.failed = parseInt(testMatch[1]);
    result.passed = parseInt(testMatch[2]);
    result.total = parseInt(testMatch[3]);
  } else {
    const allPassMatch = output.match(/Tests\s+.*?(\d+)\s+passed.*?\((\d+)\)/s);
    if (allPassMatch) {
      result.passed = parseInt(allPassMatch[1]);
      result.total = parseInt(allPassMatch[2]);
    }
  }

  // Parse coverage
  const coverageMatch = output.match(/All files.*?(\d+\.\d+)/s);
  if (coverageMatch) {
    result.coverage = coverageMatch[1] + '%';
  }

  // Parse file coverage
  const fileLines = output.match(/components.*?\n.*?services.*?\n/gs);
  if (fileLines) {
    const fileSection = fileLines[0];
    const fileMatches = fileSection.matchAll(/^\s*(\S+\.(?:js|jsx|css))\s*\|\s*(\d+)\s*\|\s*(\d+\.\d+)/gm);
    for (const match of fileMatches) {
      result.files.push({
        name: match[1],
        coverage: match[2] + '%'
      });
    }
  }

  return result;
}

function formatReport(result, gitInfo) {
  const timestamp = getTimestamp();
  const status = result.failed === 0 ? '✅ PASS' : '❌ FAIL';

  let report = `\n## Regression Test Report\n`;
  report += `**Timestamp**: ${timestamp}\n`;
  report += `**Branch**: ${gitInfo.branch} (${gitInfo.sha})\n`;
  report += `**Status**: ${status}\n\n`;

  report += `### Test Results\n`;
  report += `| Metric | Value |\n`;
  report += `|--------|-------|\n`;
  report += `| Passed | ${result.passed} |\n`;
  report += `| Failed | ${result.failed} |\n`;
  report += `| Total | ${result.total} |\n`;
  report += `| Coverage | ${result.coverage || 'N/A'} |\n\n`;

  if (result.files.length > 0) {
    report += `### File Coverage\n`;
    report += `| File | Coverage |\n`;
    report += `|------|----------|\n`;
    for (const file of result.files) {
      report += `| ${file.name} | ${file.coverage} |\n`;
    }
    report += `\n`;
  }

  return report;
}

function initReport() {
  try {
    const content = readFileSync(REPORT_PATH, 'utf-8');
    // Report already initialized
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

function main() {
  try {
    initReport();
    const gitInfo = getGitInfo();
    const output = runTests();
    const result = parseCoverage(output);
    const report = formatReport(result, gitInfo);

    appendFileSync(REPORT_PATH, report);
    console.log(`\nReport appended to: ${REPORT_PATH}`);
    console.log(`Status: ${result.failed === 0 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Passed: ${result.passed}/${result.total}`);
    console.log(`Coverage: ${result.coverage || 'N/A'}`);

    if (result.failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Regression reporter failed:', error.message);
    process.exit(1);
  }
}

main();