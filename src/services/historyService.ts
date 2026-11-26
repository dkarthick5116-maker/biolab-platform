import { collection, addDoc, doc, updateDoc, increment, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';

export interface AnalysisRecord {
  id?: string;
  module: 'DNA' | 'RNA';
  sequence: string;
  length: number;
  gcContent: number;
  secondaryMetric: {
    label: string;
    value: number;
  };
  summary: string;
  timestamp: string;
}

export const saveAnalysisRun = async (
  uid: string,
  record: Omit<AnalysisRecord, 'id' | 'timestamp'>
): Promise<string> => {
  const userAnalysesRef = collection(db, 'users', uid, 'analyses');
  const userDocRef = doc(db, 'users', uid);

  // 1. Add record to subcollection
  const docRef = await addDoc(userAnalysesRef, {
    ...record,
    timestamp: new Date().toISOString()
  });

  // 2. Increment user profile counter
  try {
    await updateDoc(userDocRef, {
      analysesRun: increment(1)
    });
  } catch (err) {
    console.warn('Could not increment analyses counter:', err);
  }

  return docRef.id;
};

export const fetchRecentAnalyses = async (uid: string, maxItems: number = 5): Promise<AnalysisRecord[]> => {
  try {
    const userAnalysesRef = collection(db, 'users', uid, 'analyses');
    const q = query(userAnalysesRef, orderBy('timestamp', 'desc'), limit(maxItems));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<AnalysisRecord, 'id'>)
    }));
  } catch (err) {
    console.warn('Error fetching recent analyses:', err);
    return [];
  }
};
