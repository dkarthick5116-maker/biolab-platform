import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signOut as fbSignOut 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { UserProfile } from '../types';
import { Dna, Loader2 } from 'lucide-react';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async (uid: string, fallbackEmail: string | null) => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setUserProfile(docSnap.data() as UserProfile);
      } else {
        const defaultProfile: UserProfile = {
          uid,
          email: fallbackEmail || '',
          displayName: fallbackEmail ? fallbackEmail.split('@')[0] : 'Researcher',
          institution: 'BioLab Research Lab',
          role: 'researcher',
          createdAt: new Date().toISOString(),
          analysesRun: 0
        };
        await setDoc(docRef, defaultProfile);
        setUserProfile(defaultProfile);
      }
    } catch (err) {
      console.warn('Firestore profile fetch skipped or delayed:', err);
    }
  };

  const refreshProfile = async () => {
    if (currentUser) {
      await fetchProfile(currentUser.uid, currentUser.email);
    }
  };

  useEffect(() => {
    // Safety fallback: prevent hanging indefinitely
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 2500);

    try {
      const unsubscribe = onAuthStateChanged(
        auth,
        async (user) => {
          clearTimeout(safetyTimer);
          setCurrentUser(user);
          if (user) {
            await fetchProfile(user.uid, user.email);
          } else {
            setUserProfile(null);
          }
          setLoading(false);
        },
        (error) => {
          console.warn('Firebase auth listener error:', error);
          clearTimeout(safetyTimer);
          setLoading(false);
        }
      );

      return () => {
        clearTimeout(safetyTimer);
        unsubscribe();
      };
    } catch (err) {
      console.warn('Firebase auth init error:', err);
      clearTimeout(safetyTimer);
      setLoading(false);
    }
  }, []);

  const logout = async () => {
    try {
      await fbSignOut(auth);
    } catch (err) {
      console.error('Logout error:', err);
    }
    setUserProfile(null);
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-base)',
          color: 'var(--text-main)',
          gap: '16px'
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-violet) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#070B19'
          }}
        >
          <Dna size={28} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          <Loader2 size={16} className="animate-spin" />
          <span>Connecting BioLab Core...</span>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, loading, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
