import { useEffect, useState } from 'react';

const APPEARANCE_KEY = 'combinations.appearance.v1';
export type BoardTheme = 'forest' | 'walnut';
export interface Appearance {
  dark: boolean;
  boardTheme: BoardTheme;
}

function readAppearance(): Appearance {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(APPEARANCE_KEY) ?? 'null');
    const object = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
    return {
      dark: object.dark === true,
      boardTheme: object.boardTheme === 'walnut' ? 'walnut' : 'forest',
    };
  } catch {
    return { dark: false, boardTheme: 'forest' };
  }
}

export function useAppearance() {
  const [appearance, setAppearance] = useState(readAppearance);
  useEffect(() => {
    try {
      window.localStorage.setItem(APPEARANCE_KEY, JSON.stringify(appearance));
    } catch {
      // Appearance remains usable when persistence is unavailable.
    }
  }, [appearance]);

  function setBoardTheme(boardTheme: BoardTheme): void {
    setAppearance((previous) => ({ ...previous, boardTheme }));
  }

  function toggleAppearance(): void {
    setAppearance((previous) => ({ ...previous, dark: !previous.dark }));
  }

  return { ...appearance, setBoardTheme, toggleAppearance };
}
