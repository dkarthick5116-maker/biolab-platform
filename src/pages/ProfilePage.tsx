import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ActivePage } from '../types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { User, CheckCircle2 } from 'lucide-react';

interface ProfilePageProps {
  onNavigate: (page: ActivePage) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const { userProfile, currentUser, refreshProfile, logout } = useAuth();
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [institution, setInstitution] = useState(userProfile?.institution || '');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        displayName: displayName.trim(),
        institution: institution.trim()
      });
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    onNavigate('landing');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '30px auto', padding: '0 20px', width: '100%' }}>
      <div className="glass-panel" style={{ padding: '28px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-violet) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF'
              }}
            >
              <User size={30} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem' }}>{userProfile?.displayName || 'Active Researcher'}</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{currentUser?.email}</p>
            </div>
          </div>

          <button onClick={handleLogout} className="btn-secondary" style={{ color: 'var(--accent-rose)', borderColor: 'rgba(244, 63, 94, 0.3)' }}>
            Sign Out
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '28px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '20px' }}>Researcher Record</h3>

        {saved && (
          <div
            style={{
              padding: '12px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--accent-emerald)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px'
            }}
          >
            <CheckCircle2 size={16} /> Profile record updated successfully.
          </div>
        )}

        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Full Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-main)',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Research Institution
            </label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-main)',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginTop: '6px' }}>
            <div className="glass-panel" style={{ padding: '14px', background: 'var(--bg-surface-elevated)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>Scientific Role</span>
              <span style={{ fontWeight: '600', textTransform: 'capitalize' }}>{userProfile?.role || 'Researcher'}</span>
            </div>
            <div className="glass-panel" style={{ padding: '14px', background: 'var(--bg-surface-elevated)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>Analyses Executed</span>
              <span style={{ fontWeight: '600' }}>{userProfile?.analysesRun || 0}</span>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ marginTop: '12px', alignSelf: 'flex-start' }}
          >
            {loading ? 'Saving Changes...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};
