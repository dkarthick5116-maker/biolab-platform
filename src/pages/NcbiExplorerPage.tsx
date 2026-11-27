import React, { useState } from 'react';
import { ActivePage } from '../types';
import { exportAsFasta, exportAsJson } from '../services/exportService';
import { 
  ArrowLeft, 
  Database, 
  Search, 
  Download, 
  FileDown, 
  AlertCircle, 
  ArrowRight, 
  Copy, 
  CheckCircle2 
} from 'lucide-react';

interface NcbiExplorerPageProps {
  onNavigate: (page: ActivePage) => void;
  onSendToAnalyzer?: (target: 'dna' | 'rna' | 'protein', seq: string) => void;
}

interface NcbiResult {
  id: string;
  description: string;
  database: 'nucleotide' | 'protein';
  length: number;
  type: string;
  sequence: string;
}

const PRESETS = [
  { label: 'Human HBB (mRNA)', db: 'nucleotide', id: 'NM_000518.5' },
  { label: 'Human Insulin (Protein)', db: 'protein', id: 'NP_000198.1' },
  { label: 'SARS-CoV-2 Spike (Protein)', db: 'protein', id: 'YP_009724390.1' },
  { label: 'E. coli lacZ (DNA)', db: 'nucleotide', id: 'J01636.1' }
];

export const NcbiExplorerPage: React.FC<NcbiExplorerPageProps> = ({ onNavigate, onSendToAnalyzer }) => {
  const [database, setDatabase] = useState<'nucleotide' | 'protein'>('nucleotide');
  const [searchTerm, setSearchTerm] = useState('NM_000518.5');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NcbiResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleFetch = async (db = database, term = searchTerm) => {
    if (!term.trim() || loading) return;

    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/ncbi/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ db, id: term.trim() })
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`API error (${response.status}). Check Vercel logs.`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || `NCBI query failed (${response.status})`);
      }

      setResult(data.data);
    } catch (err: any) {
      setError(err.message || 'Error communicating with NCBI Entrez API.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopySequence = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.sequence);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRouteToModule = () => {
    if (!result) return;
    if (result.type === 'Protein') {
      if (onSendToAnalyzer) onSendToAnalyzer('protein', result.sequence);
      onNavigate('protein');
    } else if (result.type === 'RNA') {
      if (onSendToAnalyzer) onSendToAnalyzer('rna', result.sequence);
      onNavigate('rna');
    } else {
      if (onSendToAnalyzer) onSendToAnalyzer('dna', result.sequence);
      onNavigate('dna');
    }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '20px auto', padding: '0 16px', width: '100%' }}>
      <button
        type="button"
        onClick={() => onNavigate('dashboard')}
        className="btn-secondary"
        style={{ marginBottom: '16px', fontSize: '0.85rem' }}
      >
        <ArrowLeft size={16} /> Back to Lab Dashboard
      </button>

      {/* Header Panel */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-blue, #3b82f6) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#070B19'
            }}
          >
            <Database size={26} strokeWidth={2.2} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>NCBI Database Explorer</h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Direct GenBank / GenPept retrieval via Entrez API.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--accent-rose)',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '20px'
          }}
        >
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Query Formulation Panel */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
              Target NCBI Database
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setDatabase('nucleotide')}
                className={database === 'nucleotide' ? 'btn-primary' : 'btn-secondary'}
                style={{ fontSize: '0.85rem' }}
              >
                Nucleotide (DNA/RNA)
              </button>
              <button
                type="button"
                onClick={() => setDatabase('protein')}
                className={database === 'protein' ? 'btn-primary' : 'btn-secondary'}
                style={{ fontSize: '0.85rem' }}
              >
                Protein (GenPept)
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Accession ID or Identifier
            </label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="e.g. NM_000518.5 or NP_000198.1"
                style={{
                  flex: 1,
                  minWidth: '220px',
                  padding: '10px 14px',
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-main)',
                  outline: 'none'
                }}
              />
              <button
                type="button"
                className="btn-primary"
                disabled={loading || !searchTerm.trim()}
                onClick={() => handleFetch()}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Search size={16} /> {loading ? 'Fetching Entrez...' : 'Fetch Record'}
              </button>
            </div>
          </div>

          {/* Preset Buttons */}
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: '6px' }}>
              Quick Presets:
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setDatabase(p.db as any);
                    setSearchTerm(p.id);
                    handleFetch(p.db as any, p.id);
                  }}
                  style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Result Display */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            className="glass-panel"
            style={{
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Accession Retrieved Successfully
              </span>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                NCBI Entrez verification verified.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={handleRouteToModule}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '6px 12px' }}
              >
                Launch in {result.type} Analyzer <ArrowRight size={14} />
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={() =>
                  exportAsFasta({
                    module: result.type as any,
                    sequence: result.sequence,
                    length: result.length,
                    gc_content: 0,
                    at_or_au_content: 0,
                    counts: {},
                    reverse_complement: 'N/A',
                    derived_sequence: result.id
                  })
                }
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '6px 12px' }}
              >
                <Download size={14} /> FASTA
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={() =>
                  exportAsJson({
                    module: result.type as any,
                    sequence: result.sequence,
                    length: result.length,
                    gc_content: 0,
                    at_or_au_content: 0,
                    counts: {},
                    reverse_complement: 'N/A',
                    derived_sequence: result.description
                  })
                }
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '6px 12px' }}
              >
                <FileDown size={14} /> JSON
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
            <div className="glass-panel" style={{ padding: '16px', background: 'var(--bg-surface-elevated)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>Accession ID</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>
                {result.id}
              </span>
            </div>

            <div className="glass-panel" style={{ padding: '16px', background: 'var(--bg-surface-elevated)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>Detected Type</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                {result.type}
              </span>
            </div>

            <div className="glass-panel" style={{ padding: '16px', background: 'var(--bg-surface-elevated)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>Sequence Length</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-violet)' }}>
                {result.length} {result.type === 'Protein' ? 'aa' : 'bp'}
              </span>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
              Annotation Description
            </span>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
              {result.description}
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Retrieved Sequence</span>
              <button
                type="button"
                onClick={handleCopySequence}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--accent-cyan)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                {copied ? 'Copied' : 'Copy Sequence'}
              </button>
            </div>
            <div
              style={{
                padding: '12px',
                background: 'var(--bg-surface-elevated)',
                borderRadius: 'var(--radius-sm)',
                fontFamily: 'monospace',
                fontSize: '0.82rem',
                letterSpacing: '0.5px',
                wordBreak: 'break-all',
                maxHeight: '220px',
                overflowY: 'auto'
              }}
            >
              {result.sequence}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
        
