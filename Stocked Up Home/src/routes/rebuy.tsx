import { createFileRoute } from "@tanstack/react-router";
import { useApp } from "@/lib/store";
import { AppLayout } from "@/components/AppLayout";
import { CategoryThumb } from "@/components/CategoryBadge";

export const Route = createFileRoute("/rebuy")({
  head: () => ({
    meta: [
      { title: "Rebuy Tracker — Stocked Up" },
      { name: "description", content: "Track your average rebuy cycles." },
    ],
  }),
  component: RebuyPage,
});

function RebuyPage() {
  const app = useApp();
  const items = app.inventory.filter((i) => i.avgCycleDays).sort((a, b) => (a.avgCycleDays ?? 0) - (b.avgCycleDays ?? 0));

  return (
    <AppLayout>
      <h1 className="text-2xl lg:text-3xl font-bold tracking-tight mb-1">Rebuy Tracker</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Frequently restocked items and their average cycles
      </p>

      <div className="card-soft divide-y divide-border overflow-hidden">
        {items.map((item) => {
          const next = new Date(item.lastPurchased);
          next.setDate(next.getDate() + (item.avgCycleDays ?? 30));
          return (
            <div key={item.id} className="flex items-center gap-3 p-4">
              <CategoryThumb category={item.category} image={item.image} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold">{item.name}</div>
                <div className="text-xs text-muted-foreground">
                  Every {item.avgCycleDays} days · Last: {new Date(item.lastPurchased).toLocaleDateString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Next reorder</div>
                <div className="text-sm font-semibold">
                  {next.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
}
