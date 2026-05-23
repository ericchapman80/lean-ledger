export default function ErrorMessage({ error, onRetry }) {
  return (
    <div className="card" style={{ 
      borderLeft: '4px solid var(--danger-color)',
      backgroundColor: '#ffebee'
    }}>
      <h3 style={{ color: 'var(--danger-color)', marginBottom: '10px' }}>
        ⚠️ Error
      </h3>
      <p style={{ marginBottom: '16px' }}>{error}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-primary">
          Try Again
        </button>
      )}
    </div>
  );
}
