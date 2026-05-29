import { createFileRoute } from "@tanstack/react-router";
import { useApp } from "@/lib/store";
import { AppLayout } from "@/components/AppLayout";

export const Route = createFileRoute("/budget")({
  head: () => ({
    meta: [
      { title: "Budget Forecast — Stocked Up" },
      { name: "description", content: "Spending trends and next month's forecast." },
    ],
  }),
  component: BudgetPage,
});

function BudgetPage() {
  const app = useApp();
  const monthSpend = app.inventory.reduce((s, i) => s + i.addedThisMonth * i.price, 0);
  const restockCost = app.inventory
    .filter((i) => app.endingQty(i) <= i.lowStockLimit)
    .reduce((s, i) => s + i.price, 0);
  const forecast = monthSpend + restockCost;

  const byCat: Record<string, number> = {};
  for (const i of app.inventory) {
    byCat[i.category] = (byCat[i.category] ?? 0) + i.usedThisMonth * i.price;
  }
  const sorted = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const topCat = sorted[0];

  return (
    <AppLayout>
      <h1 className="text-2xl lg:text-3xl font-bold tracking-tight mb-1">Budget Forecast</h1>
      <p className="text-sm text-muted-foreground mb-6">Plan and predict household spending</p>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <div className="card-soft p-5">
          <div className="text-xs font-semibold text-muted-foreground uppercase">Next Month Forecast</div>
          <div className="text-4xl font-bold tracking-tight mt-2">${forecast.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground mt-1">Estimated restock cost</div>
          <div className="mt-4 h-28 flex items-end gap-2">
            {[60, 75, 55, 80, 70, 90, 65].map((h, i) => (
              <div key={i} className="flex-1 rounded-t-md bg-primary/40" style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
            <span>Apr</span>
            <span>May</span>
            <span>Jun</span>
            <span>Jul</span>
          </div>
        </div>

        <div className="card-soft p-5">
          <div className="text-xs font-semibold text-muted-foreground uppercase">Most Expensive Category</div>
          {topCat && (
            <>
              <div className="text-2xl font-bold tracking-tight mt-2">{topCat[0]}</div>
              <div className="text-sm text-muted-foreground">${topCat[1].toFixed(2)} this month</div>
            </>
          )}
          <ul className="mt-4 space-y-2">
            {sorted.slice(0, 5).map(([c, v]) => (
              <li key={c} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{c}</span>
                <span className="font-semibold tabular-nums">${v.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card-soft p-5">
        <h3 className="font-bold">Monthly Comparison</h3>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div>
            <div className="text-xs text-muted-foreground">Last Month</div>
            <div className="text-xl font-bold">$99.50</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">This Month</div>
            <div className="text-xl font-bold text-primary">${monthSpend.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Forecast</div>
            <div className="text-xl font-bold">${forecast.toFixed(2)}</div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
