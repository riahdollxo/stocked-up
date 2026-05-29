import { categoryIcon, type Category } from "@/lib/store";
import { cn } from "@/lib/utils";

const categoryTints: Record<Category, string> = {
  Pantry: "bg-[#F5EAD2] text-[#8A6A1A]",
  Fridge: "bg-[#DDEBF3] text-[#2F5F7B]",
  Freezer: "bg-[#E3ECF5] text-[#3A5A82]",
  Bathroom: "bg-[#E6E1F2] text-[#5A4A8A]",
  Cleaning: "bg-[#DCEBE0] text-[#365E45]",
  Laundry: "bg-[#E4ECE3] text-[#4A6B4F]",
  "Pet Supplies": "bg-[#F5E0D4] text-[#8A5230]",
  Medicine: "bg-[#F5DCDC] text-[#8A3A3A]",
  Miscellaneous: "bg-[#ECE7DD] text-[#6A5E45]",
};

export function CategoryThumb({
  category,
  image,
  size = "md",
  className,
}: {
  category: Category;
  image?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    sm: "size-10 text-base rounded-xl",
    md: "size-12 text-xl rounded-2xl",
    lg: "size-24 text-4xl rounded-3xl",
  };
  if (image) {
    return (
      <img
        src={image}
        alt=""
        className={cn(
          "object-cover bg-muted",
          sizes[size],
          className,
        )}
      />
    );
  }
  return (
    <div
      className={cn(
        "grid place-items-center",
        categoryTints[category],
        sizes[size],
        className,
      )}
    >
      <span>{categoryIcon(category)}</span>
    </div>
  );
}

export function StatusPill({
  status,
}: {
  status: "fresh" | "low" | "out" | "expiring" | "expired";
}) {
  const map = {
    fresh: { label: "In Stock", cls: "bg-primary-soft text-primary" },
    low: { label: "Low Stock", cls: "bg-[#FBE0DC] text-[#A4453B]" },
    out: { label: "Out of Stock", cls: "bg-[#FBE0DC] text-[#A4453B]" },
    expiring: { label: "Expiring Soon", cls: "bg-[#FFE6D1] text-[#9A5A1F]" },
    expired: { label: "Expired", cls: "bg-destructive/15 text-destructive" },
  } as const;
  const v = map[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold",
        v.cls,
      )}
    >
      {v.label}
    </span>
  );
}
