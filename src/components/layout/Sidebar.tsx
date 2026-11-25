import React from 'react';
import { 
  LayoutDashboard, 
  Dna, 
  Binary, 
  Atom, 
  FileCode, 
  GitCompare, 
  Database, 
  Search, 
  BarChart2, 
  FolderKanban, 
  GraduationCap, 
  User, 
  ShieldCheck 
} from 'lucide-react';
import { ActivePage, NavItem } from '../../types';

interface SidebarProps {
  currentPage: ActivePage;
  onNavigate: (page: ActivePage) => void;
  isOpen: boolean;
  onClose: () => void;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Lab Dashboard', iconName: 'Dashboard', phase: 1 },
  { id: 'dna', label: 'DNA Analyzer', iconName: 'Dna', badge: 'P3', phase: 3 },
  { id: 'rna', label: 'RNA Analyzer', iconName: 'Rna', badge: 'P3', phase: 3 },
  { id: 'protein', label: 'Protein Analyzer', iconName: 'Protein', badge: 'P4', phase: 4 },
  { id: 'fasta', label: 'FASTA Engine', iconName: 'Fasta', badge: 'P4', phase: 4 },
  { id: 'alignment', label: 'Sequence Align', iconName: 'Align', badge: 'P6', phase: 6 },
  { id: 'database', label: 'NCBI Explorer', iconName: 'Db', badge: 'P5', phase: 5 },
  { id: 'blast', label: 'BLAST Center', iconName: 'Blast', badge: 'P6', phase: 6 },
  { id: 'visualization', label: 'Bio Viz Charts', iconName: 'Viz', badge: 'P4', phase: 4 },
  { id: 'workspace', label: 'Lab Projects', iconName: 'Workspace', badge: 'P6', phase: 6 },
  { id: 'learning', label: 'Learning Center', iconName: 'Edu', badge: 'P7', phase: 7 },
  { id: 'profile', label: 'Researcher ID', iconName: 'Profile', badge: 'P2', phase: 2 },
  { id: 'admin', label: 'Lab Operations', iconName: 'Admin', badge: 'P7', phase: 7 }
];

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, isOpen, onClose }) => {
  const getIcon = (name: string) => {
    switch (name) {
      case 'Dashboard': return <LayoutDashboard size={18} />;
      case 'Dna': return <Dna size={18} />;
      case 'Rna': return <Binary size={18} />;
      case 'Protein': return <Atom size={18} />;
      case 'Fasta': return <FileCode size={18} />;
      case 'Align': return <GitCompare size={18} />;
      case 'Db': return <Database size={18} />;
      case 'Blast': return <Search size={18} />;
      case 'Viz': return <BarChart2 size={18} />;
      case 'Workspace': return <FolderKanban size={18} />;
      case 'Edu': return <GraduationCap size={18} />;
      case 'Profile': return <User size={18} />;
      case 'Admin': return <ShieldCheck size={18} />;
      default: return <LayoutDashboard size={18} />;
    }
  };

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(7, 11, 25, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 48
          }}
        />
      )}

      <aside
        className="glass-panel"
        style={{
          position: 'fixed',
          top: 'var(--navbar-height)',
          bottom: 0,
          left: 0,
          width: 'var(--sidebar-width)',
          zIndex: 49,
          borderRadius: 0,
          borderTop: 'none',
          borderBottom: 'none',
          borderLeft: 'none',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform var(--transition-smooth)',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          overflowY: 'auto'
        }}
      >
        <div style={{ padding: '16px 12px', flex: 1 }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 8px 12px 8px' }}>
            Laboratory Workstations
          </p>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {NAV_ITEMS.map((item) => {
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    if (window.innerWidth < 1024) onClose();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid',
                    borderColor: isActive ? 'var(--border-glow)' : 'transparent',
                    background: isActive ? 'var(--bg-surface-elevated)' : 'transparent',
                    color: isActive ? 'var(--accent-cyan)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: isActive ? '600' : '400',
                    transition: 'all var(--transition-fast)',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {getIcon(item.iconName)}
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div style={{ padding: '16px', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-emerald)', boxShadow: '0 0 8px var(--accent-emerald)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Scientific Core: Standby (Phase 1)</span>
          </div>
        </div>
      </aside>
    </>
  );
};
