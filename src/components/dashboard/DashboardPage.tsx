import { AppShell } from "@/components/layout/AppShell";
import { QuickActions } from "./QuickActions";
import { RecentListings } from "./RecentListings";
import { StatsGrid } from "./StatsGrid";
import { WelcomeHeader } from "./WelcomeHeader";

export function DashboardPage() {
  return (
    <AppShell>
      <div className="w-full">
        <WelcomeHeader />
        <StatsGrid />
        <QuickActions />
        <RecentListings />
      </div>
    </AppShell>
  );
}
