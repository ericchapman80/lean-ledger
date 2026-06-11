function getHydrationFeedbackStyles(tone) {
  if (tone === 'positive') {
    return {
      background: 'var(--feedback-positive-surface)',
      border: '1px solid var(--feedback-positive-border)',
      labelColor: 'var(--success-color)',
    };
  }

  return {
    background: 'var(--feedback-info-surface)',
    border: '1px solid var(--feedback-info-border)',
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
