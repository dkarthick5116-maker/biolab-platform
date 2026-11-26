import { collection, addDoc, doc, setDoc, increment, getDocs, query, orderBy, limit } from 'firebase/firestore';
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

  // Wrap the Firestore write in a 5-second timeout promise
  const savePromise = addDoc(userAnalysesRef, {
    ...record,
    timestamp: new Date().toISOString()
  });

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Save request timed out. Check Firestore rules.')), 6000)
  );

  const docRef = await Promise.race([savePromise, timeoutPromise]);

  // Non-blocking counter increment using merge to avoid missing document errors
  setDoc(userDocRef, { analysesRun: increment(1) }, { merge: true }).catch((err) => {
    console.warn('Could not increment analyses counter:', err);
  });

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
                             
