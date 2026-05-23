import './globals.css';
import Header from '@/components/Header';

export const metadata = {
  title: 'Lean Ledger',
  description: 'Personal macro accountability ledger',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="app">
          <Header />
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
