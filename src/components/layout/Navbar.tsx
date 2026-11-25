import React from 'react';
import { Dna, Menu, X, ArrowRight, Home } from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';
import { ActivePage } from '../../types';

interface NavbarProps {
  currentPage: ActivePage;
  onNavigate: (page: ActivePage) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  isSidebarOpen,
  onToggleSidebar
}) => {
  return (
    <header
      className="glass-panel"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        height: 'var(--navbar-height)',
        borderTop: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        borderRadius: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {currentPage !== 'landing' && (
          <button
            onClick={onToggleSidebar}
            aria-label="Toggle Laboratory Menu"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-main)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        )}

        <div
          onClick={() => onNavigate('landing')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        >
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-violet) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#070B19'
            }}
          >
            <Dna size={22} strokeWidth={2.5} />
          </div>
          <div>
            <span style={{ fontWeight: '700', fontSize: '1.15rem', letterSpacing: '-0.02em' }}>
              Bio<span style={{ color: 'var(--accent-cyan)' }}>Lab</span>
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <ThemeToggle />

        {currentPage === 'landing' ? (
          <button
            className="btn-primary"
            onClick={() => onNavigate('dashboard')}
            style={{ fontSize: '0.85rem', padding: '8px 14px' }}
          >
            Launch Lab <ArrowRight size={16} />
          </button>
        ) : (
          <button
            className="btn-secondary"
            onClick={() => onNavigate('landing')}
            style={{ fontSize: '0.85rem', padding: '8px 14px' }}
          >
            <Home size={16} />
          </button>
        )}
      </div>
    </header>
  );
};
