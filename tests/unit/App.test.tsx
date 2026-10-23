import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import App from '../../src/App.tsx';
import { PROGRESS_KEY } from '../../src/services/progress.ts';
import { bookPackFixture } from '../fixtures/bookPack.ts';
import { moveInStudy, uploadStudyJSON } from '../support/app.ts';

vi.mock('../../src/data/catalogue.ts', async () => {
  const actual = await vi.importActual<typeof import('../../src/data/catalogue.ts')>(
    '../../src/data/catalogue.ts',
  );
  return { ...actual, bundledPacks: [actual.practicePack] };
});

const IMPORT_KEY = 'combinations.private-pack.v1';
beforeEach(() => localStorage.clear());

describe('trainer study flow', () => {
  it('clearly labels separate practice and preserves unavailable book exercises', () => {
    render(<App />);
    expect(screen.getByText('Separate Lichess practice')).toBeInTheDocument();
    expect(
      screen
        .getByRole('combobox', { name: 'All 719 book exercises' })
        .querySelectorAll('option[disabled]'),
    ).toHaveLength(720);
    expect(screen.getByRole('button', { name: 'Previous exercise' })).toBeDisabled();
  });

  it('persists hint history across retry and requires explicit reset confirmation', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Hint' }));
    fireEvent.click(screen.getByRole('button', { name: 'Retry exercise' }));
    expect(
      JSON.parse(localStorage.getItem(PROGRESS_KEY)!).collections['lichess-practice']['1'],
    ).toMatchObject({ hints: 1, retries: 1 });
    fireEvent.click(screen.getByRole('button', { name: 'Reset study progress' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Keep progress' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      JSON.parse(localStorage.getItem(PROGRESS_KEY)!).collections['lichess-practice']['1'].hints,
    ).toBe(1);
  });

  it('restores the last exercise and completion totals when reopened', () => {
    localStorage.setItem(
      PROGRESS_KEY,
      JSON.stringify({
        version: 1,
        collections: {
          'lichess-practice': { '1': { attempts: 2, completed: true, firstTry: true } },
        },
        location: { collection: 'lichess-practice', puzzle: 2 },
      }),
    );
    render(<App />);
    expect(screen.getByLabelText('Exercise', { exact: true })).toHaveValue('2');
    expect(screen.getByTestId('square-e8')).toHaveAttribute('aria-label', 'e8 Black rook');
    expect(screen.getByRole('progressbar', { name: 'Collection progress' })).toHaveAttribute(
      'value',
      '1',
    );
  });

  it.each([
    { collection: 'removed-collection', puzzle: 1 },
    { collection: 'lichess-practice', puzzle: 999 },
  ])('falls back to an available exercise for a stale saved location: %j', (location) => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ version: 1, collections: {}, location }));
    render(<App />);
    expect(screen.getByLabelText('Collection', { exact: true })).toHaveValue('lichess-practice');
    expect(screen.getByLabelText('Exercise', { exact: true })).toHaveValue('1');
    expect(screen.getByTestId('square-a2')).toHaveAttribute('aria-label', 'a2 White bishop');
  });

  it('navigates forwards, backwards and directly while enforcing boundaries', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Next exercise' }));
    expect(screen.getByLabelText('Exercise', { exact: true })).toHaveValue('2');
    expect(screen.getByTestId('square-e8')).toHaveAttribute('aria-label', 'e8 Black rook');
    fireEvent.click(screen.getByRole('button', { name: 'Previous exercise' }));
    expect(screen.getByLabelText('Exercise', { exact: true })).toHaveValue('1');
    expect(screen.getByRole('button', { name: 'Previous exercise' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Exercise', { exact: true }), {
      target: { value: '4' },
    });
    expect(screen.getByRole('button', { name: 'Next exercise' })).toBeDisabled();
    expect(screen.getByTestId('square-e1')).toHaveAttribute('aria-label', 'e1 White bishop');
  });

  it('chapter navigation loads its first exercise with fresh assistance state', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Hint' }));
    fireEvent.change(screen.getByLabelText('Stage & chapter', { exact: true }), {
      target: { value: '2|Discovered attack' },
    });
    expect(screen.getByLabelText('Exercise', { exact: true })).toHaveValue('4');
    expect(screen.getByTestId('square-e1')).toHaveAttribute('aria-label', 'e1 White bishop');
    expect(screen.queryByText(/Hint 1:/)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Stage & chapter', { exact: true }), {
      target: { value: '1|Mate in 2' },
    });
    expect(screen.getByLabelText('Exercise', { exact: true })).toHaveValue('1');
  });

  it('confirmed reset clears active hints and solution playback as well as saved progress', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Hint' }));
    fireEvent.click(screen.getByRole('button', { name: 'Show solution' }));
    fireEvent.click(screen.getByRole('button', { name: /Play next move/ }));
    expect(screen.getByTestId('square-e6')).toHaveAttribute('aria-label', 'e6 White bishop');
    fireEvent.click(screen.getByRole('button', { name: 'Reset study progress' }));
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Reset progress' }),
    );
    expect(screen.getByTestId('square-a2')).toHaveAttribute('aria-label', 'a2 White bishop');
    expect(screen.queryByText(/Hint 1:/)).not.toBeInTheDocument();
    expect(screen.queryByText('Study the solution')).not.toBeInTheDocument();
    expect(screen.getByText('In progress', { exact: true })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(PROGRESS_KEY)!).collections).toEqual({});
  });
});

