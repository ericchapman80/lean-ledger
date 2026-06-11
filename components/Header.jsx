'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ProfileSwitcher from '@/components/ProfileSwitcher';
import ThemeToggle from '@/components/ThemeToggle';

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) => (pathname === path ? 'active' : '');
  const closeMenu = () => setMenuOpen(false);

  return (
    <header>
      <div className="container">
        <nav>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, color: 'var(--primary-color)' }}>📒 Lean Ledger</h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ThemeToggle />
              <ProfileSwitcher />

              <button
                onClick={() => setMenuOpen(!menuOpen)}
              style={{
                display: 'none',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '8px',
                color: 'var(--text-primary)',
              }}
              className="mobile-menu-btn"
              aria-label="Toggle menu"
            >
              {menuOpen ? '✕' : '☰'}
              </button>
            </div>
          </div>

          <ul className={menuOpen ? 'nav-open' : ''}>
            <li><Link href="/" className={isActive('/')} onClick={closeMenu}>Dashboard</Link></li>
            <li><Link href="/meals" className={isActive('/meals')} onClick={closeMenu}>Intake</Link></li>
            <li><Link href="/weight" className={isActive('/weight')} onClick={closeMenu}>Weight</Link></li>
            <li><Link href="/trends" className={isActive('/trends')} onClick={closeMenu}>Trends</Link></li>
            <li><Link href="/profile" className={isActive('/profile') || isActive('/login')} onClick={closeMenu}>Profile</Link></li>
          </ul>
        </nav>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn { display: block !important; }
          header nav ul {
            display: ${menuOpen ? 'flex' : 'none'};
            flex-direction: column;
            width: 100%;
            gap: 0;
            margin-top: 12px;
            background: var(--card-background);
            border-radius: 8px;
            overflow: hidden;
            box-shadow: var(--shadow);
          }
          header nav ul.nav-open { display: flex; }
          header nav ul li { width: 100%; border-bottom: 1px solid var(--border-color); }
          header nav ul li:last-child { border-bottom: none; }
          header nav a { width: 100%; padding: 16px; border-radius: 0; }
        }
        @media (min-width: 769px) {
          header nav ul { display: flex !important; margin-top: 0; }
        }
      `}</style>
    </header>
  );
}
