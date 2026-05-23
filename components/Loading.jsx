export default function Loading({ message = 'Loading...' }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <div className="spinner"></div>
      <p style={{ marginTop: '20px', color: 'var(--text-secondary)' }}>{message}</p>
    </div>
  );
}
