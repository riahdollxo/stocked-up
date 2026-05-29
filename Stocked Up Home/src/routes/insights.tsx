import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useApp, CATEGORIES } from "@/lib/store";
import { AppLayout } from "@/components/AppLayout";
import { CategoryThumb } from "@/components/CategoryBadge";
import { ArrowDown } from "lucide-react";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Insights — Stocked Up" },
      { name: "description", content: "See spending trends and your most used items." },
    ],
  }),
  component: InsightsPage,
});

function InsightsPage() {
  const app = useApp();

  const data = useMemo(() => {
    const totalSpend = app.inventory.reduce((s, i) => s + i.addedThisMonth * i.price, 0);
    const byCat: Record<string, number> = {};
    for (const i of app.inventory) {
      byCat[i.category] = (byCat[i.category] ?? 0) + i.usedThisMonth * i.price;
    }
    const sortedCats = Object.entries(byCat)
      .sort((a, b) => b[1] - a[1])
      .filter(([, v]) => v > 0);
    const max = Math.max(...sortedCats.map(([, v]) => v), 1);
    const topItems = [...app.inventory]
      .sort((a, b) => b.usedThisMonth - a.usedThisMonth)
      .slice(0, 5);
    return { totalSpend, sortedCats, max, topItems };
  }, [app]);

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Insights</h1>
        <span className="text-sm text-muted-foreground">{app.currentMonth}</span>
      </div>

      {/* This Month */}
      <div className="card-soft p-5 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm font-semibold text-muted-foreground">This Month</div>
            <div className="text-xs text-muted-foreground mt-1">Total Spent</div>
            <div className="text-4xl font-bold tracking-tight mt-1">
              ${data.totalSpend.toFixed(2)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">vs Last Month</div>
            <div className="text-primary font-bold inline-flex items-center gap-1 mt-1">
              <ArrowDown className="size-4" /> 12%
            </div>
            <div className="text-xs text-muted-foreground">$99.50</div>
          </div>
        </div>
      </div>

      {/* Most used categories */}
      <div className="card-soft p-5 mb-4">
        <h3 className="font-bold mb-4">Most Used Categories</h3>
        <ul className="space-y-3">
          {data.sortedCats.map(([cat, val]) => (
            <li key={cat} className="flex items-center gap-3">
              <CategoryThumb category={cat as (typeof CATEGORIES)[number]} size="sm" />
              <div className="flex-1">
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-sm font-semibold">{cat}</span>
                  <span className="text-sm font-bold tabular-nums">${val.toFixed(2)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${(val / data.max) * 100}%` }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Top items */}
      <div className="card-soft p-5">
        <h3 className="font-bold mb-4">Top Used Items</h3>
        <ul className="space-y-3">
          {data.topItems.map((i) => (
            <li key={i.id} className="flex items-center gap-3">
              <CategoryThumb category={i.category} image={i.image} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{i.name}</div>
                <div className="text-xs text-muted-foreground">
                  Used {i.usedThisMonth} {i.unit ?? "units"}
                </div>
              </div>
              <span className="text-sm font-semibold tabular-nums">
                ${(i.usedThisMonth * i.price).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </AppLayout>
  );
}
