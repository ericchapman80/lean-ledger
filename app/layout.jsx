import './globals.css';
import Header from '@/components/Header';
import { isAuthEnabled } from '@/lib/authConfig';
import { Toaster } from 'sonner';

export const metadata = {
  title: 'Lean Ledger',
  description: 'Personal macro accountability ledger',
};

export default function RootLayout({ children }) {
  const authEnabled = isAuthEnabled(process.env);

  return (
    <html lang="en">
      <body>
        <div className="app">
          <Header authEnabled={authEnabled} />
          <main>{children}</main>
        </div>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
