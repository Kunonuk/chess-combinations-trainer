import { describe, expect, it } from 'vitest';
import {
  emptyProgress,
  loadProgress,
  parseProgress,
  recordProgress,
  saveProgress,
} from '../../src/services/progress.ts';
describe('defensive progress persistence', () => {
  it('recovers safely from corrupt and unsupported storage', () => {
    expect(parseProgress('{')).toEqual(emptyProgress());
    expect(parseProgress('{"version":2}')).toEqual(emptyProgress());
    expect(
      loadProgress({
        getItem: () => {
          throw new Error('denied');
        },
      }).error,
    ).toBeTruthy();
    expect(
      saveProgress(
        {
          setItem: () => {
            throw new Error('full');
          },
        },
        emptyProgress(),
      ),
    ).toContain('could not be saved');
  });
  it('preserves attempts and mistakes across retry, without granting first try', () => {
    let p = emptyProgress();
    for (const event of ['attempt', 'mistake', 'retry', 'attempt', 'solve'] as const)
      p = recordProgress(p, 'book-one', 42, event);
    expect(p.collections['book-one']?.['42']).toMatchObject({
      attempts: 2,
      mistakes: 1,
      retries: 1,
      completed: true,
      firstTry: false,
    });
  });
  it('keeps collection identities separate and denies first try after assistance', () => {
    let p = recordProgress(emptyProgress(), 'book-one', 1, 'hint');
    p = recordProgress(p, 'book-one', 1, 'attempt');
    p = recordProgress(p, 'book-one', 1, 'solve');
    p = recordProgress(p, 'practice-one', 1, 'attempt');
    p = recordProgress(p, 'practice-one', 1, 'solve');
    expect(p.collections['book-one']?.['1']?.firstTry).toBe(false);
    expect(p.collections['practice-one']?.['1']?.firstTry).toBe(true);
  });
});

describe('progress invariants', () => {
  it.each([-1, 1.5, '3', Number.MAX_SAFE_INTEGER + 1])(
    'sanitizes invalid saved counters: %j',
    (invalid) => {
      const parsed = parseProgress(
        JSON.stringify({
          version: 1,
          collections: {
            'book-one': {
              '1': {
                attempts: invalid,
                hints: invalid,
                mistakes: invalid,
                reveals: invalid,
                retries: invalid,
                completed: 'true',
                firstTry: true,
              },
            },
          },
        }),
      );
      expect(parsed.collections['book-one']?.['1']).toEqual({
        attempts: 0,
        hints: 0,
        mistakes: 0,
        reveals: 0,
        retries: 0,
        completed: false,
        firstTry: false,
      });
    },
  );

  it('does not grant first-try status to an incomplete saved exercise', () => {
    const parsed = parseProgress(
      '{"version":1,"collections":{"book-one":{"1":{"completed":false,"firstTry":true}}}}',
    );
    expect(parsed.collections['book-one']?.['1']?.firstTry).toBe(false);
  });

  it('repeated solves preserve the original first-try result', () => {
    let progress = recordProgress(emptyProgress(), 'book-one', 1, 'attempt');
    progress = recordProgress(progress, 'book-one', 1, 'solve');
    for (const event of ['hint', 'retry', 'attempt', 'solve'] as const)
      progress = recordProgress(progress, 'book-one', 1, event);
    expect(progress.collections['book-one']?.['1']).toEqual({
      attempts: 2,
      hints: 1,
      mistakes: 0,
      reveals: 0,
      retries: 1,
      completed: true,
      firstTry: true,
    });
  });

  it('recording an event does not mutate earlier progress snapshots', () => {
    const before = recordProgress(emptyProgress(), 'book-one', 1, 'attempt');
    const after = recordProgress(before, 'book-one', 1, 'mistake');
    expect(before.collections['book-one']?.['1']?.mistakes).toBe(0);
    expect(after.collections['book-one']?.['1']?.mistakes).toBe(1);
    expect(before.collections['book-one']?.['1']?.attempts).toBe(1);
  });

  it('round-trips completion and last location through browser storage', () => {
    localStorage.clear();
    let progress = recordProgress(emptyProgress(), 'book-one', 42, 'attempt');
    progress = recordProgress(progress, 'book-one', 42, 'solve');
    progress.location = { collection: 'book-one', puzzle: 42 };
    expect(saveProgress(localStorage, progress)).toBeNull();
    const loaded = loadProgress(localStorage);
    expect(loaded.error).toBeNull();
    expect(loaded.progress.location).toEqual({ collection: 'book-one', puzzle: 42 });
    expect(loaded.progress.collections['book-one']?.['42']).toEqual({
      attempts: 1,
      hints: 0,
      mistakes: 0,
      reveals: 0,
      retries: 0,
      completed: true,
      firstTry: true,
    });
    localStorage.clear();
  });
});
