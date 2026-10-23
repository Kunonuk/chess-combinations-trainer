import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../src/App.tsx';
import { PROGRESS_KEY } from '../../src/services/progress.ts';
import { bookPackFixture } from '../fixtures/bookPack.ts';
import { analysisFixture, fixturePuzzle } from '../fixtures/puzzles.ts';
import { moveInStudy } from '../support/app.ts';

vi.mock('../../src/data/catalogue.ts', async () => {
  const { practiceOnlyCatalogue } = await import('../fixtures/catalogue.ts');
  return practiceOnlyCatalogue();
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

  it('navigates forwards, backwards and directly while enforcing boundaries', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Next exercise' }));
    expect(screen.getByLabelText('Exercise', { exact: true })).toHaveValue('2');
    expect(screen.getByTestId('square-e8')).toHaveAttribute('aria-label', 'e8 Black rook');
    await user.click(screen.getByRole('button', { name: 'Previous exercise' }));
    expect(screen.getByLabelText('Exercise', { exact: true })).toHaveValue('1');
    expect(screen.getByRole('button', { name: 'Previous exercise' })).toBeDisabled();
    await user.selectOptions(screen.getByLabelText('Exercise', { exact: true }), '4');
    expect(screen.getByRole('button', { name: 'Next exercise' })).toBeDisabled();
    expect(screen.getByTestId('square-e1')).toHaveAttribute('aria-label', 'e1 White bishop');
  });

  it('chapter navigation loads its first exercise with fresh assistance state', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Hint' }));
    await user.selectOptions(
      screen.getByLabelText('Stage & chapter', { exact: true }),
      '2|Discovered attack',
    );
    expect(screen.getByLabelText('Exercise', { exact: true })).toHaveValue('4');
    expect(screen.getByTestId('square-e1')).toHaveAttribute('aria-label', 'e1 White bishop');
    expect(screen.queryByText(/Hint 1:/)).not.toBeInTheDocument();
    await user.selectOptions(
      screen.getByLabelText('Stage & chapter', { exact: true }),
      '1|Mate in 2',
    );
    expect(screen.getByLabelText('Exercise', { exact: true })).toHaveValue('1');
  });
});

it('keeps a source-error study available and excludes it from scored totals', async () => {
  const user = userEvent.setup();
  const pack = bookPackFixture();
  const study = analysisFixture();
  study.source = { ...fixturePuzzle(pack).source, exercise: 2 };
  study.stage = fixturePuzzle(pack).stage;
  study.chapter = fixturePuzzle(pack).chapter;
  pack.puzzles.push(study);
  localStorage.setItem(IMPORT_KEY, JSON.stringify(pack));
  localStorage.setItem(
    PROGRESS_KEY,
    JSON.stringify({
      version: 1,
      collections: { 'ivashchenko-1a': { '2': { completed: true, firstTry: true } } },
      location: { collection: 'ivashchenko-1a', puzzle: 2 },
    }),
  );
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Study the source error' })).toBeInTheDocument();
  expect(screen.getByRole('note', { name: 'Source note' })).toHaveTextContent(
    'synthetic source instruction',
  );
  expect(screen.getByRole('progressbar', { name: 'Collection progress' })).toHaveAttribute(
    'max',
    '2',
  );
  expect(screen.getByRole('progressbar', { name: 'Collection progress' })).toHaveAttribute(
    'value',
    '0',
  );
  const options = within(screen.getByLabelText('Exercise', { exact: true }));
  expect(options.getByRole('option', { name: '#2 · source note' })).toBeInTheDocument();
  expect(screen.getByLabelText('Exercise', { exact: true })).toHaveValue('2');
  expect(screen.getByRole('button', { name: 'Hint' })).toBeDisabled();
  expect(screen.getByText('Source note · not scored')).toBeInTheDocument();
  const next = screen.getByRole('button', { name: /Play next move/ });
  await user.click(next);
  await user.click(next);
  expect(next).toBeDisabled();
  expect(screen.getByTestId('square-e5')).toHaveAttribute('aria-label', 'e5 Black pawn');
  await user.click(screen.getByRole('button', { name: 'Retry exercise' }));
  expect(screen.getByRole('button', { name: 'Hint' })).toBeDisabled();
  expect(screen.getByTestId('square-e2')).toHaveAttribute('aria-label', 'e2 White pawn');
});

it('numbers a Black-start history using the FEN fullmove number', async () => {
  const user = userEvent.setup();
  localStorage.setItem(IMPORT_KEY, JSON.stringify(bookPackFixture()));
  render(<App />);
  await moveInStudy(user, 'd8', 'h4');
  expect(
    within(screen.getByLabelText('Move history')).getByText('2... Qh4#', { exact: true }),
  ).toBeInTheDocument();
});

it('increments White-start history numbers from the source FEN', async () => {
  const user = userEvent.setup();
  render(<App />);
  await moveInStudy(user, 'a2', 'e6');
  await moveInStudy(user, 'f7', 'f8');
  const history = within(screen.getByLabelText('Move history'));
  expect(history.getByText('18. Be6+', { exact: true })).toBeInTheDocument();
  expect(history.getByText('Kd8', { exact: true })).toBeInTheDocument();
  expect(history.getByText('19. Qf8#', { exact: true })).toBeInTheDocument();
});
