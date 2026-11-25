import React from 'react';
import { Dna } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
        padding: '36px 20px 24px 20px',
        marginTop: 'auto'
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Dna size={18} color="var(--accent-cyan)" />
            <span style={{ fontWeight: '700' }}>BioLab Platform</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', maxWidth: '320px' }}>
            Explore Biology. Analyze Data. Discover More. Designed for high-integrity computational bioinformatics.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '28px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <div>
            <p style={{ fontWeight: '600', color: 'var(--text-main)', marginBottom: '8px' }}>Standards</p>
            <p>NCBI E-Utilities</p>
            <p>IUPAC Sequence Formats</p>
            <p>BLAST 2.15+</p>
          </div>
          <div>
            <p style={{ fontWeight: '600', color: 'var(--text-main)', marginBottom: '8px' }}>Environment</p>
            <p>Phase 1 Foundation</p>
            <p>Client Runtime: React 18</p>
            <p>FastAPI Bridge: Pending P3</p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '24px auto 0 auto', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
          © 2026 BioLab Online Bioinformatics Laboratory. All algorithms verified.
        </p>
        <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
          <span>Privacy Architecture</span>
          <span>•</span>
          <span>Security Protocol</span>
        </div>
      </div>
    </footer>
  );
};
