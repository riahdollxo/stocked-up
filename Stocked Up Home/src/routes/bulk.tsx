import { createFileRoute } from "@tanstack/react-router";
import { useApp } from "@/lib/store";
import { AppLayout } from "@/components/AppLayout";
import { CategoryThumb } from "@/components/CategoryBadge";

export const Route = createFileRoute("/bulk")({
  head: () => ({
    meta: [
      { title: "Bulk Savings — Stocked Up" },
      { name: "description", content: "Costco & Sam's Club bulk savings recommendations." },
    ],
  }),
  component: BulkPage,
});

const STORES = ["Costco", "Sam's Club", "Walmart", "Target", "Aldi"];

function BulkPage() {
  const app = useApp();
  // suggest items used frequently (avgCycleDays <= 30) as bulk candidates
  const bulkCandidates = app.inventory.filter((i) => (i.avgCycleDays ?? 99) <= 35 && i.price > 4);

  return (
    <AppLayout>
      <h1 className="text-2xl lg:text-3xl font-bold tracking-tight mb-1">Bulk Savings</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Items where buying bulk could save you money
      </p>

      <div className="card-soft p-5 mb-4">
        <h3 className="font-bold mb-3">Preferred Stores</h3>
        <div className="flex flex-wrap gap-2">
          {STORES.map((s) => (
            <span key={s} className="px-3 h-8 rounded-full bg-accent text-accent-foreground text-xs font-semibold inline-flex items-center">
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="card-soft divide-y divide-border overflow-hidden">
        {bulkCandidates.map((item) => {
          const bulkPrice = item.price * 2.4; // estimated bulk price
          const savings = item.price * 4 - bulkPrice;
          return (
            <div key={item.id} className="p-4 flex items-center gap-3">
              <CategoryThumb category={item.category} image={item.image} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold">{item.name}</div>
                <div className="text-xs text-muted-foreground">
                  Current: ${item.price.toFixed(2)} at {item.store}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">You may save</div>
                <div className="font-bold text-primary">${savings.toFixed(2)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
}
