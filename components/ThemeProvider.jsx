'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

export default function ThemeProvider({ children }) {
  return (
    <NextThemesProvider attribute="data-theme" defaultTheme="system" enableSystem storageKey="ll_theme">
      {children}
    </NextThemesProvider>
  );
}
