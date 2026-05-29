import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronRight, Filter, Plus, Search } from "lucide-react";
import { useApp, CATEGORIES, type Category, daysUntil } from "@/lib/store";
import { AppLayout } from "@/components/AppLayout";
import { CategoryThumb } from "@/components/CategoryBadge";

type InventoryFilter = "low" | "out" | "expiring";

export const Route = createFileRoute("/inventory/")({
  validateSearch: (search: Record<string, unknown>): { filter?: InventoryFilter } => {
    const f = search.filter;
    if (f === "low" || f === "out" || f === "expiring") return { filter: f };
    return {};
  },
  head: () => ({
    meta: [
      { title: "Inventory — Stocked Up" },
      { name: "description", content: "Browse and edit every item in your home." },
    ],
  }),
  component: InventoryPage,
});

function InventoryPage() {
  const app = useApp();
  const { filter } = Route.useSearch();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<"All" | Category>("All");

  const filtered = useMemo(() => {
    return app.inventory.filter((i) => {
      if (cat !== "All" && i.category !== cat) return false;
      if (q && !i.name.toLowerCase().includes(q.toLowerCase())) return false;
      if (filter === "low") {
        const e = app.endingQty(i);
        if (!(e > 0 && e <= i.lowStockLimit)) return false;
      }
      if (filter === "out") {
        if (app.endingQty(i) > 0) return false;
      }
      if (filter === "expiring") {
        const d = daysUntil(i.expirationDate);
        if (d === null || d < 0 || d > 7) return false;
      }
      return true;
    });
  }, [app, q, cat, filter]);

  const filterLabel = filter === "low" ? "Low stock" : filter === "out" ? "Out of stock" : filter === "expiring" ? "Expiring soon" : null;

  const grouped = useMemo(() => {
    const m: Record<string, typeof app.inventory> = {};
    for (const c of CATEGORIES) m[c] = [];
    for (const i of app.inventory) m[i.category].push(i);
    return m;
  }, [app.inventory]);

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {app.inventory.length} items tracked
          </p>
        </div>
        <Link
          to="/add"
          className="px-4 h-10 rounded-full bg-primary text-primary-foreground inline-flex items-center gap-2 text-sm font-semibold"
        >
          <Plus className="size-4" /> Add Item
        </Link>
      </div>

      {filterLabel && (
        <div className="mb-4 flex items-center gap-2">
          <span className="inline-flex items-center gap-2 px-3 h-8 rounded-full bg-primary-soft text-primary text-xs font-semibold">
            Filter: {filterLabel}
          </span>
          <Link to="/inventory" className="text-xs font-semibold text-muted-foreground underline">
            Clear
          </Link>
        </div>
      )}

      {/* Search + filter */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 relative">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search items…"
            className="w-full h-11 pl-9 pr-3 rounded-full bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <button className="size-11 grid place-items-center rounded-full bg-card border border-border">
          <Filter className="size-4" />
        </button>
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-4 -mx-4 px-4">
        {(["All", ...CATEGORIES] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`shrink-0 px-4 h-9 rounded-full text-xs font-semibold transition-colors ${
              cat === c
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-foreground"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Desktop: spreadsheet-like table */}
      <div className="hidden lg:block card-soft overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-xs text-muted-foreground">
            <tr>
              <th className="text-left font-semibold px-4 py-3">Item</th>
              <th className="text-left font-semibold px-4 py-3">Category</th>
              <th className="text-right font-semibold px-4 py-3">Start</th>
              <th className="text-right font-semibold px-4 py-3">Used</th>
              <th className="text-right font-semibold px-4 py-3">Added</th>
              <th className="text-right font-semibold px-4 py-3">Ending</th>
              <th className="text-right font-semibold px-4 py-3">Low Limit</th>
              <th className="text-right font-semibold px-4 py-3">Price</th>
              <th className="text-left font-semibold px-4 py-3">Store</th>
              <th className="text-left font-semibold px-4 py-3">Last Purchased</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((item) => {
              const e = app.endingQty(item);
              const isLow = e > 0 && e <= item.lowStockLimit;
              const isOut = e <= 0;
              return (
                <tr key={item.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <Link to="/inventory/$id" params={{ id: item.id }} className="flex items-center gap-3">
                      <CategoryThumb category={item.category} image={item.image} size="sm" />
                      <div>
                        <div className="font-semibold">{item.name}</div>
                        {item.brand && <div className="text-xs text-muted-foreground">{item.brand}</div>}
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{item.category}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{item.startingQuantity}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{item.usedThisMonth}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{item.addedThisMonth}</td>
                  <td className={`px-4 py-3 text-right tabular-nums font-semibold ${isOut ? "text-destructive" : isLow ? "text-warning-foreground" : ""}`}>
                    {e}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{item.lowStockLimit}</td>
                  <td className="px-4 py-3 text-right tabular-nums">${item.price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.store}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(item.lastPurchased).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: category cards + items */}
      <div className="lg:hidden space-y-3">
        {cat === "All" && !q ? (
          CATEGORIES.filter((c) => grouped[c].length > 0).map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className="w-full card-soft p-4 flex items-center gap-3 text-left"
            >
              <CategoryThumb category={c} />
              <div className="flex-1">
                <div className="font-semibold">{c}</div>
                <div className="text-xs text-muted-foreground">{grouped[c].length} items</div>
              </div>
              <ChevronRight className="size-5 text-muted-foreground" />
            </button>
          ))
        ) : (
          filtered.map((item) => {
            const e = app.endingQty(item);
            const isLow = e > 0 && e <= item.lowStockLimit;
            const isOut = e <= 0;
            return (
              <Link
                key={item.id}
                to="/inventory/$id"
                params={{ id: item.id }}
                className="card-soft p-3 flex items-center gap-3"
              >
                <CategoryThumb category={item.category} image={item.image} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{item.name}</div>
                  <div className="text-xs text-muted-foreground">{item.packageSize ?? item.unit ?? item.category}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold tabular-nums">{e}</div>
                  <div className="text-[10px] text-muted-foreground">{item.unit ?? "units"}</div>
                </div>
                {(isLow || isOut) && (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isOut ? "bg-destructive/15 text-destructive" : "bg-warning/20 text-warning-foreground"}`}>
                    {isOut ? "Out" : "Low"}
                  </span>
                )}
              </Link>
            );
          })
        )}
      </div>
    </AppLayout>
  );
}
