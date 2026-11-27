import React, { useState, useRef } from 'react';
import { ActivePage } from '../types';
import { 
  ArrowLeft, 
  FileText, 
  Upload, 
  Play, 
  RotateCcw, 
  AlertCircle, 
  Layers, 
  Hash, 
  PieChart 
} from 'lucide-react';

interface FastaAnalyzerPageProps {
  onNavigate: (page: ActivePage) => void;
}

interface FastaRecord {
  id: string;
  description: string;
  length: number;
  type: string;
  sequence: string;
  metric_label: string;
  metric_value: string;
}

interface FastaAnalysisResult {
  record_count: number;
  total_length: number;
  avg_length: number;
  type_distribution: Record<string, number>;
  records: FastaRecord[];
}

const DEFAULT_SAMPLE_FASTA = `>NC_005816.1 Yersinia pestis plasmid pCD1, partial sequence
GAATTCGTCGACCACACAGGAGTAAGAATAATGACTACAGTATTTCTTGCTAATTATCGTTTTTTTTTTTT
>NM_000518.5 Homo sapiens hemoglobin subunit beta (HBB), mRNA
ACATTTGCTTCTGACACAACTGTGTTCACTAGCAACCTCAAACAGACACCATGGTGCATCTGACTCCTGAG
GAGAAGTCTGCCGTTACTGCCCTGTGGGGCAAGGTGAACGTGGATGAAGTTGGTGGTGAGGCCCTGGGCAG
>sp|P01308|INS_HUMAN Insulin precursor
MALWMRLLPLLALLALWGPDPAAAFVNQHLCGSHLVEALYLVCGERGFFYTPKTRREAEDLQVGQVELGGG
PGAGSLQPLALEGSLQKRGIVEQCCTSICSLYQLENYCN`;

export const FastaAnalyzerPage: React.FC<FastaAnalyzerPageProps> = ({ onNavigate }) => {
  const [fastaText, setFastaText] = useState(DEFAULT_SAMPLE_FASTA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FastaAnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('File size exceeds the 2MB limit for client parsing.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setFastaText(content);
        setError(null);
        setResult(null);
      }
    };
    reader.onerror = () => {
      setError('Failed to read the selected file.');
    };
    reader.readAsText(file);
  };

  const handleAnalyze = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!fastaText.trim() || loading) return;

    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/analyze/fasta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ fasta_content: fastaText.trim() })
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
      setError(err.message || 'Error processing FASTA batch.');
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'DNA':
        return 'var(--accent-cyan)';
      case 'RNA':
        return 'var(--accent-violet)';
      case 'Protein':
        return 'var(--accent-emerald)';
      default:
        return 'var(--text-dim)';
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
              background: 'linear-gradient(135deg, var(--accent-amber, #f59e0b) 0%, var(--accent-rose) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}
          >
            <FileText size={26} strokeWidth={2.2} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>FASTA File Analyzer</h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Multi-record parser: header extraction, sequence type classification, and batch metrics.
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

      {/* Input / Upload Panel */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
          <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Paste Multi-Record FASTA or Upload File (.fasta, .fa, .fna, .faa, .txt)
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".fasta,.fa,.fna,.faa,.txt"
              onChange={handleFileUpload}
            />
            <button
              type="button"
              className="btn-secondary"
              onClick={() => fileInputRef.current?.click()}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', padding: '6px 12px' }}
            >
              <Upload size={14} /> Upload File
            </button>
          </div>
        </div>

        <textarea
          rows={6}
          value={fastaText}
          onChange={(e) => setFastaText(e.target.value)}
          placeholder=">Sequence_1 Description&#10;ATGC...&#10;>Sequence_2 Description&#10;MALW..."
          style={{
            width: '100%',
            padding: '12px',
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            letterSpacing: '0.5px',
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
            disabled={loading || !fastaText.trim()}
            onClick={handleAnalyze}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Play size={16} /> {loading ? 'Parsing Records...' : 'Parse Multi-FASTA'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setFastaText(DEFAULT_SAMPLE_FASTA);
              setResult(null);
              setError(null);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <RotateCcw size={16} /> Reset Sample
          </button>
        </div>
      </div>

      {/* Results View */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Summary Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
            <div className="glass-panel" style={{ padding: '16px', background: 'var(--bg-surface-elevated)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                <Layers size={14} /> Total Records
              </div>
              <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                {result.record_count}
              </span>
            </div>

            <div className="glass-panel" style={{ padding: '16px', background: 'var(--bg-surface-elevated)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                <Hash size={14} /> Total Residues/Bases
              </div>
              <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                {result.total_length.toLocaleString()}
              </span>
            </div>

            <div className="glass-panel" style={{ padding: '16px', background: 'var(--bg-surface-elevated)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                <PieChart size={14} /> Mean Sequence Length
              </div>
              <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-violet)' }}>
                {result.avg_length}
              </span>
            </div>
          </div>

          {/* Type Distribution */}
          <div className="glass-panel" style={{ padding: '16px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
              Identified Sequence Types
            </span>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {Object.entries(result.type_distribution).map(([type, count]) => (
                <div
                  key={type}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span style={{ fontWeight: 700, color: getTypeColor(type), fontSize: '0.85rem' }}>
                    {type}
                  </span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-main)' }}>
                    {count} {count === 1 ? 'record' : 'records'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Records List */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, margin: '0 0 14px 0' }}>
              Extracted FASTA Records ({result.records.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {result.records.map((rec, index) => (
                <div
                  key={index}
                  style={{
                    padding: '14px',
                    background: 'var(--bg-surface-elevated)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ flex: 1, minWidth: '220px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            color: getTypeColor(rec.type)
                          }}
                        >
                          {rec.type}
                        </span>
                        <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)', fontFamily: 'monospace' }}>
                          {rec.id}
                        </span>
                      </div>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {rec.description}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '14px', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                      <div>
                        Length: <strong style={{ color: 'var(--text-main)' }}>{rec.length}</strong>
                      </div>
                      <div>
                        {rec.metric_label}: <strong style={{ color: 'var(--accent-cyan)' }}>{rec.metric_value}</strong>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: '10px',
                      padding: '8px',
                      background: 'rgba(0, 0, 0, 0.25)',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      fontSize: '0.78rem',
                      color: 'var(--text-muted)',
                      wordBreak: 'break-all'
                    }}
                  >
                    {rec.sequence}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
    
