import { readFileSync } from 'node:fs';

export function validateSemgrepReport(contents: string): void {
  const report: unknown = JSON.parse(contents);
  if (
    typeof report !== 'object' ||
    report === null ||
    !('results' in report) ||
    !Array.isArray(report.results) ||
    !('errors' in report) ||
    !Array.isArray(report.errors)
  ) {
    throw new Error('Semgrep did not produce a complete JSON report.');
  }

  if (report.results.length > 0) {
    throw new Error(`Semgrep reported ${report.results.length} security finding(s).`);
  }

  const fatalErrors = report.errors.filter(
    (error: unknown) =>
      typeof error !== 'object' || error === null || !('level' in error) || error.level !== 'warn',
  );
  if (fatalErrors.length > 0) {
    throw new Error(
      `Semgrep reported ${fatalErrors.length} scanner error(s); see scan output above.`,
    );
  }
}

if (import.meta.main) {
  try {
    const reportPath = process.argv[2];
    if (!reportPath) throw new Error('A Semgrep JSON report path is required.');
    validateSemgrepReport(readFileSync(reportPath, 'utf8'));
  } catch (error) {
    console.error('Semgrep check failed:', error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
