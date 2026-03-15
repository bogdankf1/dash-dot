import type { Metadata, Viewport } from 'next';
import { Toaster } from 'sonner';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#6366f1',
};

export const metadata: Metadata = {
  title: 'Dash Dot — Learn Morse Code',
  description: 'A Duolingo-style Morse code learning app. Learn Morse code one letter at a time.',
  manifest: '/manifest.json',
  icons: [
    { rel: 'icon', url: '/icon-32x32.png', sizes: '32x32' },
    { rel: 'icon', url: '/icon-16x16.png', sizes: '16x16' },
    { rel: 'apple-touch-icon', url: '/icon-180x180.png', sizes: '180x180' },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'DashDot',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js'))}`,
          }}
        />
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: 'var(--surface)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
            },
          }}
        />
      </body>
    </html>
  );
}
