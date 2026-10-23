import { fireEvent, screen } from '@testing-library/react';
import { vi } from 'vitest';

interface PointerOptions {
  pointerType?: string;
  pointerId?: number;
  isPrimary?: boolean;
  button?: number;
}

interface BoardBounds {
  left?: number;
  top?: number;
  width?: number;
  height?: number;
}

export function firePointer(
  target: HTMLElement,
  type: string,
  x: number,
  y: number,
  { pointerType = 'mouse', pointerId = 1, isPrimary = true, button = 0 }: PointerOptions = {},
) {
  const event = new MouseEvent(type, {
    bubbles: true,
    button,
    clientX: x,
    clientY: y,
  });
  Object.defineProperties(event, {
    pointerId: { value: pointerId },
    pointerType: { value: pointerType },
    isPrimary: { value: isPrimary },
  });
  fireEvent(target, event);
}

export function mockBoardBounds({
  left = 0,
  top = 0,
  width = 800,
  height = 800,
}: BoardBounds = {}) {
  const board = screen.getByRole('grid', { name: 'Chessboard' });
  vi.spyOn(board, 'getBoundingClientRect').mockReturnValue({
    x: left,
    y: top,
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height,
    toJSON: () => ({}),
  });
  return board;
}
