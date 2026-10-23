import type { Appearance, BoardTheme } from '../hooks/useAppearance.ts';

interface AppearanceControlsProps extends Appearance {
  onThemeChange: (theme: BoardTheme) => void;
  onToggle: () => void;
}

export function AppearanceControls({
  dark,
  boardTheme,
  onThemeChange,
  onToggle,
}: AppearanceControlsProps) {
  return (
    <header className="site-header">
      <a className="wordmark" href="#main">
        <span aria-hidden="true">♞</span> COMBINATIONS <small>THE STUDY ROOM</small>
      </a>
      <div className="header-actions">
        <label className="theme-label">
          Board{' '}
          <select
            data-testid="board-theme-select"
            aria-label="Board theme"
            value={boardTheme}
            onChange={(e) => onThemeChange(e.target.value === 'walnut' ? 'walnut' : 'forest')}
          >
            <option value="forest">Forest</option>
            <option value="walnut">Walnut</option>
          </select>
        </label>
        <button
          data-testid="appearance-toggle"
          className="icon-button"
          onClick={onToggle}
          aria-label={dark ? 'Use light appearance' : 'Use dark appearance'}
        >
          {dark ? '☀' : '☾'}
        </button>
      </div>
    </header>
  );
}
