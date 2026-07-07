import BottomNav from '@/components/layout/BottomNav';
import AudioUnlock from '@/components/layout/AudioUnlock';
import InstallPrompt from '@/components/layout/InstallPrompt';
import TopBar from '@/components/layout/TopBar';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen pb-24" style={{ paddingBottom: 'max(6rem, env(safe-area-inset-bottom, 6rem))' }}>
      <AudioUnlock />
      <InstallPrompt />
      <TopBar />
      <main className="mx-auto max-w-lg px-4 py-6">
        {children}
      </main>
      <footer className="mx-auto flex max-w-lg justify-center px-4 pb-4">
        <a
          href="https://built-by-bohdan.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-(--text-muted) transition-colors hover:text-(--primary)"
        >
          Built by Bohdan
        </a>
      </footer>
      <BottomNav />
    </div>
  );
}
