import React, { useState } from 'react';
import { ActivePage } from '../types';
import { useAuth } from '../context/AuthContext';
import { saveAnalysisRun } from '../services/historyService';
import { ArrowLeft, Dna, Play, RotateCcw, AlertCircle, CheckCircle2, Copy, Bookmark, Check } from 'lucide-react';

interface RnaAnalyzerPageProps {
  onNavigate: (page: ActivePage) => void;
}

interface RnaAnalysisResult {
  sequence: string;
  length: number;
  counts: {
    A: number;
    U: number;
    G: number;
    C: number;
  };
  gc_content: number;
  au_content: number;
  reverse_complement: string;
  cdna: string;
  protein_translation: string;
}

export const RnaAnalyzerPage: React.FC<RnaAnalyzerPageProps> = ({ onNavigate }) => {
  const { currentUser, refreshProfile } = useAuth();
  const [sequence, setSequence] = useState('AUGCGUACGUAGCUAGCUAG');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RnaAnalysisResult | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleAnalyze = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!sequence.trim() || loading) return;

    setError(null);
    setSavedSuccess(false);
    setLoading(true);

    try {
      const response = await fetch('/api/analyze/rna', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ sequence: sequence.trim().toUpperCase() })
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`API error (${response.status}). Check Vercel logs.`);
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

  const handleSaveToNotebook = async () => {
    if (!currentUser || !result || saving || savedSuccess) return;

    setSaving(true);
    try {
      await saveAnalysisRun(currentUser.uid, {
        module: 'RNA',
        sequence: result.sequence,
        length: result.length,
        gcContent: result.gc_content,
        secondaryMetric: {
          label: 'AU Content',
          value: result.au_content
        },
        summary: `RNA ${result.length} nt | GC: ${result.gc_content}% | Peptide: ${result.protein_translation.substring(0, 15)}...`
      });
      setSavedSuccess(true);
      await refreshProfile();
    } catch (err: any) {
      setError('Failed to record run in notebook.');
    } finally {
      setSaving(false);
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
              background: 'linear-gradient(135deg, var(--accent-violet) 0%, var(--accent-rose) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}
          >
            <Dna size={26} strokeWidth={2.2} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>RNA Sequence Analyzer</h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Biopython transcript inspection, AU/GC stoichiometry, reverse transcription, and translation.
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

      {/* Input Section */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Input Ribonucleotide Sequence (A, U, G, C)
            </label>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              Length: {sequence.replace(/\s+/g, '').length} bases
            </span>
          </div>

          <textarea
            rows={4}
            value={sequence}
            onChange={(e) => setSequence(e.target.value.toUpperCase())}
            placeholder="e.g. AUGCGUACGUAGCUAGCUAG"
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
                setSequence('AUGCGUACGUAGCUAGCUAG');
                setResult(null);
                setError(null);
                setSavedSuccess(false);
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
          <div
            className="glass-panel"
            style={{
              padding: '14px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px'
            }}
          >
            <div>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Analysis Complete
              </span>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Biopython transcript operations verified.
              </p>
            </div>
            {currentUser ? (
              <button
                type="button"
                onClick={handleSaveToNotebook}
                disabled={saving || savedSuccess}
                className={savedSuccess ? 'btn-secondary' : 'btn-primary'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.82rem',
                  borderColor: savedSuccess ? 'var(--accent-emerald)' : undefined,
                  color: savedSuccess ? 'var(--accent-emerald)' : undefined
                }}
              >
                {savedSuccess ? <Check size={15} /> : <Bookmark size={15} />}
                {savedSuccess ? 'Saved to Lab Notebook' : saving ? 'Saving...' : 'Save to Lab Notebook'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="btn-secondary"
                style={{ fontSize: '0.8rem' }}
              >
                Sign In to Save Run
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
            <div className="glass-panel" style={{ padding: '16px', background: 'var(--bg-surface-elevated)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>Sequence Length</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                {result.length} <span style={{ fontSize: '0.8rem', fontWeight: 400 }}>nt</span>
              </span>
            </div>

            <div className="glass-panel" style={{ padding: '16px', background: 'var(--bg-surface-elevated)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>GC Content</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                {result.gc_content}%
              </span>
            </div>

            <div className="glass-panel" style={{ padding: '16px', background: 'var(--bg-surface-elevated)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>AU Content</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-violet)' }}>
                {result.au_content}%
              </span>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '14px' }}>Base Composition</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', textAlign: 'center' }}>
              <div style={{ padding: '10px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Adenine (A)</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#38bdf8' }}>{result.counts.A}</div>
              </div>
              <div style={{ padding: '10px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Uracil (U)</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f87171' }}>{result.counts.U}</div>
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
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '14px' }}>Molecular Derivations</h3>

            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Reverse Transcription (cDNA)</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(result.cdna, 'cdna')}
                  style={{ background: 'transparent', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  {copiedKey === 'cdna' ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                  {copiedKey === 'cdna' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div style={{ padding: '10px', background: 'var(--bg-surface-elevated)', fontFamily: 'monospace', wordBreak: 'break-all', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                {result.cdna}
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>RNA Reverse Complement</span>
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
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Peptide Translation (Standard Genetic Code)</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(result.protein_translation, 'prot')}
                  style={{ background: 'transparent', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  {copiedKey === 'prot' ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                  {copiedKey === 'prot' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div style={{ padding: '10px', background: 'var(--bg-surface-elevated)', fontFamily: 'monospace', wordBreak: 'break-all', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--accent-emerald)' }}>
                {result.protein_translation}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
      
