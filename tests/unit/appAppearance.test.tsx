import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../src/App.tsx';
import { readSavedProgress } from '../support/savedProgress.ts';

vi.mock('../../src/data/catalogue.ts', async () => {
  const { practiceOnlyCatalogue } = await import('../fixtures/catalogue.ts');
  return practiceOnlyCatalogue();
});

beforeEach(() => localStorage.clear());

describe('appearance preferences', () => {
  const APPEARANCE_KEY = 'combinations.appearance.v1';

  it('retains appearance and board theme after reopening', async () => {
    const user = userEvent.setup();
    const first = render(<App />);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Board theme' }), 'walnut');
    await user.click(screen.getByRole('button', { name: 'Use dark appearance' }));
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

  it('saves changes independently and can persist a return to both defaults', async () => {
    const user = userEvent.setup();
    localStorage.setItem(APPEARANCE_KEY, '{"dark":true,"boardTheme":"walnut"}');
    const first = render(<App />);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Board theme' }), 'forest');
    first.unmount();
    const second = render(<App />);
    expect(screen.getByRole('combobox', { name: 'Board theme' })).toHaveValue('forest');
    expect(screen.getByRole('button', { name: 'Use light appearance' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Use light appearance' }));
    second.unmount();
    render(<App />);
    expect(screen.getByRole('button', { name: 'Use dark appearance' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Board theme' })).toHaveValue('forest');
  });

  it('keeps appearance controls usable when browser storage cannot be read', async () => {
    const user = userEvent.setup();
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Storage access denied', 'SecurityError');
    });
    render(<App />);
    expect(screen.getByRole('button', { name: 'Use dark appearance' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Board theme' })).toHaveValue('forest');
    await user.click(screen.getByRole('button', { name: 'Use dark appearance' }));
    await user.selectOptions(screen.getByRole('combobox', { name: 'Board theme' }), 'walnut');
    await user.click(screen.getByRole('button', { name: 'Next exercise' }));
    expect(screen.getByLabelText('Exercise', { exact: true })).toHaveValue('2');
    expect(screen.getByRole('button', { name: 'Use light appearance' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Board theme' })).toHaveValue('walnut');
  });

  it('keeps loaded settings and session controls usable when storage writes fail', async () => {
    const user = userEvent.setup();
    localStorage.setItem(APPEARANCE_KEY, '{"dark":true,"boardTheme":"walnut"}');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage is full', 'QuotaExceededError');
    });
    render(<App />);
    expect(screen.getByRole('button', { name: 'Use light appearance' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Board theme' })).toHaveValue('walnut');
    await user.click(screen.getByRole('button', { name: 'Use light appearance' }));
    await user.selectOptions(screen.getByRole('combobox', { name: 'Board theme' }), 'forest');
    await user.click(screen.getByRole('button', { name: 'Next exercise' }));
    expect(screen.getByLabelText('Exercise', { exact: true })).toHaveValue('2');
    expect(screen.getByRole('button', { name: 'Use dark appearance' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Board theme' })).toHaveValue('forest');
  });

  it('preserves appearance after confirming a study progress reset and reopening', async () => {
    const user = userEvent.setup();
    localStorage.setItem(APPEARANCE_KEY, '{"dark":true,"boardTheme":"walnut"}');
    const first = render(<App />);
    await user.click(screen.getByRole('button', { name: 'Hint' }));
    await user.click(screen.getByRole('button', { name: 'Reset study progress' }));
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Reset progress' }),
    );
    expect(readSavedProgress().collections).toEqual({});
    first.unmount();
    render(<App />);
    expect(screen.getByRole('button', { name: 'Use light appearance' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Board theme' })).toHaveValue('walnut');
    expect(screen.queryByText(/Hint 1:/)).not.toBeInTheDocument();
  });
});
