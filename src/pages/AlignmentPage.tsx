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
  CheckCircle2,
  Check,
  Bookmark,
  Download,
  FileDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { saveAnalysisRun } from '../services/historyService';

interface AlignmentPageProps {
  onNavigate: (page: ActivePage) => void;
}

interface BackendAlignmentData {
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

interface AlignmentMetrics {
  algorithm: string;
  score: number;
  targetLength: number;
  queryLength: number;
  alignmentLength: number;
  identicalMatches: number;
  mismatches: number;
  gapPositions: number;
  gapRuns: number;
  identityPercentage: number;
  seq1Aligned: string;
  matchLine: string;
  seq2Aligned: string;
  fullText: string;
}

const SAMPLE_DNA_1 = 'TACGTCGATCGTAGCTAGCTAGCATC';
const SAMPLE_DNA_2 = 'TACGACGATCGTACGTAGCATC';

export const AlignmentPage: React.FC<AlignmentPageProps> = ({ onNavigate }) => {
  const { currentUser, refreshProfile } = useAuth();

  const [seq1, setSeq1] = useState<string>(SAMPLE_DNA_1);
  const [seq2, setSeq2] = useState<string>(SAMPLE_DNA_2);
  const [mode, setMode] = useState<'global' | 'local'>('global');

  // Scoring matrix parameters
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [matchScore, setMatchScore] = useState<number>(2.0);
  const [mismatchScore, setMismatchScore] = useState<number>(-1.0);
  const [gapOpenScore, setGapOpenScore] = useState<number>(-2.0);
  const [gapExtendScore, setGapExtendScore] = useState<number>(-0.5);

  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AlignmentMetrics | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
      const computeRigorousMetrics = (
    data: BackendAlignmentData,
    rawSeq1: string,
    rawSeq2: string
  ): AlignmentMetrics => {
    const s1 = data.seq1_aligned;
    const s2 = data.seq2_aligned;

    if (!s1 || !s2 || s1.length !== s2.length) {
      throw new Error('Alignment data format error: Sequence row lengths are unequal or missing.');
    }

    const alignmentLength = s1.length;
    let identicalMatches = 0;
    let mismatches = 0;
    let gapPositions = 0;
    let gapRuns = 0;
    let inGapRun = false;

    for (let i = 0; i < alignmentLength; i++) {
      const c1 = s1[i];
      const c2 = s2[i];
      const isGap = c1 === '-' || c2 === '-';

      if (isGap) {
        gapPositions++;
        if (!inGapRun) {
          gapRuns++;
          inGapRun = true;
        }
      } else {
        inGapRun = false;
        if (c1 === c2) {
          identicalMatches++;
        } else {
          mismatches++;
        }
      }
    }

    const identityPercentage = alignmentLength > 0
      ? Number(((identicalMatches / alignmentLength) * 100).toFixed(2))
      : 0;

    return {
      algorithm: data.algorithm,
      score: data.score,
      targetLength: rawSeq1.length,
      queryLength: rawSeq2.length,
      alignmentLength,
      identicalMatches,
      mismatches,
      gapPositions,
      gapRuns,
      identityPercentage,
      seq1Aligned: s1,
      matchLine: data.match_line,
      seq2Aligned: s2,
      fullText: data.full_text
    };
  };

  const handleAlign = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const cleanSeq1 = seq1.trim().toUpperCase();
    const cleanSeq2 = seq2.trim().toUpperCase();

    if (!cleanSeq1 || !cleanSeq2) {
      setError('Both sequence inputs are required to compute alignment.');
      return;
    }

    if (loading) return;

    setError(null);
    setResult(null);
    setSavedSuccess(false);
    setLoading(true);

    try {
      const response = await fetch('/api/align/pairwise', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          seq1: cleanSeq1,
          seq2: cleanSeq2,
          mode,
          match_score: matchScore,
          mismatch_score: mismatchScore,
          open_gap_score: gapOpenScore,
          extend_gap_score: gapExtendScore
        })
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`API returned an unexpected response (${response.status}). Check server status.`);
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || data.message || `Alignment failed (${response.status})`);
      }

      const backendPayload: BackendAlignmentData = data.data || data;
      const metrics = computeRigorousMetrics(backendPayload, cleanSeq1, cleanSeq2);
      setResult(metrics);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred during pairwise alignment.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExportFasta = () => {
    if (!result) return;
    const fastaContent = 
`>target_aligned | Algorithm: ${result.algorithm} | Length: ${result.alignmentLength} | Score: ${result.score}
${result.seq1Aligned}
>query_aligned | Identity: ${result.identityPercentage}% | Matches: ${result.identicalMatches}
${result.seq2Aligned}
`;
    const blob = new Blob([fastaContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `alignment_${mode}_${Date.now()}.fasta`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    if (!result) return;
    const jsonContent = JSON.stringify({
      metadata: {
        timestamp: new Date().toISOString(),
        engine: 'Biopython Bio.Align.PairwiseAligner',
        algorithm: result.algorithm,
        mode
      },
      parameters: {
        matchScore,
        mismatchScore,
        gapOpenScore,
        gapExtendScore
      },
      statistics: {
        score: result.score,
        targetLength: result.targetLength,
        queryLength: result.queryLength,
        alignmentLength: result.alignmentLength,
        identicalMatches: result.identicalMatches,
        mismatches: result.mismatches,
        gapPositions: result.gapPositions,
        gapRuns: result.gapRuns,
        identityPercentage: result.identityPercentage
      },
      alignment: {
        targetAligned: result.seq1Aligned,
        matchLine: result.matchLine,
        queryAligned: result.seq2Aligned,
        fullFormattedText: result.fullText
      }
    }, null, 2);

    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `alignment_${mode}_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyAlignment = async () => {
    if (!result) return;
    try {
      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(result.fullText);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = result.fullText;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Failed to copy alignment to clipboard.');
    }
  };

  const handleSaveToNotebook = async () => {
    if (!currentUser || !result || saving || savedSuccess) return;

    setSaving(true);
    try {
      await saveAnalysisRun(currentUser.uid, {
        module: 'Alignment' as unknown as 'DNA',
        sequence: `${seq1.trim().substring(0, 24)}... vs ${seq2.trim().substring(0, 24)}...`,
        length: result.alignmentLength,
        gcContent: result.identityPercentage,
        secondaryMetric: {
          label: 'Score',
          value: result.score
        },
        summary: `${result.algorithm} | Identity: ${result.identityPercentage}% | Score: ${result.score}`
      });
      setSavedSuccess(true);
      if (refreshProfile) {
        await refreshProfile();
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to record run in notebook.');
      }
    } finally {
      setSaving(false);
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

      {/* Input Section */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
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

        {/* Scoring Matrix Sliders */}
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
              <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
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
              <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
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
              <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
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
              <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Sequence 1 (Target / Reference)
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                {seq1.replace(/\s+/g, '').length} bp
              </span>
            </div>
            <textarea
              rows={4}
              value={seq1}
              onChange={(e) => setSeq1(e.target.value.toUpperCase())}
              placeholder="Enter reference sequence..."
              style={{
                width: '100%',
                padding: '10px',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-main)',
                resize: 'vertical',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Sequence 2 (Query / Variant)
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                {seq2.replace(/\s+/g, '').length} bp
              </span>
            </div>
            <textarea
              rows={4}
              value={seq2}
              onChange={(e) => setSeq2(e.target.value.toUpperCase())}
              placeholder="Enter comparison sequence..."
              style={{
                width: '100%',
                padding: '10px',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-main)',
                resize: 'vertical',
                outline: 'none'
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
              setSavedSuccess(false);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <RotateCcw size={16} /> Reset Default
          </button>
        </div>
      </div>
            {/* Results View */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Action Bar with Exports */}
          <div
            className="glass-panel"
            style={{
              padding: '14px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {result.algorithm} Complete
              </span>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Aligned string length: {result.alignmentLength} positions (Target: {result.targetLength}, Query: {result.queryLength})
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleCopyAlignment}
                className="btn-secondary"
                style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>

              <button
                type="button"
                onClick={handleExportFasta}
                className="btn-secondary"
                style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Download size={14} /> FASTA
              </button>

              <button
                type="button"
                onClick={handleExportJson}
                className="btn-secondary"
                style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <FileDown size={14} /> JSON
              </button>

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
                    fontSize: '0.8rem',
                    borderColor: savedSuccess ? 'var(--accent-emerald)' : undefined,
                    color: savedSuccess ? 'var(--accent-emerald)' : undefined
                  }}
                >
                  {savedSuccess ? <Check size={14} /> : <Bookmark size={14} />}
                  {savedSuccess ? 'Saved' : saving ? 'Saving...' : 'Save Run'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigate('login')}
                  className="btn-secondary"
                  style={{ fontSize: '0.8rem' }}
                >
                  Sign In to Save
                </button>
              )}
            </div>
          </div>

          {/* Statistical Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px' }}>
            <div className="glass-panel" style={{ padding: '16px', background: 'var(--bg-surface-elevated)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>Alignment Score</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                {result.score}
              </span>
            </div>

            <div className="glass-panel" style={{ padding: '16px', background: 'var(--bg-surface-elevated)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>Sequence Identity</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                {result.identityPercentage}%
              </span>
            </div>

            <div className="glass-panel" style={{ padding: '16px', background: 'var(--bg-surface-elevated)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>Identical Matches</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-violet)' }}>
                {result.identicalMatches} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>columns</span>
              </span>
            </div>

            <div className="glass-panel" style={{ padding: '16px', background: 'var(--bg-surface-elevated)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>Mismatches</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-amber, #f59e0b)' }}>
                {result.mismatches} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>positions</span>
              </span>
            </div>

            <div className="glass-panel" style={{ padding: '16px', background: 'var(--bg-surface-elevated)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>Gap Positions</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-rose)' }}>
                {result.gapPositions} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>({result.gapRuns} runs)</span>
              </span>
            </div>
          </div>

          {/* Formatted Alignment Output */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, margin: '0 0 12px 0' }}>
              Standard Formatted Alignment Matrix
            </h3>
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
              {result.fullText}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
