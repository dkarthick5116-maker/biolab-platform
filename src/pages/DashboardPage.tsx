import React from 'react';
import { 
  Dna, 
  Binary, 
  Atom, 
  FileCode, 
  ArrowRight, 
  Clock, 
  Play
} from 'lucide-react';
import { ActivePage, LabActivity, MetricSummary } from '../types';
import { MetricCard } from '../components/common/MetricCard';

interface DashboardPageProps {
  onNavigate: (page: ActivePage) => void;
}

const SAMPLE_METRICS: MetricSummary[] = [
  { title: 'Registered Sequences', value: '0', delta: 'Phase 2 Cloud Store', status: 'neutral' },
  { title: 'Local Analyses Executed', value: '0', delta: 'Awaiting Pipeline', status: 'accent' },
  { title: 'NCBI Records Cached', value: '0', delta: 'E-Utils Standby', status: 'neutral' },
  { title: 'Computational Cluster', value: 'Ready', delta: 'FastAPI Backend P3', status: 'positive' }
];

const INITIAL_LOGS: LabActivity[] = [
  { id: '1', type: 'DNA', title: 'System Environment Verified (React 18 + Vite)', timestamp: 'Just now', status: 'Completed' },
  { id: '2', type: 'BLAST', title: 'NCBI BLAST Service Endpoint Schema Registered', timestamp: '2 hours ago', status: 'Completed' }
];

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  return (
    <div style={{ padding: '24px 20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <div
        className="glass-panel"
        style={{
          padding: '24px',
          marginBottom: '24px',
          background: 'linear-gradient(135deg, rgba(14, 22, 46, 0.9) 0%, rgba(22, 34, 68, 0.6) 100%)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}
      >
        <div>
          <div className="badge badge-cyan" style={{ marginBottom: '8px' }}>
            LABORATORY SESSION ACTIVE
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '6px' }}>Scientific Control Center</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Workspace operating in Phase 1 client shell mode. Select an analytical station to view interface architecture.
          </p>
        </div>

        <button
          className="btn-primary"
          onClick={() => onNavigate('dna')}
          style={{ fontSize: '0.85rem' }}
        >
          <Play size={16} /> Launch DNA Station
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '28px'
        }}
      >
        {SAMPLE_METRICS.map((metric, idx) => (
          <MetricCard key={idx} {...metric} />
        ))}
      </div>

      <h3 style={{ fontSize: '1.15rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Dna size={18} color="var(--accent-cyan)" /> Core Analytical Workstations
      </h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}
      >
        <div
          className="glass-panel"
          style={{ padding: '20px', cursor: 'pointer' }}
          onClick={() => onNavigate('dna')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--accent-cyan-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)' }}>
              <Dna size={22} />
            </div>
            <span className="badge badge-cyan">Phase 3</span>
          </div>
          <h4 style={{ fontSize: '1rem', marginBottom: '6px' }}>DNA Sequence Suite</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
            GC/AT stoichiometry, complementation, reverse complementation, and codon transcription.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: '600' }}>
            Open Station <ArrowRight size={14} />
          </div>
        </div>

        <div
          className="glass-panel"
          style={{ padding: '20px', cursor: 'pointer' }}
          onClick={() => onNavigate('rna')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--accent-violet-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C084FC' }}>
              <Binary size={22} />
            </div>
            <span className="badge badge-violet">Phase 3</span>
          </div>
          <h4 style={{ fontSize: '1rem', marginBottom: '6px' }}>RNA Sequence Suite</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
            Uracil-based stoichiometry, reading frame detection, and 6-frame in silico translation.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: '600' }}>
            Open Station <ArrowRight size={14} />
          </div>
        </div>

        <div
          className="glass-panel"
          style={{ padding: '20px', cursor: 'pointer' }}
          onClick={() => onNavigate('protein')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-emerald)' }}>
              <Atom size={22} />
            </div>
            <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)' }}>Phase 4</span>
          </div>
          <h4 style={{ fontSize: '1rem', marginBottom: '6px' }}>Protein Physicochemistry</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
            Isoelectric point titration, molar weight, hydropathy index, and residue breakdown.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: '600' }}>
            Open Station <ArrowRight size={14} />
          </div>
        </div>

        <div
          className="glass-panel"
          style={{ padding: '20px', cursor: 'pointer' }}
          onClick={() => onNavigate('fasta')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-amber)' }}>
              <FileCode size={22} />
            </div>
            <span className="badge badge-amber">Phase 4</span>
          </div>
          <h4 style={{ fontSize: '1rem', marginBottom: '6px' }}>Multi-FASTA Processor</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
            Batch parsing, header decomposition, validation checks, and structured CSV exporting.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: '600' }}>
            Open Station <ArrowRight size={14} />
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '22px' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={16} /> Audit & Activity Log
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {INITIAL_LOGS.map((log) => (
            <div
              key={log.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: 'var(--bg-surface-elevated)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>{log.type}</span>
                <span style={{ color: 'var(--text-main)' }}>{log.title}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>{log.timestamp}</span>
                <span style={{ color: 'var(--accent-emerald)', fontSize: '0.75rem', fontWeight: '600' }}>{log.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
