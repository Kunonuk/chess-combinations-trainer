import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import App from '../../src/App.tsx';
import { bookPackFixture } from '../fixtures/bookPack.ts';
import { PROGRESS_KEY } from '../../src/services/progress.ts';

beforeEach(() => localStorage.clear());

describe('complete bundled book', () => {
  it('opens the book by default with every original exercise available', () => {
    render(<App />);
    expect(screen.getByLabelText('Collection', { exact: true })).toHaveValue('ivashchenko-1a');
    expect(
      within(screen.getByLabelText('All 719 book exercises'))
        .getAllByRole('option')
        .filter((option) => !(option as HTMLOptionElement).disabled),
    ).toHaveLength(719);
    expect(screen.getByRole('progressbar', { name: 'Collection progress' })).toHaveAttribute(
      'max',
      '718',
    );
    fireEvent.change(screen.getByLabelText('Exercise', { exact: true }), {
      target: { value: '719' },
    });
    expect(screen.getByRole('button', { name: 'Next exercise' })).toBeDisabled();
    expect(screen.getByTestId('square-g4')).toHaveAttribute('aria-label', 'g4 White queen');
  });

  it('does not let an old partial cached import hide the complete collection or study history', () => {
    localStorage.setItem('combinations.private-pack.v1', JSON.stringify(bookPackFixture()));
    localStorage.setItem(
      PROGRESS_KEY,
      JSON.stringify({
        version: 1,
        collections: {
          'ivashchenko-1a': { '1': { attempts: 1, completed: true, firstTry: true } },
        },
        location: { collection: 'ivashchenko-1a', puzzle: 719 },
      }),
    );
    render(<App />);
    expect(screen.getByLabelText('Exercise', { exact: true })).toHaveValue('719');
    expect(screen.getByRole('progressbar', { name: 'Collection progress' })).toHaveAttribute(
      'value',
      '1',
    );
    expect(screen.getByRole('progressbar', { name: 'Collection progress' })).toHaveAttribute(
      'max',
      '718',
    );
    expect(screen.getByTestId('square-g4')).toHaveAttribute('aria-label', 'g4 White queen');
  });
});
