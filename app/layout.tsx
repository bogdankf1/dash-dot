import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dash Dot — Learn Morse Code',
  description: 'A Duolingo-style Morse code learning app. Learn Morse code one letter at a time.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
