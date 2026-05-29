import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { useApp } from "@/lib/store";
import { AppLayout } from "@/components/AppLayout";
import { CategoryThumb } from "@/components/CategoryBadge";

export const Route = createFileRoute("/predictions")({
  head: () => ({
    meta: [
      { title: "AI Predictions — Stocked Up" },
      { name: "description", content: "AI predicts when you'll run out of essentials." },
    ],
  }),
  component: PredictionsPage,
});

function PredictionsPage() {
  const app = useApp();
  const predictions = app.inventory
    .filter((i) => i.avgCycleDays)
    .map((i) => {
      const last = new Date(i.lastPurchased).getTime();
      const daysSince = Math.floor((Date.now() - last) / 86400000);
      const remaining = Math.max(0, (i.avgCycleDays ?? 30) - daysSince);
      return { item: i, remaining };
    })
    .sort((a, b) => a.remaining - b.remaining);

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="size-6 text-primary" /> AI Restock Predictions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Smart restock alerts based on your usage patterns
          </p>
        </div>
      </div>

      <div className="card-soft divide-y divide-border overflow-hidden">
        {predictions.map(({ item, remaining }) => (
          <div key={item.id} className="flex items-center gap-3 p-4">
            <CategoryThumb category={item.category} image={item.image} />
            <div className="flex-1 min-w-0">
              <div className="font-semibold">{item.name}</div>
              <div className="text-xs text-muted-foreground">
                You typically rebuy every {item.avgCycleDays} days
              </div>
            </div>
            <div className="text-right">
              <div className={`text-sm font-bold ${remaining <= 5 ? "text-destructive" : remaining <= 10 ? "text-warning-foreground" : "text-primary"}`}>
                {remaining}d
              </div>
              <div className="text-[10px] text-muted-foreground">until empty</div>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
