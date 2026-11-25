import React from 'react';
import { Construction, ArrowLeft, ShieldAlert } from 'lucide-react';
import { ActivePage } from '../types';

interface PlaceholderModuleProps {
  pageId: ActivePage;
  onNavigate: (page: ActivePage) => void;
}

const MODULE_METADATA: Record<string, { title: string; phase: number; description: string }> = {
  dna: { title: 'DNA Sequence Analyzer', phase: 3, description: 'Nucleotide frequency analysis, GC stoichiometry, reverse-complements, and Biopython transcription.' },
  rna: { title: 'RNA Sequence Analyzer', phase: 3, description: 'Uracil parsing, open reading frame detection, and 6-frame translation into amino acid sequences.' },
  protein: { title: 'Protein Analyzer', phase: 4, description: 'Molecular weight estimation, theoretical pI, hydropathy plots, and amino acid composition.' },
  fasta: { title: 'FASTA File Analyzer', phase: 4, description: 'Multi-record parser, format validator, header metadata extractor, and CSV data exporter.' },
  alignment: { title: 'Sequence Comparison & Alignment', phase: 6, description: 'Pairwise alignment algorithms (Needleman-Wunsch & Smith-Waterman) with mismatch matrices.' },
  database: { title: 'NCBI Biological Database Explorer', phase: 5, description: 'Direct GenBank nucleotide and protein searches via NCBI Entrez E-Utilities API with accession auditing.' },
  blast: { title: 'BLAST Research Center', phase: 6, description: 'Asynchronous BLASTN & BLASTP submission queue with real-time status and verifiable E-values.' },
  visualization: { title: 'Scientific Data Visualization', phase: 4, description: 'High-resolution Chart.js diagrams for GC skew, length histograms, and sequence alignments.' },
  workspace: { title: 'Research Workspace', phase: 6, description: 'Encrypted user project store, sequence metadata notebooks, and persistent research histories.' },
  learning: { title: 'Bioinformatics Learning Center', phase: 7, description: 'Interactive computational biology curriculum, practice quizzes, and scientific glossaries.' },
  profile: { title: 'Researcher Profile', phase: 2, description: 'Firebase-authenticated identity, project permissions, and personal scientific activity audit.' },
  admin: { title: 'Administrative Control Center', phase: 7, description: 'Platform health monitoring, compute rate-limiting logs, and audit trail review.' }
};

export const PlaceholderModule: React.FC<PlaceholderModuleProps> = ({ pageId, onNavigate }) => {
  const meta = MODULE_METADATA[pageId] || {
    title: 'Workstation Module',
    phase: 2,
    description: 'This analytical tool is currently under scheduled development.'
  };

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px', width: '100%' }}>
      <button
        onClick={() => onNavigate('dashboard')}
        className="btn-secondary"
        style={{ marginBottom: '20px', fontSize: '0.85rem' }}
      >
        <ArrowLeft size={16} /> Back to Lab Dashboard
      </button>

      <div className="glass-panel" style={{ padding: '36px', textAlign: 'center' }}>
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'var(--accent-cyan-glow)',
            color: 'var(--accent-cyan)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}
        >
          <Construction size={32} />
        </div>

        <div className="badge badge-violet" style={{ display: 'inline-block', marginBottom: '12px' }}>
          SCHEDULED FOR PHASE {meta.phase}
        </div>

        <h2 style={{ fontSize: '1.6rem', marginBottom: '10px' }}>{meta.title}</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '520px', margin: '0 auto 24px auto', lineHeight: 1.6 }}>
          {meta.description}
        </p>

        <div
          className="glass-panel"
          style={{
            background: 'var(--bg-surface-elevated)',
            padding: '16px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            textAlign: 'left',
            maxWidth: '540px'
          }}
        >
          <ShieldAlert size={20} color="var(--accent-amber)" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            <strong>Authenticity Guard:</strong> In accordance with BioLab scientific standards, calculations are withheld until the verified Biopython computational pipeline is connected in Phase {meta.phase}.
          </p>
        </div>
      </div>
    </div>
  );
};
