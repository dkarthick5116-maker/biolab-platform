import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle visual theme"
      style={{
        background: 'transparent',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-sm)',
        padding: '7px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-main)',
        cursor: 'pointer',
        transition: 'border-color var(--transition-fast)'
      }}
    >
      {theme === 'dark' ? (
        <Sun size={18} style={{ color: 'var(--accent-cyan)' }} />
      ) : (
        <Moon size={18} style={{ color: 'var(--accent-violet)' }} />
      )}
    </button>
  );
};
