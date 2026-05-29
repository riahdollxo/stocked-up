import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, ChefHat, Plus } from "lucide-react";
import { useApp } from "@/lib/store";
import { AppLayout } from "@/components/AppLayout";
import { toast } from "sonner";

export const Route = createFileRoute("/meals")({
  head: () => ({
    meta: [
      { title: "Meal Planner — Stocked Up" },
      { name: "description", content: "Plan weekly meals and auto-build your shopping list." },
    ],
  }),
  component: MealsPage,
});

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function MealsPage() {
  const app = useApp();
  const [name, setName] = useState("");
  const [day, setDay] = useState<(typeof DAYS)[number]>("Mon");
  const [ingredients, setIngredients] = useState("");

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Meal Planner</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Plan meals and auto-update your pantry when cooked
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="card-soft overflow-hidden">
          <div className="grid grid-cols-[60px_1fr_auto] divide-y divide-border">
            {DAYS.map((d) => {
              const meal = app.meals.find((m) => m.day === d);
              return (
                <div key={d} className="contents">
                  <div className="px-4 py-4 font-bold text-muted-foreground border-r border-border">
                    {d}
                  </div>
                  <div className="px-4 py-4">
                    {meal ? (
                      <div>
                        <div className="font-semibold">{meal.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {meal.ingredients.join(", ")}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground italic">No meal planned</div>
                    )}
                  </div>
                  <div className="px-4 py-4 flex items-center">
                    {meal && (
                      <button
                        onClick={() => {
                          app.setMealCooked(meal.id, !meal.cooked);
                          if (!meal.cooked) toast.success(`Marked ${meal.name} cooked`);
                        }}
                        className={`px-3 h-8 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${
                          meal.cooked
                            ? "bg-primary-soft text-primary"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        <Check className="size-3" /> {meal.cooked ? "Cooked" : "Mark Cooked"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card-soft p-5">
          <h3 className="font-bold mb-3 inline-flex items-center gap-2">
            <ChefHat className="size-4" /> Add a Meal
          </h3>
          <div className="space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Meal name"
              className="w-full h-11 px-3 rounded-xl bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <select
              value={day}
              onChange={(e) => setDay(e.target.value as (typeof DAYS)[number])}
              className="w-full h-11 px-3 rounded-xl bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {DAYS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <input
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              placeholder="Ingredients (comma separated)"
              className="w-full h-11 px-3 rounded-xl bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              onClick={() => {
                if (!name) return;
                app.addMeal({
                  name,
                  day,
                  ingredients: ingredients.split(",").map((s) => s.trim()).filter(Boolean),
                  cooked: false,
                });
                setName("");
                setIngredients("");
                toast.success("Meal added");
              }}
              className="w-full h-11 rounded-full bg-primary text-primary-foreground font-semibold inline-flex items-center justify-center gap-2"
            >
              <Plus className="size-4" /> Save Meal
            </button>
          </div>

          <div className="mt-6 p-3 rounded-xl bg-accent/40 text-xs text-accent-foreground">
            💡 Cooked meals automatically reduce the matching pantry quantities and add any
            missing ingredients to your shopping list.
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
