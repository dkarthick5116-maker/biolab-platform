import React, { useState } from 'react';
import { ActivePage } from '../types';
import { ArrowLeft, Dna, Play, RotateCcw, AlertCircle, CheckCircle2, Copy } from 'lucide-react';

interface DnaAnalyzerPageProps {
  onNavigate: (page: ActivePage) => void;
}

interface AnalysisResult {
  sequence: string;
  length: number;
  counts: {
    A: number;
    T: number;
    G: number;
    C: number;
  };
  gc_content: number;
  at_content: number;
  reverse_complement: string;
  rna_transcript: string;
}

export const DnaAnalyzerPage: React.FC<DnaAnalyzerPageProps> = ({ onNavigate }) => {
  const [sequence, setSequence] = useState('ATGCGTACGTAGCTAGCTAG');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleAnalyze = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!sequence.trim() || loading) return;

    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/analyze/dna', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ sequence: sequence.trim().toUpperCase() })
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`API error (${response.status}). Check Vercel function logs.`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || `Analysis failed (${response.status})`);
      }

      setResult(data.data || data);
    } catch (err: any) {
      setError(err.message || 'Error communicating with Biopython backend.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '20px auto', padding: '0 16px', width: '100%' }}>
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
              background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-violet) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#070B19'
            }}
          >
            <Dna size={26} strokeWidth={2.2} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>DNA Sequence Analyzer</h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Biopython-driven nucleotide frequency, GC stoichiometry, and transcription engine.
            </p>
          </div>
        </div>
      </div>

      {/* Error Banner */}
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

      {/* Sequence Input Section */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Input Nucleotide Sequence (A, T, G, C)
            </label>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              Length: {sequence.replace(/\s+/g, '').length} bp
            </span>
          </div>

          <textarea
            rows={4}
            value={sequence}
            onChange={(e) => setSequence(e.target.value.toUpperCase())}
            placeholder="e.g. ATGCGTACGTAGCTAGCTAG"
            style={{
              width: '100%',
              padding: '12px',
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              letterSpacing: '1px',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-main)',
              outline: 'none',
              resize: 'vertical'
            }}
          />

          <div style={{ display: 'flex', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-primary"
              disabled={loading || !sequence.trim()}
              onClick={handleAnalyze}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Play size={16} /> {loading ? 'Running Biopython...' : 'Execute Analysis'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setSequence('ATGCGTACGTAGCTAGCTAG');
                setResult(null);
                setError(null);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <RotateCcw size={16} /> Reset Sample
            </button>
          </div>
        </div>
      </div>

      {/* Results View */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
            <div className="glass-panel" style={{ padding: '16px', background: 'var(--bg-surface-elevated)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>Sequence Length</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                {result.length} <span style={{ fontSize: '0.8rem', fontWeight: 400 }}>bp</span>
              </span>
            </div>

            <div className="glass-panel" style={{ padding: '16px', background: 'var(--bg-surface-elevated)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>GC Content</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                {result.gc_content}%
              </span>
            </div>

            <div className="glass-panel" style={{ padding: '16px', background: 'var(--bg-surface-elevated)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>AT Content</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-violet)' }}>
                {result.at_content}%
              </span>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '14px' }}>Base Distribution</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', textAlign: 'center' }}>
              <div style={{ padding: '10px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Adenine (A)</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#38bdf8' }}>{result.counts.A}</div>
              </div>
              <div style={{ padding: '10px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Thymine (T)</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f87171' }}>{result.counts.T}</div>
              </div>
              <div style={{ padding: '10px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Guanine (G)</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#34d399' }}>{result.counts.G}</div>
              </div>
              <div style={{ padding: '10px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Cytosine (C)</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fbbf24' }}>{result.counts.C}</div>
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '14px' }}>Transcripts & Complements</h3>

            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Reverse Complement (3' → 5' inverted)</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(result.reverse_complement, 'rev')}
                  style={{ background: 'transparent', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  {copiedKey === 'rev' ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                  {copiedKey === 'rev' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div style={{ padding: '10px', background: 'var(--bg-surface-elevated)', fontFamily: 'monospace', wordBreak: 'break-all', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                {result.reverse_complement}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>RNA Transcript (transcribed with Uridine)</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(result.rna_transcript, 'rna')}
                  style={{ background: 'transparent', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  {copiedKey === 'rna' ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                  {copiedKey === 'rna' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div style={{ padding: '10px', background: 'var(--bg-surface-elevated)', fontFamily: 'monospace', wordBreak: 'break-all', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                {result.rna_transcript}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
    
