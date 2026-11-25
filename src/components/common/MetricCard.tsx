import React from 'react';
import { MetricSummary } from '../../types';

export const MetricCard: React.FC<MetricSummary> = ({ title, value, delta, status }) => {
  const getStatusColor = () => {
    if (status === 'positive') return 'var(--accent-emerald)';
    if (status === 'accent') return 'var(--accent-cyan)';
    return 'var(--text-dim)';
  };

  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
        {title}
      </p>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: '1.75rem', fontWeight: '700' }}>{value}</h3>
        <span style={{ fontSize: '0.78rem', color: getStatusColor(), fontWeight: '600' }}>
          {delta}
        </span>
      </div>
    </div>
  );
};
