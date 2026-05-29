import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package,
  ListChecks,
  CalendarSync,
  BarChart3,
  Plus,
  ScanLine,
  UtensilsCrossed,
  Wallet,
  CalendarClock,
  Users,
  Mic,
  Shield,
  Wifi,
  WifiOff,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import { useApp, type FeatureControls } from "@/lib/store";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; icon: typeof Plus; feature?: keyof FeatureControls };

const mainNav: readonly NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/inventory", label: "Inventory", icon: Package },
  { to: "/shopping", label: "Shopping List", icon: ListChecks },
  { to: "/meals", label: "Meal Planner", icon: UtensilsCrossed, feature: "mealPlanner" },
  { to: "/insights", label: "Insights", icon: BarChart3 },
  { to: "/budget", label: "Budget", icon: Wallet, feature: "budgetForecasting" },
  { to: "/expiring", label: "Expiring Soon", icon: CalendarClock, feature: "expirationTracking" },
  { to: "/household", label: "Household", icon: Users, feature: "householdSharing" },
] as const;

const smartNav: readonly NavItem[] = [
  { to: "/predictions", label: "AI Predictions", icon: Sparkles, feature: "aiPredictions" },
  { to: "/rebuy", label: "Rebuy Tracker", icon: CalendarSync },
  { to: "/bulk", label: "Bulk Savings", icon: Wallet, feature: "bulkSavings" },
  { to: "/voice", label: "Voice Assistant", icon: Mic, feature: "voiceAssistant" },
  { to: "/privacy", label: "Privacy", icon: Shield },
] as const;


export function AppLayout({ children }: { children: ReactNode }) {
  const { online, household, settings } = useApp();
  const features = settings.features;
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const filterNav = (items: readonly NavItem[]) =>
    items.filter((n) => !n.feature || features[n.feature]);


  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-border bg-sidebar">
        <div className="px-6 py-6 flex items-center gap-2">
          <div className="size-9 rounded-2xl bg-primary text-primary-foreground grid place-items-center text-lg">🏡</div>
          <div>
            <div className="font-display text-lg font-bold leading-none">Stocked Up</div>
            <div className="text-xs text-muted-foreground mt-1">{online ? "Online" : "Offline"}</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-6 space-y-6">
          <NavSection items={filterNav(mainNav)} pathname={pathname} />
          {filterNav(smartNav).length > 0 && (
            <div>
              <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Smart Features
              </div>
              <NavSection items={filterNav(smartNav)} pathname={pathname} />
            </div>
          )}
        </nav>

        <div className="px-3 pb-6">
          <Link to="/household" className="card-soft p-3 flex items-center gap-3 hover:shadow-md transition-shadow">
            {household.length > 0 ? (
              <>
                <div className="flex -space-x-2">
                  {household.slice(0, 3).map((m) => (
                    <div
                      key={m.id}
                      className="size-7 rounded-full ring-2 ring-card grid place-items-center text-[11px] font-semibold text-white"
                      style={{ backgroundColor: m.avatarColor }}
                    >
                      {m.name[0]}
                    </div>
                  ))}
                </div>
                <div className="text-xs">
                  <div className="font-semibold">Your Household</div>
                  <div className="text-muted-foreground">
                    {household.length} {household.length === 1 ? "member" : "members"}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="size-8 rounded-full bg-primary-soft text-primary grid place-items-center text-sm">
                  🏠
                </div>
                <div className="text-xs">
                  <div className="font-semibold">Set up household</div>
                  <div className="text-muted-foreground">Add your first profile</div>
                </div>
              </>
            )}
          </Link>
        </div>

      </aside>

      {/* Main */}
      <div className="lg:pl-64">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 bg-background/85 backdrop-blur-md">
          <div className="grid grid-cols-[auto_1fr_auto] items-center px-4 h-14">
            <div
              className={cn(
                "px-2 h-7 rounded-full text-[11px] font-medium inline-flex items-center gap-1",
                online ? "bg-primary-soft text-primary" : "bg-warning/20 text-warning-foreground",
              )}
            >
              {online ? <Wifi className="size-3" /> : <WifiOff className="size-3" />}
              {online ? "Online" : "Offline"}
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-base">🌿</span>
              <span className="font-display font-bold tracking-tight">Stocked Up</span>
            </div>
            {features.barcodeScanner ? (
              <Link
                to="/scan"
                className="size-9 rounded-full bg-card border border-border grid place-items-center"
                aria-label="Scan"
              >
                <ScanLine className="size-4" />
              </Link>
            ) : (
              <span className="size-9" />
            )}

          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 lg:px-8 py-4 lg:py-10 pb-32 lg:pb-12">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 pb-[env(safe-area-inset-bottom)]">
        <div className="mx-3 mb-3 rounded-[28px] bg-card/95 backdrop-blur border border-border shadow-[0_8px_30px_-8px_rgba(0,0,0,0.18)] px-2 py-2 flex items-center justify-between relative">
          <NavBtn to="/" label="Home" Icon={LayoutDashboard} active={pathname === "/"} />
          <NavBtn to="/inventory" label="Inventory" Icon={Package} active={pathname.startsWith("/inventory")} />
          <Link
            to="/add"
            className="relative -mt-8 size-16 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-[0_10px_24px_-6px_oklch(0.4_0.1_148_/_0.55)] ring-[6px] ring-background active:scale-95 transition"
            aria-label="Add item"
          >
            <Plus className="size-7" strokeWidth={2.5} />
          </Link>
          <NavBtn to="/shopping" label="Lists" Icon={ListChecks} active={pathname.startsWith("/shopping")} />
          <NavBtn to="/settings" label="More" Icon={BarChart3} active={pathname.startsWith("/settings")} />
        </div>
      </nav>
    </div>
  );
}

function NavSection({
  items,
  pathname,
}: {
  items: readonly { to: string; label: string; icon: typeof Plus }[];
  pathname: string;
}) {
  return (
    <ul className="space-y-1">
      {items.map((n) => {
        const Icon = n.icon;
        const active = pathname === n.to || (n.to !== "/" && pathname.startsWith(n.to));
        return (
          <li key={n.to}>
            <Link
              to={n.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                active
                  ? "bg-primary-soft text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent",
              )}
            >
              <Icon className="size-4" />
              {n.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function NavBtn({
  to,
  label,
  Icon,
  active,
}: {
  to: string;
  label: string;
  Icon: typeof Plus;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-2xl text-[10px] font-semibold transition-colors",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      <Icon className="size-[22px]" strokeWidth={active ? 2.4 : 2} />
      {label}
    </Link>
  );
}
