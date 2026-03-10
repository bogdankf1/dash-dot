import BottomNav from '@/components/layout/BottomNav';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen pb-20">
      <main className="mx-auto max-w-lg px-4 py-6">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
