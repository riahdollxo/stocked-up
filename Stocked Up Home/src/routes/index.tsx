import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  Bell,
  Calendar,
  CalendarSync,
  ChevronRight,
  ListChecks,
  Package,
  Plus,
  ScanLine,
  Sparkles,
  TrendingDown,
} from "lucide-react";
import { useApp, daysUntil } from "@/lib/store";
import { AppLayout } from "@/components/AppLayout";
import { CategoryThumb } from "@/components/CategoryBadge";
import { MemberAvatar } from "@/components/MemberAvatar";
import { getGreeting, timeAgo } from "@/lib/greeting";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Stocked Up" },
      { name: "description", content: "Your home inventory at a glance." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const app = useApp();
  const features = app.settings.features;


  const stats = useMemo(() => {
    const lowStock = app.inventory.filter(
      (i) => app.endingQty(i) > 0 && app.endingQty(i) <= i.lowStockLimit,
    );
    const outStock = app.inventory.filter((i) => app.endingQty(i) <= 0);
    const expiring = app.inventory.filter((i) => {
      const d = daysUntil(i.expirationDate);
      return d !== null && d >= 0 && d <= 7;
    });
    const restockCost = [...lowStock, ...outStock].reduce((s, i) => s + i.price, 0);
    const monthSpend = app.inventory.reduce((s, i) => s + i.addedThisMonth * i.price, 0);
    const totalItems = app.inventory.length;
    const shoppingListCount = new Set([
      ...lowStock.map((i) => i.id),
      ...outStock.map((i) => i.id),
      ...app.shoppingItems.filter((i) => !i.purchased).map((i) => i.id),
    ]).size;
    return { lowStock, outStock, expiring, restockCost, monthSpend, totalItems, shoppingListCount };
  }, [app]);

  const predictions = app.inventory
    .map((i) => {
      const dayOfMonth = Math.max(1, new Date().getDate());
      const avgDailyUsage = i.usedThisMonth / dayOfMonth;
      const ending = app.endingQty(i);
      const hasHistory = i.usedThisMonth > 0 && (app.history.some((h) => h.itemId === i.id) || Boolean(i.lastPurchased));
      if (!hasHistory || avgDailyUsage <= 0) return null;
      return { item: i, remaining: Math.max(0, Math.ceil(ending / avgDailyUsage)), avgDailyUsage };
    })
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .sort((a, b) => a.remaining - b.remaining);

  const recentlyUpdated = [...app.inventory]
    .sort((a, b) => new Date(b.updatedAt ?? b.lastPurchased).getTime() - new Date(a.updatedAt ?? a.lastPurchased).getTime())
    .slice(0, 4);

  const profileName = app.profile?.name;
  const [greeting, setGreeting] = useState<string>("");
  useEffect(() => {
    setGreeting(getGreeting(profileName, app.settings));
  }, [profileName, app.settings]);



  const summaryParts: string[] = [];
  if (stats.lowStock.length > 0)
    summaryParts.push(`${stats.lowStock.length} low stock item${stats.lowStock.length === 1 ? "" : "s"}`);
  if (stats.outStock.length > 0)
    summaryParts.push(`${stats.outStock.length} out of stock`);
  if (stats.expiring.length > 0)
    summaryParts.push(
      `${stats.expiring.length} item${stats.expiring.length === 1 ? "" : "s"} expiring this week`,
    );
  const summary =
    summaryParts.length > 0
      ? `You have ${summaryParts.join(" and ")}.`
      : "Everything looks well stocked. Nice work!";

  return (
    <AppLayout>
      {/* Mobile hero */}
      <div className="lg:hidden text-center mt-2 mb-5">
        <div className="inline-flex items-center gap-2 px-3 h-7 rounded-full bg-primary-soft text-primary text-[11px] font-semibold">
          <span className="size-1.5 rounded-full bg-primary" />
          {app.currentMonth}
        </div>
        <h1 className="mt-3 text-[34px] leading-[1.05] font-bold tracking-tight font-display">
          Stocked Up
        </h1>
        <p className="mt-1.5 text-[13px] text-muted-foreground">
          Your home, always ready.
        </p>
        <div className="mt-5 card-soft p-4 text-left bg-primary-soft/40 border-primary-soft/60">
          <div className="text-xs font-semibold text-primary/80 uppercase tracking-wider">{greeting.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "").trim()}</div>
          <p className="mt-1 text-sm font-medium text-foreground/90">{summary}</p>
        </div>
      </div>

      {/* Desktop hero */}
      <div className="hidden lg:flex items-start justify-between mb-8 gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground mb-1">{app.currentMonth}</p>
          <h1 className="text-3xl font-bold tracking-tight">{greeting}</h1>
          <p className="text-sm text-muted-foreground mt-1">{summary}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/add"
            className="px-4 h-10 rounded-full bg-primary text-primary-foreground inline-flex items-center gap-2 text-sm font-semibold shadow-sm hover:opacity-90"
          >
            <Package className="size-4" /> Add Item
          </Link>
          <button className="size-10 grid place-items-center rounded-full bg-card border border-border relative">
            <Bell className="size-4" />
            <span className="absolute top-2 right-2 size-2 rounded-full bg-destructive" />
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4 mb-6">
        <StatCard label="Low Stock" value={stats.lowStock.length} sub="items" tone="lowstock" icon="⚠️" to="/inventory" search={{ filter: "low" }} />
        <StatCard label="Out of Stock" value={stats.outStock.length} sub="items" tone="outstock" icon="📭" to="/inventory" search={{ filter: "out" }} />
        {features.expirationTracking && (
          <StatCard label="Expiring Soon" value={stats.expiring.length} sub="items" tone="expiring" icon="⏰" to="/expiring" />
        )}
        <StatCard label="Est. Restock" value={`$${stats.restockCost.toFixed(2)}`} sub="needed" tone="good" icon="🛒" to="/shopping" />
        {features.budgetForecasting && (
          <StatCard label="Monthly Spend" value={`$${stats.monthSpend.toFixed(2)}`} sub="this month" tone="muted" icon="💰" to="/budget" />
        )}
      </div>

      {/* Quick Actions */}
      <section className="mb-6">
        <h2 className="font-display font-bold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {features.barcodeScanner && (
            <QuickAction to="/scan" icon={<ScanLine className="size-5" />} label="Scan Barcode" primary />
          )}

          <QuickAction to="/add" icon={<Plus className="size-5" />} label="Add Item" />
          <QuickAction to="/shopping" icon={<ListChecks className="size-5" />} label="Shopping List" />
          <QuickAction to="/new-month" icon={<CalendarSync className="size-5" />} label="Start New Month" />
        </div>
      </section>

      {/* Streak + Activity preview */}
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <Link
          to="/insights"
          className="card-soft p-5 bg-primary-soft/50 cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] transition-all flex items-center gap-3"
        >
          <div className="size-12 rounded-2xl bg-card grid place-items-center text-2xl">🏠</div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Home Organized
            </div>
            <div className="text-2xl font-bold tracking-tight">{stats.totalItems}</div>
            <div className="text-xs text-muted-foreground">tracked inventory items</div>
          </div>
          <ChevronRight className="size-5 text-muted-foreground" />
        </Link>

        {features.householdSharing && (
        <section className="card-soft p-5 lg:col-span-2">
          <SectionHeader title="Household Activity" viewAll="/household" />
          <ul className="mt-3 divide-y divide-border">
            {app.activity.slice(0, 4).map((a) => {
              const m = app.household.find((h) => h.id === a.memberId);
              return (
                <li key={a.id} className="py-2.5 flex items-center gap-3">
                  {m ? (
                    <MemberAvatar member={m} size="sm" />
                  ) : (
                    <div className="size-8 rounded-full bg-muted grid place-items-center text-xs font-semibold">
                      {a.memberName[0]}
                    </div>
                  )}
                  <div className="flex-1 text-sm">
                    <span className="font-semibold">{a.memberName}</span>{" "}
                    <span className="text-muted-foreground">
                      {a.action === "purchased"
                        ? "marked"
                        : a.action === "added"
                          ? "added"
                          : a.action === "removed"
                            ? "removed"
                            : "updated"}
                    </span>{" "}
                    <span className="font-semibold">{a.itemName}</span>
                    {a.action === "purchased" && (
                      <span className="text-muted-foreground"> as purchased</span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{timeAgo(a.date)}</span>
                </li>
              );
            })}
            {app.activity.length === 0 && (
              <li className="py-4 text-sm text-muted-foreground">
                No household activity yet. Updates will appear here once you or your household members make changes.
              </li>
            )}

          </ul>
        </section>
        )}

      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* AI Predictions */}
        {features.aiPredictions && (
        <section className="card-soft p-5 lg:col-span-1">
          <SectionHeader
            title="AI Restock Predictions"
            icon={<Sparkles className="size-4" />}
            viewAll="/predictions"
          />
          {predictions.length > 0 ? (
            <ul className="space-y-3 mt-4">
              {predictions.map(({ item, remaining }) => (
                <li key={item.id} className="flex items-center gap-3">
                  <CategoryThumb category={item.category} image={item.image} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{item.name}</div>
                    <div className="text-xs text-muted-foreground">
                      May run out in {remaining} days
                    </div>
                  </div>
                  <Badge tone={remaining <= 3 ? "lowstock" : "good"}>{remaining}d</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">
                Add and update items over time so Stocked Up can learn your restock patterns.
              </p>
              <Link to="/add" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Plus className="size-3.5" /> Add an item
              </Link>
            </div>
          )}
          <p className="text-[11px] text-muted-foreground mt-4 flex items-center gap-1">
            <Sparkles className="size-3" /> AI learns from your usage to help you stay stocked.
          </p>

        </section>
        )}


        {/* Items Expiring Soon */}
        {features.expirationTracking && (
        <section className="card-soft p-5">
          <SectionHeader
            title="Items Expiring Soon"
            icon={<Calendar className="size-4" />}
            viewAll="/expiring"
          />
          <ul className="space-y-3 mt-4">
            {stats.expiring.slice(0, 4).map((item) => {
              const d = daysUntil(item.expirationDate)!;
              return (
                <li key={item.id} className="flex items-center gap-3">
                  <CategoryThumb category={item.category} image={item.image} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{item.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Expires in {d} day{d === 1 ? "" : "s"}
                    </div>
                  </div>
                  <Badge tone={d <= 3 ? "outstock" : "expiring"}>{d}d</Badge>
                </li>
              );
            })}
            {stats.expiring.length === 0 && (
              <li className="text-sm text-muted-foreground">
                Nothing expiring this week 🎉
                <Link to="/inventory" className="ml-2 text-primary font-semibold">View inventory</Link>
              </li>
            )}
          </ul>
        </section>
        )}


        {/* Monthly Spending */}
        {features.budgetForecasting && (
        <Link to="/budget" className="card-soft p-5 block cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-primary"><TrendingDown className="size-4" /></span>
              <h2 className="font-display font-bold">Monthly Spending</h2>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </div>
          {stats.monthSpend > 0 ? (
            <div className="mt-4">
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-bold tracking-tight">
                  ${stats.monthSpend.toFixed(2)}
                </div>
                <div className="text-xs font-semibold inline-flex items-center gap-1 text-primary">
                  <ArrowDown className="size-3" /> tracked
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Based on items you marked purchased this month.
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              No spending tracked yet. Mark items as purchased to see your monthly totals.
            </p>
          )}
        </Link>
        )}


      </div>

      {/* Shopping list preview + Recently updated */}
      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <section className="card-soft p-5">
          <SectionHeader
            title="Shopping List Preview"
            subtitle={`${stats.lowStock.length + stats.outStock.length} items`}
            viewAll="/shopping"
          />
          {stats.lowStock.length + stats.outStock.length > 0 ? (
            <div className="flex items-center gap-3 mt-4 overflow-x-auto scrollbar-hide">
              {[...stats.outStock, ...stats.lowStock].slice(0, 6).map((i) => (
                <CategoryThumb key={i.id} category={i.category} image={i.image} />
              ))}
              <div className="ml-auto text-right">
                <div className="text-xs text-muted-foreground">Estimated</div>
                <div className="text-lg font-bold">${stats.restockCost.toFixed(2)}</div>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">You're stocked up. Nothing to buy right now.</p>
              <Link to="/inventory" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                View inventory <ChevronRight className="size-3" />
              </Link>
            </div>
          )}
        </section>

        <section className="card-soft p-5">
          <SectionHeader title="Recently Updated" viewAll="/inventory" />
          {recentlyUpdated.length > 0 ? (
            <ul className="mt-4 divide-y divide-border">
              {recentlyUpdated.map((item) => {
                const e = app.endingQty(item);
                const isLow = e > 0 && e <= item.lowStockLimit;
                const isOut = e <= 0;
                return (
                  <li key={item.id} className="py-3 flex items-center gap-3">
                    <CategoryThumb category={item.category} image={item.image} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{item.category}</div>
                    </div>
                    {isOut ? (
                      <Badge tone="outstock">Out</Badge>
                    ) : isLow ? (
                      <Badge tone="lowstock">Low</Badge>
                    ) : (
                      <Badge tone="good">OK</Badge>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">
                Add your first item or scan a barcode to start stocking your home.
              </p>
              <Link to="/add" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Plus className="size-3.5" /> Add an item
              </Link>
            </div>
          )}
        </section>

      </div>

      {/* Start new month CTA */}
      <Link
        to="/new-month"
        className="mt-6 card-soft p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
      >
        <div className="size-12 rounded-2xl bg-primary text-primary-foreground grid place-items-center text-xl">
          ✨
        </div>
        <div className="flex-1">
          <div className="font-semibold">Ready to start a new month?</div>
          <div className="text-sm text-muted-foreground">
            Roll over ending quantities as your starting inventory.
          </div>
        </div>
        <ChevronRight className="size-5 text-muted-foreground" />
      </Link>
    </AppLayout>
  );
}

type Tone = "lowstock" | "outstock" | "expiring" | "good" | "muted";

const toneCls: Record<Tone, string> = {
  // Soft, premium pastels using hex (status-only, not part of brand tokens)
  lowstock: "bg-[#FFF4D6] text-[#8A6A1A]",
  outstock: "bg-[#FBE0DC] text-[#A4453B]",
  expiring: "bg-[#FFE6D1] text-[#9A5A1F]",
  good: "bg-primary-soft text-primary",
  muted: "bg-muted text-muted-foreground",
};

function StatCard({
  label,
  value,
  sub,
  tone,
  icon,
  to,
  search,
}: {
  label: string;
  value: string | number;
  sub: string;
  tone: Tone;
  icon: string;
  to?: string;
  search?: Record<string, string>;
}) {
  const inner = (
    <>
      <div className="flex items-start justify-between">
        <div className={`size-10 rounded-2xl grid place-items-center text-base ${toneCls[tone]}`}>
          {icon}
        </div>
        {to && <ChevronRight className="size-4 text-muted-foreground" />}
      </div>
      <div className="mt-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
        {label}
      </div>
      <div className="text-[26px] font-bold tracking-tight mt-0.5 leading-none">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>
    </>
  );
  if (to) {
    return (
      <Link
        to={to}
        search={search as never}
        className="card-soft p-4 lg:p-5 cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] active:shadow-sm transition-all block"
      >
        {inner}
      </Link>
    );
  }
  return <div className="card-soft p-4 lg:p-5">{inner}</div>;
}

function Badge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${toneCls[tone]}`}
    >
      {children}
    </span>
  );
}

function QuickAction({
  to,
  icon,
  label,
  primary,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  primary?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`card-soft p-4 flex items-center gap-3 hover:shadow-md transition-shadow ${
        primary ? "bg-primary text-primary-foreground border-primary" : ""
      }`}
    >
      <div
        className={`size-10 rounded-xl grid place-items-center ${
          primary ? "bg-primary-foreground/15" : "bg-primary-soft text-primary"
        }`}
      >
        {icon}
      </div>
      <div className="font-semibold text-sm">{label}</div>
    </Link>
  );
}

function SectionHeader({
  title,
  subtitle,
  icon,
  viewAll,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  viewAll?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon && <span className="text-primary">{icon}</span>}
        <h2 className="font-display font-bold">{title}</h2>
        {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
      </div>
      {viewAll && (
        <Link
          to={viewAll}
          className="text-xs font-semibold text-primary inline-flex items-center gap-0.5"
        >
          View All <ChevronRight className="size-3" />
        </Link>
      )}
    </div>
  );
}
