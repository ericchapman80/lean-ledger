'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

const OPTIONS = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div
      style={{
        display: 'inline-flex',
        gap: '2px',
        background: 'var(--surface-muted)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '3px',
      }}
      role="radiogroup"
      aria-label="Color theme"
    >
      {OPTIONS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          onClick={() => setTheme(value)}
          style={{
            padding: '4px 10px',
            fontSize: '12px',
            fontWeight: theme === value ? 700 : 400,
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            background: theme === value ? 'var(--card-background)' : 'transparent',
            color: theme === value ? 'var(--text-primary)' : 'var(--text-secondary)',
            boxShadow: theme === value ? 'var(--shadow)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
