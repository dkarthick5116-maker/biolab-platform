
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

// ==========================================
// 1. TYPES AND INTERFACES
// ==========================================

interface AlignmentPageProps {
  onNavigate: (page: ActivePage) => void;
}

interface AlignmentResult {
  algorithm: string;
  score: number;
  identity_percent: number;
  matches: number;
  mismatches: number;
  gaps: number;
  alignment_length: number;
  seq1_aligned: string;
  match_line: string;
  seq2_aligned: string;
  full_text: string;
}

interface AlignmentApiResponse {
  data?: any;
  score?: number;
  algorithm?: string;
  seq1_aligned?: string;
  seq2_aligned?: string;
  detail?: any;
  message?: string;
}

// ==========================================
// 2. DEFAULT DNA SEQUENCES
// ==========================================

const SAMPLE_DNA_1 =
  'TACGTCGATCGTAGCTAGCTAGCATC';

const SAMPLE_DNA_2 =
  'TACGACGATCGTACGTAGCATC';

// ==========================================
// 3. SEQUENCE CLEANING
// ==========================================

function cleanSequence(sequence: string): string {
  return sequence
    .replace(/\s+/g, '')
    .toUpperCase();
}

// ==========================================
// 4. ALIGNMENT STATISTICS
// ==========================================

function calculateAlignmentStatistics(
  sequence1: string,
  sequence2: string
) {
  const aligned1 = sequence1
    .replace(/\s+/g, '')
    .toUpperCase();

  const aligned2 = sequence2
    .replace(/\s+/g, '')
    .toUpperCase();

  if (!aligned1 || !aligned2) {
    throw new Error(
      'The alignment returned empty sequences.'
    );
  }

  if (aligned1.length !== aligned2.length) {
    throw new Error(
      'Invalid alignment: both aligned sequences must have equal lengths.'
    );
  }

  let matches = 0;
  let mismatches = 0;
  let gaps = 0;

  let matchLine = '';

  for (let i = 0; i < aligned1.length; i++) {

    const base1 = aligned1[i];
    const base2 = aligned2[i];

    if (base1 === '-' || base2 === '-') {

      gaps++;

      matchLine += ' ';

    } else if (base1 === base2) {

      matches++;

      matchLine += '|';

    } else {

      mismatches++;

      matchLine += '.';
    }
  }

  const alignmentLength = aligned1.length;

  const identityPercent =
    alignmentLength > 0
      ? Number(
          ((matches / alignmentLength) * 100).toFixed(2)
        )
      : 0;

  return {
    matches,
    mismatches,
    gaps,
    alignmentLength,
    identityPercent,
    matchLine
  };
}

// ==========================================
// 5. ALIGNMENT TEXT FORMATTER
// ==========================================

function formatAlignment(
  sequence1: string,
  matchLine: string,
  sequence2: string
): string {

  const width = 60;

  const lines: string[] = [];

  for (
    let i = 0;
    i < sequence1.length;
    i += width
  ) {

    const end = i + width;

    lines.push(
      `Target ${i + 1}\t${sequence1.slice(i, end)}`
    );

    lines.push(
      `       \t${matchLine.slice(i, end)}`
    );

    lines.push(
      `Query  ${i + 1}\t${sequence2.slice(i, end)}`
    );

    lines.push('');
  }

  return lines.join('\n');
}

// ==========================================
// 6. API ERROR HANDLER
// ==========================================

function getErrorMessage(error: unknown): string {

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected alignment error occurred.';
}

// ==========================================
// 7. MAIN ALIGNMENT COMPONENT
// ==========================================

