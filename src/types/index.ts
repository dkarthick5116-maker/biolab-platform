export type Theme = 'dark' | 'light';

export type UserRole = 'student' | 'researcher' | 'educator' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  institution?: string;
  role: UserRole;
  createdAt: string;
  analysesRun: number;
}

export type ActivePage = 
  | 'landing'
  | 'login'
  | 'register'
  | 'dashboard'
  | 'dna'
  | 'rna'
  | 'protein'
  | 'fasta'
  | 'alignment'
  | 'database'
  | 'ncbi'
  | 'blast'
  | 'visualization'
  | 'workspace'
  | 'learning'
  | 'profile'
  | 'admin';

export interface NavItem {
  id: ActivePage;
  label: string;
  iconName: string;
  badge?: string;
  phase: number;
  requiresAuth?: boolean;
}

export interface MetricSummary {
  title: string;
  value: string;
  delta: string;
  status: 'positive' | 'neutral' | 'accent';
}

export interface LabActivity {
  id: string;
  type: 'DNA' | 'RNA' | 'PROTEIN' | 'BLAST' | 'ALIGNMENT';
  title: string;
  timestamp: string;
  status: 'Completed' | 'Queued' | 'Failed';
}
