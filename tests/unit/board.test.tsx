import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChessBoard } from '../../src/components/ChessBoard';
import { firePointer, mockBoardBounds } from '../support/chessboard';

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const BLACK_TURN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1';

afterEach(cleanup);

function square(name: string) {
  return screen.getByTestId(`square-${name}`);
}

describe('ChessBoard', () => {
  it('exposes every square and its actual piece through the accessible grid', () => {
    render(<ChessBoard fen={START} onMove={vi.fn()} />);
    const grid = screen.getByRole('grid', { name: 'Chessboard' });
    expect(within(grid).getAllByRole('gridcell')).toHaveLength(64);
    expect(within(grid).getByRole('gridcell', { name: 'e2 White pawn' })).toBeVisible();
    expect(within(grid).getByRole('gridcell', { name: 'e8 Black king' })).toBeVisible();
    expect(within(grid).getByRole('gridcell', { name: 'e4 empty' })).toBeVisible();
    expect(square('a8')).toHaveAttribute('data-square', 'a8');
  });

  it('requests move from two taps and leaves legality to the parent', async () => {
    const user = userEvent.setup();
    const moves = vi.fn();
    render(<ChessBoard fen={START} onMove={moves} />);
    await user.click(square('e2'));
    expect(square('e2')).toHaveAttribute('aria-selected', 'true');
    await user.click(square('e5'));
    expect(moves).toHaveBeenCalledExactlyOnceWith('e2', 'e5');
    expect(square('e2')).toHaveAttribute('aria-selected', 'false');
  });

  it('reselects another own piece before requesting its destination', async () => {
    const user = userEvent.setup();
    const moves = vi.fn();
    render(<ChessBoard fen={START} onMove={moves} />);
    await user.click(square('e2'));
    await user.click(square('g1'));
    expect(moves).not.toHaveBeenCalled();
    expect(square('e2')).toHaveAttribute('aria-selected', 'false');
    expect(square('g1')).toHaveAttribute('aria-selected', 'true');
    await user.click(square('f3'));
    expect(moves).toHaveBeenCalledExactlyOnceWith('g1', 'f3');
  });

  it('cannot select opponent piece or an empty square as a move origin', async () => {
    const user = userEvent.setup();
    const moves = vi.fn();
    render(<ChessBoard fen={BLACK_TURN} onMove={moves} />);
    await user.click(square('e2'));
    await user.click(square('e4'));
    expect(moves).not.toHaveBeenCalled();
    expect(square('e2')).toHaveAttribute('aria-selected', 'false');
    await user.click(square('e7'));
    await user.click(square('e5'));
    expect(moves).toHaveBeenCalledExactlyOnceWith('e7', 'e5');
  });

  it('reverses square and coordinate order when viewed from Black', () => {
    render(<ChessBoard fen={START} orientation="black" onMove={vi.fn()} />);
    const cells = screen.getAllByRole('gridcell');
    expect(cells[0]).toHaveAttribute('data-square', 'h1');
    expect(cells[7]).toHaveAttribute('data-square', 'a1');
    expect(cells[63]).toHaveAttribute('data-square', 'a8');
    const coordinates = screen.getAllByTestId('file-coordinates');
    expect(coordinates).toHaveLength(2);
    for (const edge of coordinates) expect(edge.textContent).toBe('hgfedcba');
    const ranks = screen.getAllByTestId('rank-coordinates');
    expect(ranks).toHaveLength(2);
    for (const edge of ranks) expect(edge.textContent).toBe('12345678');
  });

  it('keeps disabled board readable while preventing every move', async () => {
    const user = userEvent.setup();
    const moves = vi.fn();
    render(<ChessBoard fen={START} onMove={moves} disabled />);
    await user.click(square('e2'));
    await user.click(square('e4'));
    expect(moves).not.toHaveBeenCalled();
    expect(square('e2')).toHaveAttribute('aria-disabled', 'true');
    expect(square('e2')).toHaveAttribute('aria-selected', 'false');
  });

  it('supports roving arrows, native keyboard selection, and Escape cancellation', async () => {
    const user = userEvent.setup();
    const moves = vi.fn();
    render(<ChessBoard fen={START} onMove={moves} />);
    square('e2').focus();
    await user.keyboard('{Enter}{ArrowUp}');
    expect(square('e3')).toHaveFocus();
    await user.keyboard(' ');
    expect(moves).toHaveBeenCalledExactlyOnceWith('e2', 'e3');
    square('g1').focus();
    await user.keyboard('{Enter}{Escape}');
    expect(square('g1')).toHaveAttribute('aria-selected', 'false');
    expect(screen.getAllByRole('gridcell').filter((cell) => cell.tabIndex === 0)).toHaveLength(1);
  });

  it('moves keyboard focus visually for the Black orientation without wrapping edges', async () => {
    const user = userEvent.setup();
    render(<ChessBoard fen={START} orientation="black" onMove={vi.fn()} />);
    square('e2').focus();
    await user.keyboard('{ArrowUp}{ArrowRight}');
    expect(square('d1')).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(square('d1')).toHaveFocus();
  });

  it('clears stale selection when the position changes', async () => {
    const user = userEvent.setup();
    const moves = vi.fn();
    const view = render(<ChessBoard fen={START} onMove={moves} />);
    await user.click(square('e2'));
    view.rerender(<ChessBoard fen={BLACK_TURN} onMove={moves} />);
    expect(square('e2')).toHaveAttribute('aria-selected', 'false');
    await user.click(square('e4'));
    expect(moves).not.toHaveBeenCalled();
  });

  it('never highlights an answer until an explicit hint or last move is supplied', () => {
    const view = render(<ChessBoard fen={START} onMove={vi.fn()} />);
    expect(document.querySelectorAll('[data-hint="true"]')).toHaveLength(0);
    expect(document.querySelectorAll('[data-last-move="true"]')).toHaveLength(0);
    view.rerender(
      <ChessBoard
        fen={START}
        onMove={vi.fn()}
        hintSquare="g1"
        lastMove={{ from: 'e7', to: 'e5' }}
      />,
    );
    expect(square('g1')).toHaveAttribute('data-hint', 'true');
    expect(square('e7')).toHaveAttribute('data-last-move', 'true');
    expect(square('e5')).toHaveAttribute('data-last-move', 'true');
    expect(document.querySelectorAll('[data-hint="true"]')).toHaveLength(1);
    expect(document.querySelectorAll('[data-last-move="true"]')).toHaveLength(2);
  });

  it('maps desktop pointer drag to squares and suppresses its following click', () => {
    const moves = vi.fn();
    render(<ChessBoard fen={START} onMove={moves} />);
    const board = mockBoardBounds();
    firePointer(square('e2'), 'pointerdown', 450, 650);
    firePointer(board, 'pointermove', 450, 450);
    firePointer(board, 'pointerup', 450, 450);
    expect(moves).toHaveBeenCalledExactlyOnceWith('e2', 'e4');
    fireEvent.click(square('e2'), { detail: 1 });
    expect(square('e2')).toHaveAttribute('aria-selected', 'false');
    expect(moves).toHaveBeenCalledTimes(1);
    firePointer(square('d2'), 'pointerdown', 350, 650);
    firePointer(square('d2'), 'pointerup', 350, 650);
    fireEvent.click(square('d2'), { detail: 1 });
    expect(square('d2')).toHaveAttribute('aria-selected', 'true');
  });

  it('maps pointer destinations on an offset, resized board viewed from Black', () => {
    const moves = vi.fn();
    render(<ChessBoard fen={BLACK_TURN} orientation="black" onMove={moves} />);
    const board = mockBoardBounds({ left: 120, top: 80, width: 400, height: 400 });
    firePointer(square('d7'), 'pointerdown', 345, 405);
    firePointer(board, 'pointermove', 345, 305);
    firePointer(board, 'pointerup', 345, 305);
    expect(moves).toHaveBeenCalledExactlyOnceWith('d7', 'd5');
  });

  it('keeps small pointer motion and touch interaction available for tap selection', () => {
    const moves = vi.fn();
    render(<ChessBoard fen={START} onMove={moves} />);
    const board = mockBoardBounds();
    firePointer(square('e2'), 'pointerdown', 450, 650);
    firePointer(board, 'pointermove', 452, 652);
    firePointer(board, 'pointerup', 452, 652);
    expect(moves).not.toHaveBeenCalled();
    fireEvent.click(square('e2'), { detail: 1 });
    expect(square('e2')).toHaveAttribute('aria-selected', 'true');
    firePointer(square('e4'), 'pointerdown', 450, 450, { pointerType: 'touch' });
    firePointer(board, 'pointermove', 450, 250, { pointerType: 'touch' });
    firePointer(board, 'pointerup', 450, 250, { pointerType: 'touch' });
    expect(moves).not.toHaveBeenCalled();
    fireEvent.click(square('e4'), { detail: 1 });
    expect(moves).toHaveBeenCalledExactlyOnceWith('e2', 'e4');
  });

  it('cancels drag released outside the board', () => {
    const moves = vi.fn();
    render(<ChessBoard fen={START} onMove={moves} />);
    const board = mockBoardBounds();
    firePointer(square('e2'), 'pointerdown', 450, 650);
    firePointer(board, 'pointermove', 900, 450);
    expect(square('e2')).toHaveAttribute('aria-selected', 'true');
    firePointer(board, 'pointerup', 900, 450);
    expect(moves).not.toHaveBeenCalled();
    expect(square('e2')).toHaveAttribute('aria-selected', 'false');
  });

  it('cancels interrupted pointer drag', () => {
    const moves = vi.fn();
    render(<ChessBoard fen={START} onMove={moves} />);
    const board = mockBoardBounds();
    firePointer(square('e2'), 'pointerdown', 450, 650);
    firePointer(board, 'pointermove', 450, 450);
    expect(square('e2')).toHaveAttribute('aria-selected', 'true');
    firePointer(board, 'pointercancel', 450, 450);
    firePointer(board, 'pointerup', 450, 450);
    expect(moves).not.toHaveBeenCalled();
    expect(square('e2')).toHaveAttribute('aria-selected', 'false');
  });

  it('cannot submit drag after its position changes or the board becomes disabled', () => {
    const moves = vi.fn();
    const view = render(<ChessBoard fen={START} onMove={moves} />);
    const board = mockBoardBounds();
    firePointer(square('e2'), 'pointerdown', 450, 650);
    firePointer(board, 'pointermove', 450, 450);
    view.rerender(<ChessBoard fen={BLACK_TURN} onMove={moves} />);
    firePointer(board, 'pointerup', 450, 450);
    expect(moves).not.toHaveBeenCalled();
    firePointer(square('e7'), 'pointerdown', 450, 150);
    firePointer(board, 'pointermove', 450, 350);
    view.rerender(<ChessBoard fen={BLACK_TURN} onMove={moves} disabled />);
    firePointer(board, 'pointerup', 450, 350);
    expect(moves).not.toHaveBeenCalled();
  });
});
