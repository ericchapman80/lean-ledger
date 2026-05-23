export default function MacroCard({ label, current, target, icon, color }) {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const remaining = Math.max(target - current, 0);

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ 
          fontSize: '32px', 
          marginRight: '12px',
          filter: `hue-rotate(${color}deg)`
        }}>
          {icon}
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px' }}>{label}</h3>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
            {Math.round(remaining)}g remaining
          </p>
        </div>
      </div>
      <div className="progress-bar" style={{ height: '8px' }}>
        <div 
          className="progress-bar-fill"
          style={{ 
            width: `${percentage}%`,
            backgroundColor: color
          }}
        />
      </div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        marginTop: '12px',
        fontSize: '14px',
        color: 'var(--text-secondary)'
      }}>
        <span>{Math.round(current)}g</span>
        <span>{Math.round(target)}g</span>
      </div>
    </div>
  );
}
