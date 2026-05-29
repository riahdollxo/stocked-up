import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { useApp } from "@/lib/store";
import { AppLayout } from "@/components/AppLayout";
import { toast } from "sonner";
import { Info } from "lucide-react";

export const Route = createFileRoute("/new-month")({
  head: () => ({
    meta: [
      { title: "Start New Month — Stocked Up" },
      { name: "description", content: "Roll over ending quantities to start a fresh month." },
    ],
  }),
  component: NewMonthPage,
});

function NewMonthPage() {
  const app = useApp();
  const navigate = useNavigate();

  const summary = useMemo(() => {
    const totalEnding = app.inventory.reduce((s, i) => s + app.endingQty(i), 0);
    const totalStarting = app.inventory.reduce((s, i) => s + i.startingQuantity, 0);
    const totalValue = app.inventory.reduce((s, i) => s + app.endingQty(i) * i.price, 0);
    const startingValue = app.inventory.reduce((s, i) => s + i.startingQuantity * i.price, 0);
    return { totalEnding, totalStarting, totalValue, startingValue };
  }, [app]);

  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextLabel = next.toLocaleString("en-US", { month: "long", year: "numeric" });

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-center">
          Start New Month
        </h1>

        <div className="card-soft p-8 mt-6 text-center bg-primary-soft/40">
          <div className="text-5xl mb-3">✨</div>
          <h2 className="text-xl font-bold">Ready to start {nextLabel}?</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
            Your current inventory will be rolled over as the starting quantities for {nextLabel}.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="card-soft p-5 bg-muted/40">
            <div className="text-xs font-semibold text-muted-foreground">
              {app.currentMonth} (Ending)
            </div>
            <div className="text-3xl font-bold tracking-tight mt-2">{summary.totalEnding}</div>
            <div className="text-xs text-muted-foreground">Total Items</div>
            <div className="mt-3 text-2xl font-bold tracking-tight">
              ${summary.totalValue.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">Total Value</div>
          </div>
          <div className="card-soft p-5 bg-accent/40">
            <div className="text-xs font-semibold text-primary">{nextLabel} (Starting)</div>
            <div className="text-3xl font-bold tracking-tight mt-2">{summary.totalEnding}</div>
            <div className="text-xs text-muted-foreground">Items Will Carry Over</div>
            <div className="mt-3 text-2xl font-bold tracking-tight">
              ${summary.totalValue.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">Starting Value</div>
          </div>
        </div>

        <div className="card-soft p-4 mt-4 flex items-center gap-3 bg-warning/10">
          <Info className="size-5 text-warning-foreground shrink-0" />
          <p className="text-sm">
            You can still edit any starting quantities after the rollover.
          </p>
        </div>

        <button
          onClick={() => {
            app.rolloverMonth(nextLabel);
            toast.success(`Welcome to ${nextLabel}!`);
            navigate({ to: "/" });
          }}
          className="mt-6 w-full h-13 py-4 rounded-full bg-primary text-primary-foreground font-bold text-base"
        >
          Start {nextLabel}
        </button>
        <button
          onClick={() => navigate({ to: "/" })}
          className="mt-2 w-full h-12 rounded-full text-primary font-semibold"
        >
          Cancel
        </button>
      </div>
    </AppLayout>
  );
}
