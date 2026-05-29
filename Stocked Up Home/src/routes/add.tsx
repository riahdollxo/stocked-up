import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ArrowLeft, ImagePlus, Save } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { CATEGORIES, type Category, useApp } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/add")({
  head: () => ({
    meta: [
      { title: "Add Item — Stocked Up" },
      { name: "description", content: "Add a real household inventory item." },
    ],
  }),
  component: AddItemPage,
});

function AddItemPage() {
  const app = useApp();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("Pantry");
  const [quantity, setQuantity] = useState(1);
  const [lowStockLimit, setLowStockLimit] = useState(1);
  const [price, setPrice] = useState(0);
  const [store, setStore] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [notes, setNotes] = useState("");
  const [barcode, setBarcode] = useState("");
  const [image, setImage] = useState<string | null>(null);

  function save() {
    if (!name.trim()) {
      toast.error("Add an item name");
      return;
    }
    app.addItem({
      name: name.trim(),
      category,
      startingQuantity: Number(quantity) || 0,
      usedThisMonth: 0,
      addedThisMonth: 0,
      lowStockLimit: Number(lowStockLimit) || 0,
      price: Number(price) || 0,
      store: store.trim(),
      expirationDate: expirationDate || null,
      notes: notes.trim(),
      barcode: barcode.trim() || undefined,
      image,
      lastPurchased: new Date().toISOString(),
    });
    toast.success(`${name.trim()} added to inventory`);
    navigate({ to: "/inventory" });
  }

  function handleImage(file: File) {
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate({ to: "/" })} className="size-10 grid place-items-center rounded-full bg-card border border-border">
            <ArrowLeft className="size-4" />
          </button>
          <h1 className="text-xl font-bold">Add Item</h1>
          <button onClick={save} className="size-10 grid place-items-center rounded-full bg-primary text-primary-foreground">
            <Save className="size-4" />
          </button>
        </div>

        <div className="card-soft p-5 space-y-4">
          <button onClick={() => fileRef.current?.click()} className="w-full h-28 rounded-2xl bg-primary-soft text-primary grid place-items-center font-semibold">
            {image ? <img src={image} alt="Item preview" className="h-full w-full rounded-2xl object-cover" /> : <span className="inline-flex items-center gap-2"><ImagePlus className="size-5" /> Add photo</span>}
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && handleImage(e.target.files[0])} />

          <Field label="Item name"><input autoFocus value={name} onChange={(e) => setName(e.target.value)} className="input-soft" /></Field>
          <Field label="Category"><select value={category} onChange={(e) => setCategory(e.target.value as Category)} className="input-soft">{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantity"><input type="number" min="0" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="input-soft" /></Field>
            <Field label="Low stock limit"><input type="number" min="0" value={lowStockLimit} onChange={(e) => setLowStockLimit(Number(e.target.value))} className="input-soft" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price"><input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="input-soft" /></Field>
            <Field label="Store"><input value={store} onChange={(e) => setStore(e.target.value)} className="input-soft" /></Field>
          </div>
          <Field label="Expiration date"><input type="date" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} className="input-soft" /></Field>
          <Field label="Barcode optional"><input value={barcode} onChange={(e) => setBarcode(e.target.value)} className="input-soft" /></Field>
          <Field label="Notes"><textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input-soft min-h-24 py-3" /></Field>
          <button onClick={save} className="w-full h-12 rounded-full bg-primary text-primary-foreground font-bold">Save Item</button>
        </div>
      </div>
    </AppLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-semibold space-y-1.5"><span>{label}</span>{children}</label>;
}