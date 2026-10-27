import { describe, expect, it } from 'vitest';
import { validateSemgrepReport } from '../../scripts/security/checkSemgrep';

describe('Semgrep report validation', () => {
  it('accepts a complete scan with no findings or errors', () => {
    expect(() => validateSemgrepReport('{"results":[],"errors":[]}')).not.toThrow();
  });

  it('allows the documented partial parsing warnings', () => {
    expect(() =>
      validateSemgrepReport(
        JSON.stringify({
          results: [],
          errors: [{ level: 'warn', type: 'PartialParsing', message: 'Unsupported valid syntax' }],
        }),
      ),
    ).not.toThrow();
  });

  it('rejects a fatal scanner error even when a parsing warning follows it', () => {
    expect(() =>
      validateSemgrepReport(
        JSON.stringify({
          results: [],
          errors: [
            { level: 'error', message: 'A rule failed to run' },
            { level: 'warn', type: 'PartialParsing', message: 'Unsupported valid syntax' },
          ],
        }),
      ),
    ).toThrow();
  });

  it('rejects findings independently of the scanner exit code', () => {
    expect(() =>
      validateSemgrepReport(
        JSON.stringify({
          results: [{ check_id: 'unsafe-code', path: 'src/example.ts' }],
          errors: [],
        }),
      ),
    ).toThrow();
  });

  it.each([
    '',
    'not JSON',
    'null',
    '{}',
    '{"results":[],"errors":null}',
    '{"results":[],"errors":[null]}',
    '{"results":[],"errors":[{"level":"unknown"}]}',
  ])('rejects incomplete or unrecognized scanner output: %s', (contents) => {
    expect(() => validateSemgrepReport(contents)).toThrow();
  });
});
