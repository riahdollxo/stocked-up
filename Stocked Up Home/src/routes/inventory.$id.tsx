import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Camera, Edit2, Trash2, Upload, X } from "lucide-react";
import { useApp, CATEGORIES, type Category } from "@/lib/store";
import { AppLayout } from "@/components/AppLayout";
import { CategoryThumb, StatusPill } from "@/components/CategoryBadge";
import { toast } from "sonner";

export const Route = createFileRoute("/inventory/$id")({
  head: () => ({
    meta: [
      { title: "Item Details — Stocked Up" },
      { name: "description", content: "View and edit item details." },
    ],
  }),
  component: ItemDetailsPage,
});

function ItemDetailsPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const app = useApp();
  const item = app.inventory.find((i) => i.id === id);
  const [editing, setEditing] = useState(false);

  if (!item) {
    return (
      <AppLayout>
        <div className="card-soft p-8 text-center">
          <h2 className="font-bold text-lg">Item not found</h2>
          <Link to="/inventory" className="text-primary font-semibold mt-2 inline-block">
            Back to inventory
          </Link>
        </div>
      </AppLayout>
    );
  }

  const ending = app.endingQty(item);
  const isOut = ending <= 0;
  const isLow = ending > 0 && ending <= item.lowStockLimit;

  const handleImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      app.updateItem(item.id, { image: reader.result as string });
      toast.success("Photo updated");
    };
    reader.readAsDataURL(file);
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <Link to="/inventory" className="size-10 grid place-items-center rounded-full bg-card border border-border">
          <ArrowLeft className="size-4" />
        </Link>
        <h1 className="font-bold">Item Details</h1>
        <button
          onClick={() => setEditing((e) => !e)}
          className="text-primary font-semibold text-sm inline-flex items-center gap-1"
        >
          {editing ? "Done" : <><Edit2 className="size-3.5" /> Edit</>}
        </button>
      </div>

      {/* Hero */}
      <div className="card-soft p-5 mb-4">
        <div className="flex items-start gap-4">
          <div className="relative group">
            <CategoryThumb category={item.category} image={item.image} size="lg" />
            <label className="absolute inset-0 rounded-2xl bg-foreground/40 opacity-0 group-hover:opacity-100 grid place-items-center cursor-pointer transition-opacity">
              <Camera className="size-5 text-white" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleImage(e.target.files[0])}
              />
            </label>
            {item.image && (
              <button
                onClick={() => app.updateItem(item.id, { image: null })}
                className="absolute -top-2 -right-2 size-6 rounded-full bg-destructive text-destructive-foreground grid place-items-center"
                aria-label="Remove photo"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <input
                value={item.name}
                onChange={(e) => app.updateItem(item.id, { name: e.target.value })}
                className="w-full text-xl font-bold bg-transparent border-b border-border outline-none focus:border-primary"
              />
            ) : (
              <h2 className="text-xl font-bold leading-tight">{item.name}</h2>
            )}
            <p className="text-sm text-muted-foreground">{item.category}</p>
            <div className="mt-2">
              {isOut ? (
                <StatusPill status="out" />
              ) : isLow ? (
                <StatusPill status="low" />
              ) : (
                <StatusPill status="fresh" />
              )}
            </div>
          </div>
        </div>
        <div className="mt-5 flex items-baseline gap-2">
          <div className="text-5xl font-bold tracking-tight">{ending}</div>
          <div className="text-muted-foreground">{item.unit ?? "units"}</div>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Low Stock Limit: {item.lowStockLimit}
        </div>
      </div>

      {/* Quantity overview */}
      <div className="card-soft p-5 mb-4">
        <h3 className="font-bold mb-4">Quantity Overview</h3>
        <Row label="Starting Quantity" editable={editing} value={item.startingQuantity}
          onChange={(v) => app.updateItem(item.id, { startingQuantity: v })} />
        <Row label="Used This Month" editable={editing} value={item.usedThisMonth}
          onChange={(v) => app.updateItem(item.id, { usedThisMonth: v })} />
        <Row label="Added This Month" editable={editing} value={item.addedThisMonth}
          onChange={(v) => app.updateItem(item.id, { addedThisMonth: v })} />
        <div className="flex items-center justify-between py-2 border-t border-border mt-2 pt-3">
          <span className="text-sm font-semibold">Ending Quantity</span>
          <span className="font-bold text-primary text-lg tabular-nums">{ending}</span>
        </div>
      </div>

      {/* Price & Store */}
      <div className="card-soft p-5 mb-4">
        <h3 className="font-bold mb-4">Price & Store</h3>
        <RowText label="Price" editable={editing} value={`$${item.price.toFixed(2)}`} rawValue={item.price}
          onChange={(v) => app.updateItem(item.id, { price: parseFloat(v) || 0 })} type="number" />
        <RowText label="Store" editable={editing} value={item.store}
          onChange={(v) => app.updateItem(item.id, { store: v })} />
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-muted-foreground">Last Purchased</span>
          <span className="text-sm font-medium">
            {new Date(item.lastPurchased).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>
      </div>

      {/* Notes */}
      <div className="card-soft p-5 mb-4">
        <h3 className="font-bold mb-3">Notes</h3>
        {editing ? (
          <textarea
            value={item.notes}
            onChange={(e) => app.updateItem(item.id, { notes: e.target.value })}
            className="w-full bg-muted rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            rows={3}
          />
        ) : (
          <div className="bg-muted rounded-xl p-3 text-sm text-muted-foreground italic min-h-[3rem]">
            {item.notes || "No notes yet."}
          </div>
        )}
      </div>

      {editing && (
        <div className="card-soft p-5 mb-4">
          <h3 className="font-bold mb-3">Category</h3>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => app.updateItem(item.id, { category: c })}
                className={`px-3 h-8 rounded-full text-xs font-semibold ${
                  item.category === c
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => {
          app.updateItem(item.id, {
            addedThisMonth: item.addedThisMonth + 1,
            lastPurchased: new Date().toISOString(),
          });
          toast.success("Quantity updated");
        }}
        className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold mb-3"
      >
        + Add 1 Restocked
      </button>

      {editing && (
        <button
          onClick={() => {
            app.removeItem(item.id);
            toast.success("Item deleted");
            navigate({ to: "/inventory" });
          }}
          className="w-full h-12 rounded-full bg-destructive/10 text-destructive font-semibold flex items-center justify-center gap-2"
        >
          <Trash2 className="size-4" /> Delete Item
        </button>
      )}
    </AppLayout>
  );
}

function Row({
  label,
  value,
  editable,
  onChange,
}: {
  label: string;
  value: number;
  editable: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      {editable ? (
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-20 text-right font-semibold bg-muted rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-primary/30"
        />
      ) : (
        <span className="font-semibold tabular-nums">{value}</span>
      )}
    </div>
  );
}

function RowText({
  label,
  value,
  rawValue,
  editable,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  rawValue?: number | string;
  editable: boolean;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      {editable ? (
        <input
          type={type}
          step={type === "number" ? "0.01" : undefined}
          value={rawValue ?? value}
          onChange={(e) => onChange(e.target.value)}
          className="w-28 text-right font-semibold bg-muted rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-primary/30"
        />
      ) : (
        <span className="font-semibold">{value}</span>
      )}
    </div>
  );
}