describe('private pack imports', () => {
  it('imports verified synthetic positions while preserving original numbering and gaps', async () => {
    render(<App />);
    uploadStudyJSON(JSON.stringify(bookPackFixture()));
    await screen.findByText(/Imported 2 verified book exercises/);
    expect(screen.getByLabelText('Collection', { exact: true })).toHaveValue('ivashchenko-1a');
    expect(screen.getByTestId('square-d8')).toHaveAttribute('aria-label', 'd8 Black queen');
    const exercise = screen.getByLabelText('Exercise', { exact: true });
    expect(within(exercise).getByRole('option', { name: '#2 · unavailable' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Next exercise' }));
    expect(exercise).toHaveValue('3');
    expect(screen.getByTestId('square-f7')).toHaveAttribute('aria-label', 'f7 White pawn');
    expect(screen.getByRole('button', { name: 'Next exercise' })).toBeDisabled();
  });

  it.each(['identity', 'hash', 'total', 'empty'] as const)(
    'rejects an invalid edition pack: %s',
    async (field) => {
      const pack = bookPackFixture();
      if (field === 'identity') pack.collection.id = 'lichess-practice';
      if (field === 'hash') pack.collection.sourceHash = '0'.repeat(64);
      if (field === 'total') pack.collection.total = 718;
      if (field === 'empty') pack.puzzles = [];
      render(<App />);
      uploadStudyJSON(JSON.stringify(pack));
      await screen.findByText(/Pack was not imported:/);
      expect(screen.getByLabelText('Collection', { exact: true })).toHaveValue('lichess-practice');
      expect(localStorage.getItem(IMPORT_KEY)).toBeNull();
    },
  );

  it('rejects malformed JSON without replacing the current collection', async () => {
    render(<App />);
    uploadStudyJSON('{');
    await screen.findByText(/Pack was not imported:/);
    expect(screen.getByTestId('square-a2')).toHaveAttribute('aria-label', 'a2 White bishop');
    expect(localStorage.getItem(IMPORT_KEY)).toBeNull();
  });

  it.each(['identity', 'hash'] as const)(
    'applies the edition gate to cached imports: %s',
    (field) => {
      const pack = bookPackFixture();
      if (field === 'identity') pack.collection.id = 'lichess-practice';
      else pack.collection.sourceHash = '0'.repeat(64);
      localStorage.setItem(IMPORT_KEY, JSON.stringify(pack));
      render(<App />);
      expect(screen.getByText('Separate Lichess practice')).toBeInTheDocument();
      expect(screen.queryByText('Private book collection')).not.toBeInTheDocument();
      expect(screen.getByTestId('square-a2')).toHaveAttribute('aria-label', 'a2 White bishop');
    },
  );

  it('restores a cached verified pack at its last available exercise', () => {
    localStorage.setItem(IMPORT_KEY, JSON.stringify(bookPackFixture()));
    localStorage.setItem(
      PROGRESS_KEY,
      JSON.stringify({
        version: 1,
        collections: {},
        location: { collection: 'ivashchenko-1a', puzzle: 3 },
      }),
    );
    render(<App />);
    expect(screen.getByLabelText('Collection', { exact: true })).toHaveValue('ivashchenko-1a');
    expect(screen.getByLabelText('Exercise', { exact: true })).toHaveValue('3');
    expect(screen.getByTestId('square-f7')).toHaveAttribute('aria-label', 'f7 White pawn');
  });

  it('keeps completion separate when the same exercise number appears in two collections', async () => {
    render(<App />);
    uploadStudyJSON(JSON.stringify(bookPackFixture()));
    await screen.findByText(/Imported 2 verified book exercises/);
    moveInStudy('d8', 'h4');
    expect(screen.getByRole('progressbar', { name: 'Collection progress' })).toHaveAttribute(
      'value',
      '1',
    );
    fireEvent.change(screen.getByLabelText('Collection', { exact: true }), {
      target: { value: 'lichess-practice' },
    });
    expect(screen.getByRole('progressbar', { name: 'Collection progress' })).toHaveAttribute(
      'value',
      '0',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Hint' }));
    fireEvent.change(screen.getByLabelText('Collection', { exact: true }), {
      target: { value: 'ivashchenko-1a' },
    });
    expect(screen.getByRole('progressbar', { name: 'Collection progress' })).toHaveAttribute(
      'value',
      '1',
    );
    expect(screen.getByText('✓ Solved first try', { exact: true })).toBeInTheDocument();
  });

  it('re-importing a corrected exercise restarts its active board and assistance', async () => {
    render(<App />);
    uploadStudyJSON(JSON.stringify(bookPackFixture()));
    await screen.findByText(/Imported 2 verified book exercises/);
    fireEvent.click(screen.getByRole('button', { name: 'Hint' }));
    const replacement = bookPackFixture();
    replacement.puzzles = [
      {
        ...replacement.puzzles[1]!,
        id: 1,
        source: { ...replacement.puzzles[1]!.source, exercise: 1 },
      },
    ];
    uploadStudyJSON(JSON.stringify(replacement));
    await waitFor(() =>
      expect(screen.getByTestId('square-f7')).toHaveAttribute('aria-label', 'f7 White pawn'),
    );
    expect(screen.queryByText(/Hint 1:/)).not.toBeInTheDocument();
  });
});

describe('appearance preferences', () => {
  const APPEARANCE_KEY = 'combinations.appearance.v1';

  it('retains appearance and board theme after reopening', () => {
    const first = render(<App />);
    fireEvent.change(screen.getByRole('combobox', { name: 'Board theme' }), {
      target: { value: 'walnut' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Use dark appearance' }));
    first.unmount();
    render(<App />);
    expect(screen.getByRole('combobox', { name: 'Board theme' })).toHaveValue('walnut');
    expect(screen.getByRole('button', { name: 'Use light appearance' })).toBeInTheDocument();
  });

  it('starts with light appearance and the forest board when nothing is saved', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: 'Use dark appearance' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Board theme' })).toHaveValue('forest');
  });

  it.each([
    { dark: false, boardTheme: 'forest', button: 'Use dark appearance' },
    { dark: false, boardTheme: 'walnut', button: 'Use dark appearance' },
    { dark: true, boardTheme: 'forest', button: 'Use light appearance' },
    { dark: true, boardTheme: 'walnut', button: 'Use light appearance' },
  ])('restores saved appearance: $dark / $boardTheme', ({ dark, boardTheme, button }) => {
    localStorage.setItem(APPEARANCE_KEY, JSON.stringify({ dark, boardTheme }));
    render(<App />);
    expect(screen.getByRole('button', { name: button })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Board theme' })).toHaveValue(boardTheme);
  });

  it.each([
    { raw: '{', boardTheme: 'forest', button: 'Use dark appearance' },
    { raw: 'null', boardTheme: 'forest', button: 'Use dark appearance' },
    { raw: '[]', boardTheme: 'forest', button: 'Use dark appearance' },
    { raw: '"walnut"', boardTheme: 'forest', button: 'Use dark appearance' },
    {
      raw: '{"dark":"true","boardTheme":7}',
      boardTheme: 'forest',
      button: 'Use dark appearance',
    },
    { raw: '{"dark":true}', boardTheme: 'forest', button: 'Use light appearance' },
    { raw: '{"boardTheme":"walnut"}', boardTheme: 'walnut', button: 'Use dark appearance' },
    {
      raw: '{"dark":true,"boardTheme":"unknown"}',
      boardTheme: 'forest',
      button: 'Use light appearance',
    },
  ])('safely restores usable settings from $raw', ({ raw, boardTheme, button }) => {
    localStorage.setItem(APPEARANCE_KEY, raw);
    render(<App />);
    expect(screen.getByRole('button', { name: button })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Board theme' })).toHaveValue(boardTheme);
    expect(screen.getByRole('grid', { name: 'Chessboard' })).toBeInTheDocument();
  });

  it('saves changes independently and can persist a return to both defaults', () => {
    localStorage.setItem(APPEARANCE_KEY, '{"dark":true,"boardTheme":"walnut"}');
    const first = render(<App />);
    fireEvent.change(screen.getByRole('combobox', { name: 'Board theme' }), {
      target: { value: 'forest' },
    });
    first.unmount();
    const second = render(<App />);
    expect(screen.getByRole('combobox', { name: 'Board theme' })).toHaveValue('forest');
    expect(screen.getByRole('button', { name: 'Use light appearance' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Use light appearance' }));
    second.unmount();
    render(<App />);
    expect(screen.getByRole('button', { name: 'Use dark appearance' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Board theme' })).toHaveValue('forest');
  });

  it('keeps appearance controls usable when browser storage cannot be read', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Storage access denied', 'SecurityError');
    });
    render(<App />);
    expect(screen.getByRole('button', { name: 'Use dark appearance' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Board theme' })).toHaveValue('forest');
    fireEvent.click(screen.getByRole('button', { name: 'Use dark appearance' }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Board theme' }), {
      target: { value: 'walnut' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Next exercise' }));
    expect(screen.getByLabelText('Exercise', { exact: true })).toHaveValue('2');
    expect(screen.getByRole('button', { name: 'Use light appearance' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Board theme' })).toHaveValue('walnut');
  });

  it('keeps loaded settings and session controls usable when storage writes fail', () => {
    localStorage.setItem(APPEARANCE_KEY, '{"dark":true,"boardTheme":"walnut"}');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage is full', 'QuotaExceededError');
    });
    render(<App />);
    expect(screen.getByRole('button', { name: 'Use light appearance' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Board theme' })).toHaveValue('walnut');
    fireEvent.click(screen.getByRole('button', { name: 'Use light appearance' }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Board theme' }), {
      target: { value: 'forest' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Next exercise' }));
    expect(screen.getByLabelText('Exercise', { exact: true })).toHaveValue('2');
    expect(screen.getByRole('button', { name: 'Use dark appearance' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Board theme' })).toHaveValue('forest');
  });

  it('preserves appearance after confirming a study progress reset and reopening', () => {
    localStorage.setItem(APPEARANCE_KEY, '{"dark":true,"boardTheme":"walnut"}');
    const first = render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Hint' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset study progress' }));
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Reset progress' }),
    );
    expect(JSON.parse(localStorage.getItem(PROGRESS_KEY)!).collections).toEqual({});
    first.unmount();
    render(<App />);
    expect(screen.getByRole('button', { name: 'Use light appearance' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Board theme' })).toHaveValue('walnut');
    expect(screen.queryByText(/Hint 1:/)).not.toBeInTheDocument();
  });
});
