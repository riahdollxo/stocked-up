import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { toast } from "sonner";

export const Route = createFileRoute("/voice")({
  head: () => ({
    meta: [
      { title: "Voice Assistant — Stocked Up" },
      { name: "description", content: "Hands-free control with voice commands." },
    ],
  }),
  component: VoicePage,
});

const EXAMPLES = [
  "Add toothpaste to my shopping list",
  "Mark paper towels low",
  "How much detergent do we have left?",
  "What's expiring this week?",
];

function VoicePage() {
  const [listening, setListening] = useState(false);

  return (
    <AppLayout>
      <h1 className="text-2xl lg:text-3xl font-bold tracking-tight mb-1">Voice Assistant</h1>
      <p className="text-sm text-muted-foreground mb-6">Hands-free control</p>

      <div className="max-w-md mx-auto">
        <div className="card-soft p-8 text-center">
          <button
            onClick={() => {
              const next = !listening;
              setListening(next);
              if (next) toast.message("Listening…", { description: "Speak your command" });
              else toast.success("Stopped listening");
            }}
            className={`size-32 rounded-full mx-auto grid place-items-center transition-all ${
              listening
                ? "bg-destructive text-destructive-foreground animate-pulse shadow-[0_0_60px_oklch(0.65_0.2_25_/_0.4)]"
                : "bg-primary text-primary-foreground shadow-lg"
            }`}
          >
            {listening ? <MicOff className="size-12" /> : <Mic className="size-12" />}
          </button>
          <p className="mt-6 font-semibold">
            {listening ? "Listening…" : "Tap to speak"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Voice commands are processed on-device when possible.
          </p>
        </div>

        <div className="card-soft p-5 mt-4">
          <h3 className="font-bold mb-3">Try saying</h3>
          <ul className="space-y-2">
            {EXAMPLES.map((ex) => (
              <li
                key={ex}
                className="px-3 py-2 rounded-xl bg-muted text-sm flex items-center gap-2"
              >
                <span className="text-primary">“</span>
                {ex}
                <span className="text-primary">”</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AppLayout>
  );
}
