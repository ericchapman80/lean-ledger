'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { profilesApi } from '@/lib/api';

export default function ProfileSwitcher() {
  const [profiles, setProfiles] = useState([]);
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    let cancelled = false;
    profilesApi.getProfiles()
      .then((rows) => { if (!cancelled) setProfiles(Array.isArray(rows) ? rows : []); })
      .catch(() => { if (!cancelled) setProfiles([]); });
    return () => { cancelled = true; };
  }, []);

  if (profiles.length === 0) return null;

  const active = profiles.find((p) => p.isActive) || profiles.find((p) => p.isPrimary) || profiles[0];

  async function switchTo(id) {
    if (id === active?.id || switching) { setOpen(false); return; }
    setSwitching(true);
    try {
      await profilesApi.activateProfile(id);
      // A full reload re-scopes every page to the newly active profile.
      window.location.reload();
    } catch {
      setSwitching(false);
      setOpen(false);
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={switching}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'var(--card-background)', border: '1px solid var(--border-color)',
          borderRadius: '999px', padding: '6px 12px', cursor: 'pointer',
          color: 'var(--text-primary)', fontSize: '14px', maxWidth: '200px',
        }}
      >
        <span aria-hidden="true">👤</span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {switching ? 'Switching…' : (active?.name || 'Profile')}
        </span>
        <span aria-hidden="true">▾</span>
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 50,
            minWidth: '220px', maxWidth: 'calc(100vw - 16px)', background: 'var(--card-background)',
            border: '1px solid var(--border-color)', borderRadius: '12px',
            boxShadow: 'var(--shadow)', overflow: 'hidden',
          }}
        >
          <div style={{ padding: '8px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            Viewing as
          </div>
          {profiles.map((p) => (
            <button
              key={p.id}
              type="button"
              role="menuitemradio"
              aria-checked={p.id === active?.id}
              onClick={() => switchTo(p.id)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
                width: '100%', textAlign: 'left', padding: '10px 14px',
                background: p.id === active?.id ? 'var(--background)' : 'transparent',
                border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '14px',
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.name}{p.isPrimary ? ' (you)' : ''}
              </span>
              {p.id === active?.id && <span aria-hidden="true">✓</span>}
            </button>
          ))}
          <div style={{ borderTop: '1px solid var(--border-color)' }}>
            <Link
              href="/household"
              onClick={() => setOpen(false)}
              style={{ display: 'block', padding: '10px 14px', fontSize: '14px', color: 'var(--primary-color)' }}
            >
              Manage profiles →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
