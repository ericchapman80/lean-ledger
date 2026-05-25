import { getProgressSemantics } from '@/lib/dashboardProgress';

export default function MacroCard({ label, current, target, icon, macroKey, dietStyle }) {
  const progress = getProgressSemantics({ macroKey, current, target, dietStyle });
  const secondaryLabel = progress.overBy > 0
    ? (macroKey === 'protein' ? 'Above target by' : 'Over by')
    : 'Status';

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ fontSize: '32px', marginRight: '12px' }}>{icon}</div>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px' }}>{label}</h3>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
            {progress.icon} {progress.stateLabel}
          </p>
        </div>
      </div>

      <div className="progress-bar" style={{ height: '8px', marginBottom: '12px' }}>
        <div
          className={`progress-bar-fill ${progress.className}`}
          style={{
            width: `${progress.cappedPercentage}%`,
            backgroundColor: progress.colorVar,
          }}
        />
      </div>

      <div style={{ display: 'grid', gap: '4px', fontSize: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
          <span>{progress.ratioLabel}</span>
          <span>{progress.percentage}%</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-secondary)' }}>{secondaryLabel}</span>
          <strong style={{ color: progress.colorVar }}>{progress.amountLabel}</strong>
        </div>
      </div>
    </div>
  );
}
