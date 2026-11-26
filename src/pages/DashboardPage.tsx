import React, { useEffect, useState } from 'react';
import { ActivePage } from '../types';
import { useAuth } from '../context/AuthContext';
import { fetchRecentAnalyses, AnalysisRecord } from '../services/historyService';
import { 
  Dna, 
  Activity, 
  Database, 
  FileText, 
  Sparkles, 
  Search, 
  Layers 
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (page: ActivePage) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { currentUser, userProfile } = useAuth();
  const [recentRuns, setRecentRuns] = useState<AnalysisRecord[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setLoadingRuns(true);
      fetchRecentAnalyses(currentUser.uid, 5)
        .then(setRecentRuns)
        .finally(() => setLoadingRuns(false));
    }
  }, [currentUser]);

  const modules = [
    {
      id: 'dna' as ActivePage,
      title: 'DNA Sequence Analyzer',
      desc: 'GC content, base frequencies, reverse complements, and Biopython transcription.',
      icon: Dna,
      badge: 'Live',
      badgeColor: 'var(--accent-emerald)',
      gradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)'
    },
    {
      id: 'rna' as ActivePage,
      title: 'RNA Sequence Analyzer',
      desc: 'AU/GC ratio, reverse transcription to cDNA, and standard codon translation.',
      icon: Activity,
      badge: 'Live',
      badgeColor: 'var(--accent-emerald)',
      gradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(244, 63, 94, 0.2) 100%)'
    },
    {
      id: 'protein' as ActivePage,
      title: 'Protein Sequence Analyzer',
      desc: 'Molecular weight, isoelectric point (pI), aromaticity, and instability index.',
      icon: Sparkles,
      badge: 'Phase 4',
      badgeColor: 'var(--accent-cyan)',
      gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)'
    },
    {
      id: 'fasta' as ActivePage,
      title: 'FASTA File Analyzer',
      desc: 'Multi-record parser with header detection and batch sequence metrics.',
      icon: FileText,
      badge: 'Phase 4',
      badgeColor: 'var(--accent-cyan)',
      gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(244, 63, 94, 0.2) 100%)'
    },
    {
      id: 'ncbi' as ActivePage,
      title: 'NCBI Database Explorer',
      desc: 'Direct Entrez API querying for GenBank accession records and publications.',
      icon: Database,
      badge: 'Phase 5',
      badgeColor: 'var(--text-dim)',
      gradient: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)'
    },
    {
      id: 'blast' as ActivePage,
      title: 'BLAST Alignment Tool',
      desc: 'Basic Local Alignment Search Tool for pairwise and local homology search.',
      icon: Search,
      badge: 'Phase 6',
      badgeColor: 'var(--text-dim)',
      gradient: 'linear-gradient(135deg, rgba(244, 63, 94, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)'
    }
  ];

  return (
    <div style={{ maxWidth: '1100px', margin: '24px auto', padding: '0 16px', width: '100%' }}>
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '28px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--accent-emerald)'
                }}
              />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-emerald)', letterSpacing: '0.5px' }}>
                COMPUTATIONAL CORE ONLINE
              </span>
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0 0 6px 0' }}>
              Welcome back, {userProfile?.displayName || 'Researcher'}
            </h1>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              {userProfile?.institution || 'BioLab Bioinformatics Laboratory'} • Select a module to begin scientific sequence computing.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ padding: '12px 18px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Analyses Run</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                {userProfile?.analysesRun || recentRuns.length || 0}
              </div>
            </div>
            <div style={{ padding: '12px 18px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Core Pipeline</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-emerald)', marginTop: '4px' }}>
                Biopython
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Module Selection Grid */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '14px' }}>Analytical Engines</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <div
              key={mod.id}
              onClick={() => onNavigate(mod.id)}
              className="glass-panel"
              style={{
                padding: '20px',
                cursor: 'pointer',
                transition: 'transform 0.15s ease, border-color 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: mod.gradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-main)'
                    }}
                  >
                    <Icon size={20} />
                  </div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.06)',
                      color: mod.badgeColor
                    }}
                  >
                    {mod.badge}
                  </span>
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 6px 0' }}>{mod.title}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                  {mod.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Analysis Notebook */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '14px' }}>Recent Notebook Computations</h2>
      <div className="glass-panel" style={{ padding: '20px' }}>
        {loadingRuns ? (
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', margin: 0 }}>Loading research history...</p>
        ) : recentRuns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-dim)' }}>
            <Layers size={32} style={{ opacity: 0.5, marginBottom: '8px' }} />
            <p style={{ fontSize: '0.85rem', margin: 0 }}>
              No saved runs yet. Execute a sequence analysis in the DNA or RNA modules and click "Save to Lab Notebook".
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentRuns.map((run) => (
              <div
                key={run.id}
                style={{
                  padding: '12px 16px',
                  background: 'var(--bg-surface-elevated)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: run.module === 'DNA' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(139, 92, 246, 0.2)',
                        color: run.module === 'DNA' ? 'var(--accent-cyan)' : 'var(--accent-violet)'
                      }}
                    >
                      {run.module}
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, fontFamily: 'monospace' }}>
                      {run.sequence.length > 20 ? `${run.sequence.substring(0, 20)}...` : run.sequence}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Length: {run.length} | GC: {run.gcContent}% | {run.secondaryMetric.label}: {run.secondaryMetric.value}%
                  </div>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                  {new Date(run.timestamp).toLocaleDateString()} {new Date(run.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
                        
