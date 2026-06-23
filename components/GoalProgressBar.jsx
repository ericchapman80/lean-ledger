'use client';

export default function GoalProgressBar({ label, percent, color, helper }) {
  const safePercent = percent == null ? 0 : Math.max(0, Math.min(100, Number(percent)));

  return (
    <div style={{ display: 'grid', gap: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '13px' }}>
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <strong>{percent == null ? 'No trend yet' : `${Math.round(safePercent)}%`}</strong>
      </div>
      <div className="progress-bar" aria-label={label}>
        <div
          className="progress-bar-fill"
          style={{
            width: `${safePercent}%`,
            backgroundColor: color,
          }}
        />
      </div>
      {helper ? (
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '12px' }}>{helper}</p>
      ) : null}
    </div>
  );
}
