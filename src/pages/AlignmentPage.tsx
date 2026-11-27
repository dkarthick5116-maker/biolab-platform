import React, { useState } from 'react';
import { ActivePage } from '../types';
import { 
  ArrowLeft, 
  GitCompare, 
  Play, 
  RotateCcw, 
  AlertCircle, 
  Settings2, 
  Copy, 
  CheckCircle2 
} from 'lucide-react';

interface AlignmentPageProps {
  onNavigate: (page: ActivePage) => void;
}

interface AlignmentResult {
  algorithm: string;
  score: number;
  identity_percent: number;
  matches: number;
  alignment_length: number;
  seq1_aligned: string;
  match_line: string;
  seq2_aligned: string;
  full_text: string;
}

const SAMPLE_DNA_1 = 'TACGTCGATCGTAGCTAGCTAGCATC';
const SAMPLE_DNA_2 = 'TACGACGATCGTACGTAGCATC';

export const AlignmentPage: React.FC<AlignmentPageProps> = ({ onNavigate }) => {
  const [seq1, setSeq1] = useState(SAMPLE_DNA_1);
  const [seq2, setSeq2] = useState(SAMPLE_DNA_2);
  const [mode, setMode] = useState<'global' | 'local'>('global');

  // Scoring configuration state
  const [showConfig, setShowConfig] = useState(false);
  const [matchScore, setMatchScore] = useState<number>(2.0);
  const [mismatchScore, setMismatchScore] = useState<number>(-1.0);
  const [gapOpenScore, setGapOpenScore] = useState<number>(-2.0);
  const [gapExtendScore, setGapExtendScore] = useState<number>(-0.5);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AlignmentResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleAlign = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!seq1.trim() || !seq2.trim() || loading) return;

    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/align/pairwise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seq1: seq1.trim().toUpperCase(),
          seq2: seq2.trim().toUpperCase(),
          mode,
          match_score: matchScore,
          mismatch_score: mismatchScore,
          open_gap_score: gapOpenScore,
          extend_gap_score: gapExtendScore
        })
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`API error (${response.status}). Check Vercel logs.`);
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || data.message || `Alignment failed (${response.status})`);
      }

      setResult(data.data || data);
    } catch (err: any) {
      setError(err.message || 'Error executing pairwise alignment.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAlignment = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.full_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
              background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-violet) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#070B19'
            }}
          >
            <GitCompare size={26} strokeWidth={2.2} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>Pairwise Sequence Alignment</h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Biopython Bio.Align: Needleman-Wunsch (Global) &amp; Smith-Waterman (Local) algorithms.
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

      {/* Alignment Input & Parameters */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={mode === 'global' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setMode('global')}
            style={{ fontSize: '0.82rem' }}
          >
            Global (Needleman-Wunsch)
          </button>
          <button
            type="button"
            className={mode === 'local' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setMode('local')}
            style={{ fontSize: '0.82rem' }}
          >
            Local (Smith-Waterman)
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowConfig(!showConfig)}
            style={{ marginLeft: 'auto', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Settings2 size={14} /> {showConfig ? 'Hide Scores' : 'Scoring Parameters'}
          </button>
        </div>

        {showConfig && (
          <div
            style={{
              padding: '14px',
              background: 'var(--bg-surface-elevated)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '16px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px'
            }}
          >
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>
                Match Score: {matchScore}
              </label>
              <input
                type="range"
                min="0.5"
                max="5.0"
                step="0.5"
                value={matchScore}
                onChange={(e) => setMatchScore(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>
                Mismatch Penalty: {mismatchScore}
              </label>
              <input
                type="range"
                min="-5.0"
                max="0.0"
                step="0.5"
                value={mismatchScore}
                onChange={(e) => setMismatchScore(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>
                Gap Open Penalty: {gapOpenScore}
              </label>
              <input
                type="range"
                min="-10.0"
                max="0.0"
                step="0.5"
                value={gapOpenScore}
                onChange={(e) => setGapOpenScore(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>
                Gap Extend Penalty: {gapExtendScore}
              </label>
              <input
                type="range"
                min="-3.0"
                max="0.0"
                step="0.25"
                value={gapExtendScore}
                onChange={(e) => setGapExtendScore(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Sequence 1 (Target / Reference)
            </label>
            <textarea
              rows={4}
              value={seq1}
              onChange={(e) => setSeq1(e.target.value.toUpperCase())}
              placeholder="Enter nucleotide or amino acid sequence..."
              style={{
                width: '100%',
                padding: '10px',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-main)',
                resize: 'vertical'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Sequence 2 (Query / Variant)
            </label>
            <textarea
              rows={4}
              value={seq2}
              onChange={(e) => setSeq2(e.target.value.toUpperCase())}
              placeholder="Enter nucleotide or amino acid sequence..."
              style={{
                width: '100%',
                padding: '10px',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-main)',
                resize: 'vertical'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-primary"
            disabled={loading || !seq1.trim() || !seq2.trim()}
            onClick={handleAlign}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Play size={16} /> {loading ? 'Aligning...' : 'Compute Pairwise Alignment'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setSeq1(SAMPLE_DNA_1);
              setSeq2(SAMPLE_DNA_2);
              setResult(null);
              setError(null);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <RotateCcw size={16} /> Reset Default
          </button>
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
            <div className="glass-panel" style={{ padding: '16px', background: 'var(--bg-surface-elevated)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>Alignment Score</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                {result.score}
              </span>
            </div>

            <div className="glass-panel" style={{ padding: '16px', background: 'var(--bg-surface-elevated)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>Sequence Identity</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                {result.identity_percent}%
              </span>
            </div>

            <div className="glass-panel" style={{ padding: '16px', background: 'var(--bg-surface-elevated)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>Identical Matches</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-violet)' }}>
                {result.matches} / {result.alignment_length}
              </span>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>
                  Optimal Alignment ({result.algorithm})
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCopyAlignment}
                className="btn-secondary"
                style={{ fontSize: '0.75rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div
              style={{
                padding: '16px',
                background: '#040711',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                fontSize: '0.88rem',
                lineHeight: 1.4,
                overflowX: 'auto',
                whiteSpace: 'pre',
                color: '#e2e8f0'
              }}
            >
              {result.full_text}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
