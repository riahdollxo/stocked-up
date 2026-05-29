import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useApp, CATEGORIES } from "@/lib/store";
import { AppLayout } from "@/components/AppLayout";
import { CategoryThumb } from "@/components/CategoryBadge";
import { Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/shopping")({
  head: () => ({
    meta: [
      { title: "Shopping List — Stocked Up" },
      { name: "description", content: "Auto-generated shopping list from low and out of stock items." },
    ],
  }),
  component: ShoppingPage,
});

function ShoppingPage() {
  const app = useApp();
  const [tab, setTab] = useState<"toBuy" | "purchased" | "all">("toBuy");

  const items = useMemo(() => {
    const list = app.inventory.filter((i) => {
      const e = app.endingQty(i);
      return e <= i.lowStockLimit;
    });
    if (tab === "toBuy") return list.filter((i) => !app.purchased.includes(i.id));
    if (tab === "purchased") return list.filter((i) => app.purchased.includes(i.id));
    return list;
  }, [app, tab]);

  const grouped = useMemo(() => {
    const m: Record<string, typeof items> = {};
    for (const i of items) {
      (m[i.category] ??= []).push(i);
    }
    return m;
  }, [items]);

  const total = items.reduce((s, i) => s + i.price, 0);

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Shopping List</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Auto-generated from low &amp; out of stock
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-4 bg-card p-1 rounded-full border border-border w-fit">
        {[
          { k: "toBuy", l: `To Buy (${app.inventory.filter((i) => app.endingQty(i) <= i.lowStockLimit && !app.purchased.includes(i.id)).length})` },
          { k: "purchased", l: `Purchased (${app.purchased.length})` },
          { k: "all", l: "All" },
        ].map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k as typeof tab)}
            className={`px-4 h-9 rounded-full text-xs font-semibold transition-colors ${
              tab === t.k ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            {t.l}
          </button>
        ))}
      </div>

      <div className="space-y-5">
        {CATEGORIES.filter((c) => grouped[c]?.length).map((c) => (
          <section key={c}>
            <h3 className="text-sm font-bold text-muted-foreground mb-2 px-1">{c}</h3>
            <div className="card-soft divide-y divide-border overflow-hidden">
              {grouped[c].map((item) => {
                const purchased = app.purchased.includes(item.id);
                return (
                  <label
                    key={item.id}
                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/40"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        app.togglePurchased(item.id);
                        if (!purchased) toast.success(`Marked ${item.name} purchased`);
                      }}
                      className={`size-6 rounded-md border-2 grid place-items-center transition-colors ${
                        purchased
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-border bg-background"
                      }`}
                    >
                      {purchased && <Check className="size-3.5" />}
                    </button>
                    <CategoryThumb category={item.category} image={item.image} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold text-sm truncate ${purchased ? "line-through text-muted-foreground" : ""}`}>
                        {item.name}
                      </div>
                      <div className="text-xs text-muted-foreground">{item.packageSize ?? item.unit}</div>
                    </div>
                    <div className="font-semibold tabular-nums">${item.price.toFixed(2)}</div>
                  </label>
                );
              })}
            </div>
          </section>
        ))}
        {items.length === 0 && (
          <div className="card-soft p-8 text-center text-muted-foreground">
            🎉 Nothing to buy right now!
          </div>
        )}
      </div>

      {/* Total + CTA */}
      <div className="card-soft p-4 mt-6 sticky bottom-24 lg:bottom-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">Estimated Total</span>
          <span className="text-xl font-bold tabular-nums">${total.toFixed(2)}</span>
        </div>
        <button
          onClick={() => {
            items.forEach((i) => {
              if (!app.purchased.includes(i.id)) app.togglePurchased(i.id);
            });
            toast.success("All items marked purchased");
          }}
          className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold"
        >
          Mark All as Purchased
        </button>
      </div>
    </AppLayout>
  );
}
