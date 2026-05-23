export default function ProgressBar({ current, target, label, color = 'primary' }) {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  
  let colorClass = color;
  if (percentage >= 100) colorClass = 'success';
  else if (percentage >= 80) colorClass = 'primary';
  else if (percentage >= 50) colorClass = 'warning';
  else colorClass = 'danger';

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginBottom: '8px',
        fontSize: '14px'
      }}>
        <span style={{ fontWeight: '600' }}>{label}</span>
        <span>
          {Math.round(current)}/{Math.round(target)}g
          {' '}
          <span style={{ color: 'var(--text-secondary)' }}>
            ({Math.round(percentage)}%)
          </span>
        </span>
      </div>
      <div className="progress-bar">
        <div 
          className={`progress-bar-fill ${colorClass}`}
          style={{ width: `${percentage}%` }}
        >
          {percentage > 10 && `${Math.round(percentage)}%`}
        </div>
      </div>
    </div>
  );
}
