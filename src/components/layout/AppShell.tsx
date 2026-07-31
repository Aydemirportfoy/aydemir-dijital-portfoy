import { MobileNav } from "./MobileNav";
import { Sidebar } from "./Sidebar";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-full bg-cream">
      <Sidebar />
      <div className="flex min-h-full flex-1 flex-col">
        <main className="flex-1 px-5 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-7 sm:px-7 lg:mx-auto lg:w-full lg:max-w-6xl lg:px-10 lg:pb-12 lg:pt-12">
          {children}
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
