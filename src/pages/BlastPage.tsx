import React, { useState } from 'react';
import { ActivePage } from '../types';
import { 
  ArrowLeft, 
  Search, 
  AlertCircle, 
  RotateCcw, 
  CheckCircle2, 
  Copy, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';

interface BlastPageProps {
  onNavigate: (page: ActivePage) => void;
}

interface BlastHit {
  accession: string;
  title: string;
  length: number;
  e_value: number;
  bit_score: number;
  score: number;
  identities: number;
  align_length: number;
  identity_percent: number;
  gaps: number;
  query_alignment: string;
  match_line: string;
  sbjct_alignment: string;
}

interface BlastResultData {
  program: string;
  database: string;
  query_length: number;
  total_hits: number;
  hits: BlastHit[];
}

const SAMPLE_NUCLEOTIDE = 'AGCTTTTCATTCTGACTGCAACGGGCAATATGTCTCTGTGTGGATTAAAAAAAGAGTGTCTGATAGCAGC';
const SAMPLE_PROTEIN = 'MALWMRLLPLLALLALWGPDPAAAFVNQHLCGSHLVEALYLVCGERGFFYTPKTR';

export const BlastPage: React.FC<BlastPageProps> = ({ onNavigate }) => {
  const [sequence, setSequence] = useState<string>(SAMPLE_NUCLEOTIDE);
  const [program, setProgram] = useState<'blastn' | 'blastp'>('blastn');
  const [database, setDatabase] = useState<string>('nt');
  const [expect, setExpect] = useState<number>(10.0);
  const [hitlistSize, setHitlistSize] = useState<number>(10);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BlastResultData | null>(null);
  const [expandedHit, setExpandedHit] = useState<number | null>(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleProgramChange = (newProg: 'blastn' | 'blastp') => {
    setProgram(newProg);
    if (newProg === 'blastn') {
      setSequence(SAMPLE_NUCLEOTIDE);
      setDatabase('nt');
    } else {
      setSequence(SAMPLE_PROTEIN);
      setDatabase('swissprot');
    }
    setResult(null);
    setError(null);
  };

  const handleRunBlast = async () => {
    const cleanSeq = sequence.trim().toUpperCase();
    if (!cleanSeq) {
      setError('Please provide a query sequence.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/blast/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sequence: cleanSeq,
          program,
          database,
          expect,
          hitlist_size: hitlistSize
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || data.message || `BLAST job error (${response.status})`);
      }

      setResult(data.data || data);
      if (data.data?.hits?.length > 0) {
        setExpandedHit(0);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred while communicating with NCBI BLAST.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAccession = (acc: string, index: number) => {
    navigator.clipboard.writeText(acc);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
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

      {/* Header */}
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
            <Search size={26} strokeWidth={2.2} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>NCBI BLAST Homology Search</h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Remote execution via Bio.Blast.NCBIWWW and automated NCBIXML alignment parsing.
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

      {/* Search Configuration */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          <button
            type="button"
            className={program === 'blastn' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => handleProgramChange('blastn')}
            style={{ fontSize: '0.85rem' }}
          >
            blastn (Nucleotide)
          </button>
          <button
            type="button"
            className={program === 'blastp' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => handleProgramChange('blastp')}
            style={{ fontSize: '0.85rem' }}
          >
            blastp (Protein)
          </button>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Query Sequence ({program === 'blastn' ? 'DNA/RNA' : 'Amino Acids'})
            </label>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              {sequence.replace(/\s+/g, '').length} residues
            </span>
          </div>
          <textarea
            rows={4}
            value={sequence}
            onChange={(e) => setSequence(e.target.value.toUpperCase())}
            placeholder="Paste sequence characters..."
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

        {/* Database & Thresholds */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
              Target Database
            </label>
            <select
              value={database}
              onChange={(e) => setDatabase(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-main)',
                fontSize: '0.82rem'
              }}
            >
              {program === 'blastn' ? (
                <>
                  <option value="nt">nt (Standard Nucleotide)</option>
                  <option value="refseq_select_rna">RefSeq Select RNA</option>
                </>
              ) : (
                <>
                  <option value="swissprot">UniProtKB / Swiss-Prot (Curated)</option>
                  <option value="nr">nr (Non-redundant Protein)</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
              E-Value Cutoff: {expect}
            </label>
            <input
              type="range"
              min="0.001"
              max="20"
              step="0.5"
              value={expect}
              onChange={(e) => setExpect(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
              Max Target Hits: {hitlistSize}
            </label>
            <input
              type="range"
              min="5"
              max="25"
              step="5"
              value={hitlistSize}
              onChange={(e) => setHitlistSize(parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-primary"
            disabled={loading || !sequence.trim()}
            onClick={handleRunBlast}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Search size={16} /> {loading ? 'Submitting to NCBI BLAST...' : 'Execute Remote BLAST'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => handleProgramChange(program)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <RotateCcw size={16} /> Reset
          </button>
        </div>
      </div>

      {/* Results View */}
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
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                BLAST Search Completed: {result.total_hits} Homologous Hits Found
              </span>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Program: {result.program.toUpperCase()} | Database: {result.database} | Query: {result.query_length} residues
              </p>
            </div>
          </div>

          {result.hits.length === 0 ? (
            <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No homologous sequences found within the specified E-value cutoff.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {result.hits.map((hit, idx) => (
                <div key={hit.accession + idx} className="glass-panel" style={{ padding: '16px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      cursor: 'pointer',
                      gap: '12px'
                    }}
                    onClick={() => setExpandedHit(expandedHit === idx ? null : idx)}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                          {hit.accession}
                        </span>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'rgba(56, 189, 248, 0.15)',
                            color: 'var(--accent-cyan)'
                          }}
                        >
                          Bit Score: {hit.bit_score}
                        </span>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: 'var(--accent-emerald)'
                          }}
                        >
                          Identity: {hit.identity_percent}%
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                          E: {hit.e_value < 0.0001 ? hit.e_value.toExponential(2) : hit.e_value}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
                        {hit.title}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyAccession(hit.accession, idx);
                        }}
                      >
                        {copiedIndex === idx ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                      </button>
                      {expandedHit === idx ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>

                  {/* Alignment snippet */}
                  {expandedHit === idx && (
                    <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '8px' }}>
                        <span>Identities: {hit.identities}/{hit.align_length} ({hit.identity_percent}%)</span>
                        <span>Gaps: {hit.gaps}</span>
                      </div>
                      <div
                        style={{
                          padding: '12px',
                          background: '#040711',
                          borderRadius: 'var(--radius-sm)',
                          fontFamily: 'Consolas, monospace',
                          fontSize: '0.8rem',
                          lineHeight: 1.4,
                          overflowX: 'auto',
                          whiteSpace: 'pre',
                          color: '#e2e8f0'
                        }}
                      >
{`Query  1  ${hit.query_alignment}  ${hit.align_length}
          ${hit.match_line}
Sbjct  1  ${hit.sbjct_alignment}  ${hit.align_length}`}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
    
