import React from 'react';
import { 
  Dna, 
  Atom, 
  Database, 
  Search, 
  ArrowRight, 
  Activity, 
  Cpu
} from 'lucide-react';
import { ActivePage } from '../types';

interface LandingPageProps {
  onNavigate: (page: ActivePage) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div style={{ minHeight: 'calc(100vh - var(--navbar-height))', display: 'flex', flexDirection: 'column' }}>
      <section
        style={{
          position: 'relative',
          padding: '70px 20px 60px 20px',
          textAlign: 'center',
          maxWidth: '1000px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <div className="badge badge-cyan" style={{ marginBottom: '16px' }}>
          <Activity size={12} /> SCIENTIFIC-GRADE BIOINFORMATICS WORKSTATION
        </div>

        <h1
          style={{
            fontSize: 'clamp(2rem, 6vw, 3.75rem)',
            fontWeight: '800',
            lineHeight: 1.15,
            marginBottom: '20px'
          }}
        >
          Explore Biology. <br />
          <span style={{ background: 'linear-gradient(135deg, var(--accent-cyan) 0%, #A855F7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Analyze Data. Discover More.
          </span>
        </h1>

        <p
          style={{
            fontSize: 'clamp(0.95rem, 2.5vw, 1.15rem)',
            color: 'var(--text-muted)',
            maxWidth: '680px',
            marginBottom: '32px',
            lineHeight: 1.6
          }}
        >
          BioLab is an end-to-end scientific computing platform for researchers, students, and educators. Analyze nucleotide structures, parse high-throughput FASTA files, and query NCBI databases directly with verified computational rigor.
        </p>

        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="btn-primary" onClick={() => onNavigate('dashboard')} style={{ padding: '12px 24px', fontSize: '0.95rem' }}>
            Enter Laboratory Workspace <ArrowRight size={18} />
          </button>
          <button className="btn-secondary" onClick={() => onNavigate('learning')} style={{ padding: '12px 24px', fontSize: '0.95rem' }}>
            Bioinformatics Curriculum
          </button>
        </div>
      </section>

      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 20px 60px 20px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '8px' }}>Integrated Analytical Engines</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Multi-stage modular architecture built for computational accuracy and reproducible outcomes.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '20px'
          }}
        >
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ color: 'var(--accent-cyan)', marginBottom: '14px' }}>
              <Dna size={28} />
            </div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>DNA & RNA Analyzer</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Calculates exact GC/AT stoichiometric ratios, complementary strands, reading frames, and standard nucleotide frequency distribution.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ color: '#C084FC', marginBottom: '14px' }}>
              <Atom size={28} />
            </div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Protein Physicochemistry</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Derives amino acid frequency, estimates molecular mass in Daltons, calculates theoretical isoelectric point (pI), and identifies hydropathy.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ color: 'var(--accent-emerald)', marginBottom: '14px' }}>
              <Database size={28} />
            </div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>NCBI Data Pipeline</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Direct programmatic integration with NCBI Entrez E-Utilities. Retrieve GenBank sequences with validated provenance and accession auditing.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ color: 'var(--accent-amber)', marginBottom: '14px' }}>
              <Search size={28} />
            </div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>BLAST Center</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Asynchronous job scheduling for BLASTN and BLASTP. Real-time status polling with validated E-values and bit scores—never mock results.
            </p>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: '1000px', margin: '0 auto 60px auto', padding: '0 20px', width: '100%' }}>
        <div className="glass-panel glow-border" style={{ padding: '28px', borderLeft: '4px solid var(--accent-cyan)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <Cpu size={20} color="var(--accent-cyan)" />
            <h4 style={{ fontSize: '1rem', color: 'var(--text-main)' }}>Strict Computational Integrity Protocol</h4>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            BioLab operates on verified Biopython and NumPy mathematical libraries. Simulated or fabricated outputs are strictly prohibited across all analysis modules. Unconnected services explicitly declare pending asynchronous execution status.
          </p>
        </div>
      </section>
    </div>
  );
};
      
