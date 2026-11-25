import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { ActivePage, UserRole } from '../types';
import { UserPlus, AlertCircle, ArrowLeft } from 'lucide-react';

interface RegisterPageProps {
  onNavigate: (page: ActivePage) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [institution, setInstitution] = useState('');
  const [role, setRole] = useState<UserRole>('researcher');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: fullName.trim() });

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: fullName.trim() || 'Researcher',
        institution: institution.trim() || 'Independent Research',
        role: role,
        createdAt: new Date().toISOString(),
        analysesRun: 0
      });

      onNavigate('dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '40px auto', padding: '0 20px', width: '100%' }}>
      <button
        onClick={() => onNavigate('landing')}
        className="btn-secondary"
        style={{ marginBottom: '20px', fontSize: '0.85rem' }}
      >
        <ArrowLeft size={16} /> Back to Home
      </button>

      <div className="glass-panel" style={{ padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'var(--accent-cyan-glow)',
              color: 'var(--accent-cyan)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px'
            }}
          >
            <UserPlus size={24} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '700' }}>Lab Registration</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Create your verified BioLab credentials</p>
        </div>

        {error && (
          <div
            style={{
              padding: '12px',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--accent-rose)',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '18px'
            }}
          >
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Dr. Jane Doe"
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
              Institutional Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@university.edu"
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
              Organization / University
            </label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="e.g. Center for Genome Sciences"
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
              Scientific Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
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
            >
              <option value="student">Student / Learner</option>
              <option value="researcher">Researcher / Scientist</option>
              <option value="educator">Educator / Faculty</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Password (min. 6 characters)
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
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

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '8px', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Creating Lab Record...' : 'Complete Registration'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.82rem', color: 'var(--text-dim)' }}>
          Already have credentials?{' '}
          <span
            onClick={() => onNavigate('login')}
            style={{ color: 'var(--accent-cyan)', cursor: 'pointer', fontWeight: '600' }}
          >
            Sign In
          </span>
        </div>
      </div>
    </div>
  );
};
    
