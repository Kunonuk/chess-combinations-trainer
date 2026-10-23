import { StrictMode } from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../src/App.tsx';
import { emptyProgress, loadProgress, PROGRESS_KEY } from '../../src/services/progress.ts';
import { bookPackFixture } from '../fixtures/bookPack.ts';
import { moveInStudy, uploadStudyJSON } from '../support/app.ts';

beforeEach(() => localStorage.clear());

it('persists only the committed move result when StrictMode replays state updaters', async () => {
  const user = userEvent.setup();
  localStorage.setItem(
    PROGRESS_KEY,
    JSON.stringify({ ...emptyProgress(), location: { collection: 'lichess-practice', puzzle: 1 } }),
  );
  render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  const writes = vi.spyOn(Storage.prototype, 'setItem');

  await moveInStudy(user, 'f1', 'g1');

  expect(screen.getByTestId('study-feedback')).toHaveTextContent('Incorrect. Try another move.');
  expect(loadProgress(localStorage).progress.collections['lichess-practice']?.['1']).toMatchObject({
    attempts: 1,
    mistakes: 1,
    completed: false,
  });
  const progressWrites = writes.mock.calls.filter(([key]) => key === PROGRESS_KEY);
  expect(progressWrites).toHaveLength(1);
  expect(progressWrites[0]?.[1]).toBe(localStorage.getItem(PROGRESS_KEY));
});

it('keeps the active study usable when saving progress fails', async () => {
  const user = userEvent.setup();
  localStorage.setItem(
    PROGRESS_KEY,
    JSON.stringify({ ...emptyProgress(), location: { collection: 'lichess-practice', puzzle: 1 } }),
  );
  render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('Storage is full', 'QuotaExceededError');
  });

  await user.click(screen.getByTestId('show-hint'));
  expect(screen.getByTestId('import-notice')).toHaveTextContent('Progress could not be saved.');
  expect(screen.getByTestId('hint-message')).toBeVisible();
  await user.click(screen.getByTestId('next-exercise'));
  expect(screen.getByTestId('exercise-select')).toHaveValue('2');
});

it('retains the import-specific notice when both pack and progress writes fail', async () => {
  const user = userEvent.setup();
  localStorage.setItem(
    PROGRESS_KEY,
    JSON.stringify({ ...emptyProgress(), location: { collection: 'lichess-practice', puzzle: 1 } }),
  );
  render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('Storage is full', 'QuotaExceededError');
  });

  await uploadStudyJSON(user, JSON.stringify(bookPackFixture()));

  expect(
    await screen.findByText('Pack imported for this session. Browser storage could not retain it.'),
  ).toBeVisible();
  expect(screen.getByTestId('collection-select')).toHaveValue('ivashchenko-1a');
  expect(screen.getByTestId('square-d8')).toHaveAttribute('aria-label', 'd8 Black queen');
  await user.click(screen.getByRole('button', { name: 'Flip board' }));
  expect(screen.getByTestId('import-notice')).toHaveTextContent(
    'Pack imported for this session. Browser storage could not retain it.',
  );
  await user.click(screen.getByTestId('show-hint'));
  expect(screen.getByTestId('import-notice')).toHaveTextContent('Progress could not be saved.');
});
