import { getProgressSemantics } from '@/lib/dashboardProgress';

export default function ProgressBar({ current, target, label, macroKey, dietStyle }) {
  const progress = getProgressSemantics({ macroKey, current, target, dietStyle });

  return (
    <div style={{ marginBottom: '16px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '8px',
          fontSize: '14px',
          gap: '12px',
        }}
      >
        <span style={{ fontWeight: '600' }}>{label}</span>
        <span style={{ textAlign: 'right' }}>
          {progress.ratioLabel}
          {' '}
          <span style={{ color: 'var(--text-secondary)' }}>
            ({progress.overBy > 0 ? progress.amountLabel : `${progress.percentage}%`})
          </span>
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '6px',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          gap: '12px',
        }}
      >
        <span>{progress.icon} {progress.stateLabel}</span>
        <span>{progress.overBy > 0 ? `${progress.percentage}%` : progress.amountLabel}</span>
      </div>
      <div className="progress-bar">
        <div
          className={`progress-bar-fill ${progress.className}`}
          style={{ width: `${progress.cappedPercentage}%`, backgroundColor: progress.colorVar }}
        >
          {progress.cappedPercentage > 10 && `${progress.percentage}%`}
        </div>
      </div>
    </div>
  );
}
