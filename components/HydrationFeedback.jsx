function getHydrationFeedbackStyles(tone) {
  if (tone === 'positive') {
    return {
      background: 'rgba(46, 125, 50, 0.08)',
      border: '1px solid rgba(46, 125, 50, 0.2)',
      labelColor: 'var(--success-color)',
    };
  }

  return {
    background: 'rgba(2, 119, 189, 0.08)',
    border: '1px solid rgba(2, 119, 189, 0.18)',
    labelColor: 'var(--primary-color)',
  };
}

export default function HydrationFeedback({ feedback, style = null }) {
  if (!feedback) return null;

  const styles = getHydrationFeedbackStyles(feedback.tone);

  return (
    <div
      style={{
        padding: '10px 12px',
        borderRadius: '12px',
        background: styles.background,
        border: styles.border,
        ...style,
      }}
    >
      <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 700, color: styles.labelColor, letterSpacing: '0.02em' }}>
        💡 {feedback.shortLabel}
      </p>
      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
        {feedback.message}
      </p>
    </div>
  );
}
