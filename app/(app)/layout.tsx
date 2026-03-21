import BottomNav from '@/components/layout/BottomNav';
import AudioUnlock from '@/components/layout/AudioUnlock';
import InstallPrompt from '@/components/layout/InstallPrompt';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen pb-24" style={{ paddingBottom: 'max(6rem, env(safe-area-inset-bottom, 6rem))' }}>
      <AudioUnlock />
      <InstallPrompt />
      <main className="mx-auto max-w-lg px-4 py-6">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