export const AlignmentPage: React.FC<AlignmentPageProps> = ({
  onNavigate
}) => {

  // ----------------------------------------
  // SEQUENCE STATES
  // ----------------------------------------

  const [seq1, setSeq1] = useState(SAMPLE_DNA_1);

  const [seq2, setSeq2] = useState(SAMPLE_DNA_2);

  // ----------------------------------------
  // ALIGNMENT MODE
  // ----------------------------------------

  const [mode, setMode] = useState<
    'global' | 'local'
  >('global');

  // ----------------------------------------
  // SCORING PARAMETERS
  // ----------------------------------------

  const [showConfig, setShowConfig] =
    useState(false);

  const [matchScore, setMatchScore] =
    useState(2.0);

  const [mismatchScore, setMismatchScore] =
    useState(-1.0);

  const [gapOpenScore, setGapOpenScore] =
    useState(-2.0);

  const [gapExtendScore, setGapExtendScore] =
    useState(-0.5);

  // ----------------------------------------
  // APPLICATION STATES
  // ----------------------------------------

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [result, setResult] =
    useState<AlignmentResult | null>(null);

  const [copied, setCopied] =
    useState(false);

  // ----------------------------------------
  // CLEAR OLD RESULTS
  // ----------------------------------------

  const clearPreviousResult = () => {

    setResult(null);
    setError(null);
    setCopied(false);

  };

  // ==========================================
  // 8. COMPUTE PAIRWISE ALIGNMENT
  // ==========================================

  const handleAlign = async (
    e?: React.MouseEvent<HTMLButtonElement>
  ) => {

    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (loading) return;

    const cleanSeq1 = cleanSequence(seq1);

    const cleanSeq2 = cleanSequence(seq2);

    if (!cleanSeq1 || !cleanSeq2) {

      setError(
        'Please enter both sequences before alignment.'
      );

      return;
    }

    setError(null);
    setResult(null);
    setLoading(true);

    try {

      // --------------------------------------
      // SEND REQUEST TO FASTAPI
      // --------------------------------------

      const response = await fetch(
        '/api/align/pairwise',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({

            seq1: cleanSeq1,

            seq2: cleanSeq2,

            mode: mode,

            match_score: matchScore,

            mismatch_score: mismatchScore,

            open_gap_score: gapOpenScore,

            extend_gap_score: gapExtendScore

          })
        }
      );

      // --------------------------------------
      // CHECK RESPONSE FORMAT
      // --------------------------------------

      const contentType =
        response.headers.get('content-type') || '';

      if (!contentType.includes('json')) {

        throw new Error(
          `API error (${response.status}). Check your FastAPI deployment and Vercel logs.`
        );

      }

      const responseData: AlignmentApiResponse =
        await response.json();

      // --------------------------------------
      // CHECK API ERRORS
      // --------------------------------------

      if (!response.ok) {

        const detail = responseData.detail;

        const message =
          typeof detail === 'string'
            ? detail
            : detail
              ? JSON.stringify(detail)
              : responseData.message;

        throw new Error(
          message || `Alignment failed (${response.status}).`
        );

      }

      // --------------------------------------
      // EXTRACT BACKEND RESULT
      // --------------------------------------

      const rawResult =
        responseData.data || responseData;

      if (
        typeof rawResult.seq1_aligned !== 'string' ||
        typeof rawResult.seq2_aligned !== 'string'
      ) {

        throw new Error(
          'Invalid API response: aligned sequences are missing.'
        );

      }

      const score = Number(rawResult.score);

      if (!Number.isFinite(score)) {

        throw new Error(
          'Invalid API response: alignment score is missing or invalid.'
        );

      }

      // --------------------------------------
      // RECALCULATE STATISTICS
      // --------------------------------------

      const statistics =
        calculateAlignmentStatistics(
          rawResult.seq1_aligned,
          rawResult.seq2_aligned
        );

      // --------------------------------------
      // GENERATE ALIGNMENT DISPLAY
      // --------------------------------------

      const alignedSequence1 =
        rawResult.seq1_aligned
          .replace(/\s+/g, '')
          .toUpperCase();

      const alignedSequence2 =
        rawResult.seq2_aligned
          .replace(/\s+/g, '')
          .toUpperCase();

      const fullText = formatAlignment(
        alignedSequence1,
        statistics.matchLine,
        alignedSequence2
      );

      // --------------------------------------
      // SAVE VERIFIED RESULT
      // --------------------------------------

      const verifiedResult: AlignmentResult = {

        algorithm:
          rawResult.algorithm ||
          (
            mode === 'global'
              ? 'Needleman-Wunsch (Global)'
              : 'Smith-Waterman (Local)'
          ),

        score: score,

        identity_percent:
          statistics.identityPercent,

        matches:
          statistics.matches,

        mismatches:
          statistics.mismatches,

        gaps:
          statistics.gaps,

        alignment_length:
          statistics.alignmentLength,

        seq1_aligned:
          alignedSequence1,

        match_line:
          statistics.matchLine,

        seq2_aligned:
          alignedSequence2,

        full_text:
          fullText

      };

      setResult(verifiedResult);

    } catch (err: unknown) {

      setError(getErrorMessage(err));

      setResult(null);

    } finally {

      setLoading(false);

    }

  };

  // ==========================================
  // 9. COPY ALIGNMENT
  // ==========================================

  const handleCopyAlignment = async () => {

    if (!result) return;

    try {

      await navigator.clipboard.writeText(
        result.full_text
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);

    } catch {

      setError(
        'Unable to copy alignment. Please check clipboard permissions.'
      );

    }

  };

  // ==========================================
  // 10. RESET DEFAULT
  // ==========================================

  const handleReset = () => {

    setSeq1(SAMPLE_DNA_1);

    setSeq2(SAMPLE_DNA_2);

    setMode('global');

    setMatchScore(2.0);

    setMismatchScore(-1.0);

    setGapOpenScore(-2.0);

    setGapExtendScore(-0.5);

    setShowConfig(false);

    setResult(null);

    setError(null);

    setCopied(false);

  };

  // ==========================================
  // PART 2 CONTINUES BELOW
  // ==========================================
      
  // ==========================================
  // 11. USER INTERFACE
  // ==========================================

  return (

    <div
      style={{
        maxWidth: '960px',
        margin: '20px auto',
        padding: '0 16px',
        width: '100%'
      }}
    >

      {/* BACK BUTTON */}

      <button
        type="button"
        onClick={() => onNavigate('dashboard')}
        className="btn-secondary"
        style={{
          marginBottom: '16px',
          fontSize: '0.85rem'
        }}
      >
        <ArrowLeft size={16} />
        Back to Lab Dashboard
      </button>

      {/* ================================== */}
      {/* HEADER PANEL */}
      {/* ================================== */}

      <div
        className="glass-panel"
        style={{
          padding: '24px',
          marginBottom: '20px'
        }}
      >

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}
        >

          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background:
                'linear-gradient(135deg, var(--accent-cyan), var(--accent-violet))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#070B19',
              flexShrink: 0
            }}
          >
            <GitCompare
              size={26}
              strokeWidth={2.2}
            />
          </div>

          <div>

            <h1
              style={{
                fontSize: '1.4rem',
                fontWeight: 700,
                margin: 0
              }}
            >
              Pairwise Sequence Alignment
            </h1>

            <p
              style={{
                fontSize: '0.82rem',
                color: 'var(--text-muted)',
                margin: '4px 0 0'
              }}
            >
              Biopython Bio.Align: Needleman-Wunsch
              (Global) and Smith-Waterman (Local)
              algorithms.
            </p>

          </div>

        </div>

      </div>

      {/* ================================== */}
      {/* ERROR MESSAGE */}
      {/* ================================== */}

      {error && (

        <div
          role="alert"
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
            marginBottom: '20px',
            overflowWrap: 'anywhere'
          }}
        >

          <AlertCircle size={18} />

          {error}

        </div>

      )}

      {/* ================================== */}
      {/* INPUT AND CONFIGURATION PANEL */}
      {/* ================================== */}

      <div
        className="glass-panel"
        style={{
          padding: '24px',
          marginBottom: '20px'
        }}
      >

        {/* ALIGNMENT MODE BUTTONS */}

        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '16px',
            flexWrap: 'wrap'
          }}
        >

          <button
            type="button"
            className={
              mode === 'global'
                ? 'btn-primary'
                : 'btn-secondary'
            }
            onClick={() => {
              setMode('global');
              clearPreviousResult();
            }}
            style={{ fontSize: '0.82rem' }}
          >
            Global (Needleman-Wunsch)
          </button>

          <button
            type="button"
            className={
              mode === 'local'
                ? 'btn-primary'
                : 'btn-secondary'
            }
            onClick={() => {
              setMode('local');
              clearPreviousResult();
            }}
            style={{ fontSize: '0.82rem' }}
          >
            Local (Smith-Waterman)
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowConfig(!showConfig)}
            style={{
              marginLeft: 'auto',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >

            <Settings2 size={14} />

            {showConfig
              ? 'Hide Scores'
              : 'Scoring Parameters'}

          </button>

        </div>

        {/* ================================== */}
        {/* SCORING PARAMETERS */}
        {/* ================================== */}

        {showConfig && (

          <div
            style={{
              padding: '14px',
              background: 'var(--bg-surface-elevated)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '16px',
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px'
            }}
          >

            {/* MATCH SCORE */}

            <div>

              <label
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-dim)',
                  display: 'block'
                }}
              >
                Match Score: {matchScore}
              </label>

              <input
                type="range"
                min="0.5"
                max="5"
                step="0.5"
                value={matchScore}
                onChange={(e) => {
                  setMatchScore(Number(e.target.value));
                  clearPreviousResult();
                }}
                style={{ width: '100%' }}
              />

            </div>

            {/* MISMATCH PENALTY */}

            <div>

              <label
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-dim)',
                  display: 'block'
                }}
              >
                Mismatch Penalty: {mismatchScore}
              </label>

              <input
                type="range"
                min="-5"
                max="0"
                step="0.5"
                value={mismatchScore}
                onChange={(e) => {
                  setMismatchScore(Number(e.target.value));
                  clearPreviousResult();
                }}
                style={{ width: '100%' }}
              />

            </div>

            {/* GAP OPEN PENALTY */}

            <div>

              <label
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-dim)',
                  display: 'block'
                }}
              >
                Gap Open Penalty: {gapOpenScore}
              </label>

              <input
                type="range"
                min="-10"
                max="0"
                step="0.5"
                value={gapOpenScore}
                onChange={(e) => {
                  setGapOpenScore(Number(e.target.value));
                  clearPreviousResult();
                }}
                style={{ width: '100%' }}
              />

            </div>

            {/* GAP EXTENSION PENALTY */}

            <div>

              <label
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-dim)',
                  display: 'block'
                }}
              >
                Gap Extend Penalty: {gapExtendScore}
              </label>

              <input
                type="range"
                min="-3"
                max="0"
                step="0.25"
                value={gapExtendScore}
                onChange={(e) => {
                  setGapExtendScore(Number(e.target.value));
                  clearPreviousResult();
                }}
                style={{ width: '100%' }}
              />

            </div>

          </div>

        )}

        {/* ================================== */}
        {/* SEQUENCE INPUTS */}
        {/* ================================== */}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px'
          }}
        >

          {/* SEQUENCE 1 */}

          <div>

            <label
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                fontWeight: 600,
                display: 'block',
                marginBottom: '6px'
              }}
            >
              Sequence 1 (Target / Reference)
            </label>

            <textarea
              rows={4}
              value={seq1}
              onChange={(e) => {
                setSeq1(e.target.value.toUpperCase());
                clearPreviousResult();
              }}
              placeholder="Enter nucleotide or amino acid sequence..."
              spellCheck={false}
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
                boxSizing: 'border-box'
              }}
            />

            <small
              style={{
                color: 'var(--text-dim)',
                fontSize: '0.72rem'
              }}
            >
              Input length: {cleanSequence(seq1).length}
            </small>

          </div>

          {/* SEQUENCE 2 */}

          <div>

            <label
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                fontWeight: 600,
                display: 'block',
                marginBottom: '6px'
              }}
            >
              Sequence 2 (Query / Variant)
            </label>

            <textarea
              rows={4}
              value={seq2}
              onChange={(e) => {
                setSeq2(e.target.value.toUpperCase());
                clearPreviousResult();
              }}
              placeholder="Enter nucleotide or amino acid sequence..."
              spellCheck={false}
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
                boxSizing: 'border-box'
              }}
            />

            <small
              style={{
                color: 'var(--text-dim)',
                fontSize: '0.72rem'
              }}
            >
              Input length: {cleanSequence(seq2).length}
            </small>

          </div>

        </div>

        {/* ================================== */}
        {/* ACTION BUTTONS */}
        {/* ================================== */}

        <div
          style={{
            display: 'flex',
            gap: '10px',
            marginTop: '16px',
            flexWrap: 'wrap'
          }}
        >

          <button
            type="button"
            className="btn-primary"
            disabled={
              loading ||
              !cleanSequence(seq1) ||
              !cleanSequence(seq2)
            }
            onClick={handleAlign}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: loading ? 0.7 : 1
            }}
          >

            <Play size={16} />

            {loading
              ? 'Aligning...'
              : 'Compute Pairwise Alignment'}

          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={handleReset}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >

            <RotateCcw size={16} />

            Reset Default

          </button>

        </div>

      </div>

      {/* ================================== */}
      {/* RESULTS SECTION */}
      {/* ================================== */}

      {result && (

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >

          {/* ================================== */}
          {/* STATISTICS CARDS */}
          {/* ================================== */}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(145px, 1fr))',
              gap: '14px'
            }}
          >

            {/* ALIGNMENT SCORE */}

            <div
              className="glass-panel"
              style={{
                padding: '16px',
                background: 'var(--bg-surface-elevated)'
              }}
            >

              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-dim)',
                  display: 'block'
                }}
              >
                Alignment Score
              </span>

              <span
                style={{
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  color: 'var(--accent-cyan)'
                }}
              >
                {result.score}
              </span>

            </div>

            {/* SEQUENCE IDENTITY */}

            <div
              className="glass-panel"
              style={{
                padding: '16px',
                background: 'var(--bg-surface-elevated)'
              }}
            >

              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-dim)',
                  display: 'block'
                }}
              >
                Sequence Identity
              </span>

              <span
                style={{
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  color: 'var(--accent-emerald)'
                }}
              >
                {result.identity_percent.toFixed(2)}%
              </span>

            </div>

            {/* IDENTICAL MATCHES */}

            <div
              className="glass-panel"
              style={{
                padding: '16px',
                background: 'var(--bg-surface-elevated)'
              }}
            >

              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-dim)',
                  display: 'block'
                }}
              >
                Identical Matches
              </span>

              <span
                style={{
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  color: 'var(--accent-violet)'
                }}
              >
                {result.matches} / {result.alignment_length}
              </span>

            </div>

            {/* MISMATCHES */}

            <div
              className="glass-panel"
              style={{
                padding: '16px',
                background: 'var(--bg-surface-elevated)'
              }}
            >

              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-dim)',
                  display: 'block'
                }}
              >
                Mismatches
              </span>

              <span
                style={{
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  color: 'var(--accent-rose)'
                }}
              >
                {result.mismatches}
              </span>

            </div>

            {/* GAP POSITIONS */}

            <div
              className="glass-panel"
              style={{
                padding: '16px',
                background: 'var(--bg-surface-elevated)'
              }}
            >

              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-dim)',
                  display: 'block'
                }}
              >
                Gap Positions
              </span>

              <span
                style={{
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  color: 'var(--accent-cyan)'
                }}
              >
                {result.gaps}
              </span>

            </div>

            {/* ALIGNMENT LENGTH */}

            <div
              className="glass-panel"
              style={{
                padding: '16px',
                background: 'var(--bg-surface-elevated)'
              }}
            >

              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-dim)',
                  display: 'block'
                }}
              >
                Alignment Length
              </span>

              <span
                style={{
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  color: 'var(--accent-violet)'
                }}
              >
                {result.alignment_length}
              </span>

            </div>

          </div>

          {/* ================================== */}
          {/* OPTIMAL ALIGNMENT */}
          {/* ================================== */}

          <div
            className="glass-panel"
            style={{
              padding: '20px'
            }}
          >

            {/* ALIGNMENT HEADER */}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px',
                flexWrap: 'wrap'
              }}
            >

              <div>

                <h3
                  style={{
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    margin: 0
                  }}
                >
                  Optimal Alignment
                </h3>

                <p
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    margin: '5px 0 0'
                  }}
                >
                  {result.algorithm}
                </p>

              </div>

              {/* COPY BUTTON */}

              <button
                type="button"
                onClick={handleCopyAlignment}
                className="btn-secondary"
                style={{
                  fontSize: '0.75rem',
                  padding: '6px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >

                {copied
                  ? <CheckCircle2 size={13} />
                  : <Copy size={13} />}

                {copied ? 'Copied' : 'Copy'}

              </button>

            </div>

            {/* ALIGNMENT DISPLAY */}

            <div
              style={{
                padding: '16px',
                background: '#040711',
                border: '1px solid var(--border-subtle),
                  borderRadius: 'var(--radius-sm)',
                fontFamily:
                  'Consolas, Monaco, "Courier New", monospace',
                fontSize: '0.82rem',
                lineHeight: 1.6,
                overflowX: 'auto',
                whiteSpace: 'pre',
                color: '#e2e8f0',
                maxWidth: '100%',
                boxSizing: 'border-box'
              }}
            >
              {result.full_text}
            </div>

            {/* ALIGNMENT LEGEND */}

            <div
              style={{
                display: 'flex',
                gap: '16px',
                flexWrap: 'wrap',
                marginTop: '14px',
                fontSize: '0.75rem',
                color: 'var(--text-muted)'
              }}
            >

              <span>
                <strong style={{ color: 'var(--accent-emerald)' }}>
                  |
                </strong>
                {' '}Identical
              </span>

              <span>
                <strong style={{ color: 'var(--accent-rose)' }}>
                  .
                </strong>
                {' '}Mismatch
              </span>

              <span>
                <strong style={{ color: 'var(--accent-cyan)' }}>
                  -
                </strong>
                {' '}Gap
              </span>

            </div>

          </div>

        </div>

      )}

    </div>

  );

};
