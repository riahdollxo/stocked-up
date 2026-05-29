import { createFileRoute } from "@tanstack/react-router";
import { useApp, daysUntil } from "@/lib/store";
import { AppLayout } from "@/components/AppLayout";
import { CategoryThumb } from "@/components/CategoryBadge";

export const Route = createFileRoute("/expiring")({
  head: () => ({
    meta: [
      { title: "Expiring Soon — Stocked Up" },
      { name: "description", content: "Track expiration dates for food and medicine." },
    ],
  }),
  component: ExpiringPage,
});

function ExpiringPage() {
  const app = useApp();
  const items = app.inventory
    .filter((i) => i.expirationDate)
    .map((i) => ({ item: i, days: daysUntil(i.expirationDate)! }))
    .sort((a, b) => a.days - b.days);

  return (
    <AppLayout>
      <h1 className="text-2xl lg:text-3xl font-bold tracking-tight mb-1">Expiring Soon</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {items.length} items with expiration dates
      </p>

      <div className="card-soft divide-y divide-border overflow-hidden">
        {items.map(({ item, days }) => {
          const tone =
            days < 0
              ? "bg-destructive/15 text-destructive"
              : days <= 3
              ? "bg-destructive/15 text-destructive"
              : days <= 7
              ? "bg-warning/20 text-warning-foreground"
              : "bg-primary-soft text-primary";
          const label = days < 0 ? "Expired" : days === 0 ? "Today" : `${days}d`;
          return (
            <div key={item.id} className="p-4 flex items-center gap-3">
              <CategoryThumb category={item.category} image={item.image} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold">{item.name}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(item.expirationDate!).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${tone}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
}
