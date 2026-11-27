import React, { useState } from 'react';
import { ActivePage } from '../types';
import { useAuth } from '../context/AuthContext';
import { saveAnalysisRun } from '../services/historyService';
import { exportAsFasta, exportAsJson } from '../services/exportService';
import { 
  ArrowLeft, 
  Sparkles, 
  Play, 
  RotateCcw, 
  AlertCircle, 
  Bookmark, 
  Check, 
  Download, 
  FileDown 
} from 'lucide-react';

interface ProteinAnalyzerPageProps {
  onNavigate: (page: ActivePage) => void;
}

interface ProteinAnalysisResult {
  sequence: string;
  length: number;
  molecular_weight: number;
  isoelectric_point: number;
  charge_at_ph_7_4: number;
  instability_index: number;
  stability_status: string;
  aromaticity: number;
  gravy: number;
  secondary_structure: {
    helix_percent: number;
    turn_percent: number;
    sheet_percent: number;
  };
  amino_acid_counts: Record<string, number>;
}

export const ProteinAnalyzerPage: React.FC<ProteinAnalyzerPageProps> = ({ onNavigate }) => {
  const { currentUser, refreshProfile } = useAuth();
  // Standard human insulin B chain sample
  const [sequence, setSequence] = useState('FVNQHLCGSHLVEALYLVCGERGFFYTPKT');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProteinAnalysisResult | null>(null);

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
      const response = await fetch('/api/analyze/protein', {
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
        module: 'Protein' as any,
        sequence: result.sequence,
        length: result.length,
        gcContent: result.isoelectric_point,
        secondaryMetric: {
          label: 'Isoelectric Point (pI)',
          value: result.isoelectric_point
        },
        summary: `Protein ${result.length} aa | MW: ${result.molecular_weight} Da | pI: ${result.isoelectric_point}`
      });
      setSavedSuccess(true);
      if (refreshProfile) {
        await refreshProfile();
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to record run in notebook.');
    } finally {
      setSaving(false);
    }
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
              background: 'linear-gradient(135deg, var(--accent-emerald) 0%, var(--accent-cyan) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#070B19'
            }}
          >
            <Sparkles size={26} strokeWidth={2.2} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>Protein Sequence Analyzer</h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Biopython ProtParam: molecular weight, isoelectric point, instability, and hydropathy.
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
              Input Amino Acid Sequence (1-Letter IUPAC Codes)
            </label>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              Residues: {sequence.replace(/\s+/g, '').length} aa
            </span>
          </div>

          <textarea
            rows={4}
            value={sequence}
            onChange={(e) => setSequence(e.target.value.toUpperCase())}
            placeholder="e.g. FVNQHLCGSHLVEALYLVCGERGFFYTPKT"
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
              <Play size={16} /> {loading ? 'Running ProtParam...' : 'Execute Analysis'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setSequence('FVNQHLCGSHLVEALYLVCGERGFFYTPKT');
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
              gap: '12px'
            }}
          >
            <div>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Analysis Complete
              </span>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Biopython ProtParam biochemical parameters verified.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() =>
                  exportAsFasta({
                    module: 'Protein' as any,
                    sequence: result.sequence,
                    length: result.length,
                    gc_content: result.isoelectric_point,
                    at_or_au_content: result.molecular_weight,
                    counts: result.amino_acid_counts,
                    reverse_complement: 'N/A',
                    derived_sequence: `MW=${result.molecular_weight}Da;pI=${result.isoelectric_point}`
                  })
                }
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '6px 12px' }}
              >
                <Download size={14} /> Export FASTA
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={() =>
                  exportAsJson({
                    module: 'Protein' as any,
                    sequence: result.sequence,
                    length: result.length,
                    gc_content: result.isoelectric_point,
                    at_or_au_content: result.molecular_weight,
                    counts: result.amino_acid_counts,
                    reverse_complement: 'N/A',
                    derived_sequence: `GRAVY=${result.gravy}`
                  })
                }
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '6px 12px' }}
              >
                <FileDown size={14} /> Export JSON
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
                  {savedSuccess ? 'Saved to Notebook' : saving ? 'Saving...' : 'Save to Notebook'}
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

          {/* Primary Biophysical Properties */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
            <div className="glass-panel" style={{ padding: '16px', background: 'var(--bg-surface-elevated)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>Molecular Weight</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                {result.molecular_weight.toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 400 }}>Da</span>
              </span>
            </div>

            <div className="glass-panel" style={{ padding: '16px', background: 'var(--bg-surface-elevated)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>Isoelectric Point (pI)</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                {result.isoelectric_point}
              </span>
            </div>

            <div className="glass-panel" style={{ padding: '16px', background: 'var(--bg-surface-elevated)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>Net Charge (pH 7.4)</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 700, color: result.charge_at_ph_7_4 >= 0 ? '#38bdf8' : '#f87171' }}>
                {result.charge_at_ph_7_4 > 0 ? `+${result.charge_at_ph_7_4}` : result.charge_at_ph_7_4}
              </span>
            </div>

            <div className="glass-panel" style={{ padding: '16px', background: 'var(--bg-surface-elevated)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>Instability Index</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 700, color: result.instability_index <= 40 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                {result.instability_index}
              </span>
              <span style={{ fontSize: '0.7rem', display: 'block', color: 'var(--text-muted)', marginTop: '2px' }}>
                {result.stability_status}
              </span>
            </div>
          </div>

          {/* Hydropathy & Secondary Structure */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '12px' }}>Hydropathy & Aromaticity</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>GRAVY Index</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, fontFamily: 'monospace' }}>
                    {result.gravy} {result.gravy > 0 ? '(Hydrophobic)' : '(Hydrophilic)'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Aromaticity Ratio</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--accent-violet)' }}>
                    {result.aromaticity}%
                  </span>
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '12px' }}>Predicted Secondary Structure</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center' }}>
                <div style={{ padding: '10px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Helix (H)</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                    {result.secondary_structure.helix_percent}%
                  </div>
                </div>
                <div style={{ padding: '10px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Turn (T)</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                    {result.secondary_structure.turn_percent}%
                  </div>
                </div>
                <div style={{ padding: '10px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Sheet (E)</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-violet)' }}>
                    {result.secondary_structure.sheet_percent}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Amino Acid Residue Composition */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '14px' }}>Residue Frequency (20 Standard Amino Acids)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(65px, 1fr))', gap: '8px', textAlign: 'center' }}>
              {Object.entries(result.amino_acid_counts).map(([aa, count]) => (
                <div
                  key={aa}
                  style={{
                    padding: '8px 4px',
                    background: count > 0 ? 'var(--bg-surface-elevated)' : 'rgba(255,255,255,0.02)',
                    borderRadius: 'var(--radius-sm)',
                    border: count > 0 ? '1px solid var(--border-subtle)' : 'none'
                  }}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: count > 0 ? 'var(--accent-cyan)' : 'var(--text-dim)', display: 'block' }}>
                    {aa}
                  </span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: count > 0 ? 'var(--text-main)' : 'var(--text-dim)' }}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
    
