import { createFileRoute } from "@tanstack/react-router";
import { Camera, Clock, Download, ShieldCheck, Trash2, Wifi } from "lucide-react";
import { useApp } from "@/lib/store";
import { AppLayout } from "@/components/AppLayout";
import { getActiveTimeZone, getDeviceTimeZone, TIME_ZONES } from "@/lib/greeting";
import { toast } from "sonner";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy & Security — Stocked Up" },
      { name: "description", content: "Camera, sync, and data controls." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const app = useApp();

  function exportData() {
    const data = app.exportData();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "stocked-up-export.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data exported");
  }

  return (
    <AppLayout>
      <h1 className="text-2xl lg:text-3xl font-bold tracking-tight mb-1 flex items-center gap-2">
        <ShieldCheck className="size-6 text-primary" /> Privacy &amp; Security
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        We never sell your data, share your inventory, or show ads.
      </p>

      <div className="space-y-4 max-w-2xl">
        <SettingRow
          icon={<Camera className="size-4" />}
          title="Camera"
          desc="Used only to scan barcodes. Photos and video are never saved unless you upload a product image."
          value="Ask each time"
        />

        <SettingRow
          icon={<Wifi className="size-4" />}
          title="Cloud Sync"
          desc="Sync your inventory across devices. Off means everything stays local on this device."
        >
          <Toggle
            value={!app.localOnlyMode}
            onChange={(v) => {
              app.setLocalOnlyMode(!v);
              toast.success(v ? "Cloud sync on" : "Local-only mode on");
            }}
          />
        </SettingRow>

        <SettingRow
          icon={<ShieldCheck className="size-4" />}
          title="Local-only Mode"
          desc="Keep all data on this device. No uploads, no sync, no cloud."
        >
          <Toggle
            value={app.localOnlyMode}
            onChange={(v) => app.setLocalOnlyMode(v)}
          />
        </SettingRow>

        {/* Time Zone */}
        <div className="card-soft p-5">
          <div className="flex items-start gap-4">
            <div className="size-9 rounded-xl bg-primary-soft text-primary grid place-items-center shrink-0">
              <Clock className="size-4" />
            </div>
            <div className="flex-1">
              <div className="font-semibold">Time Zone</div>
              <p className="text-sm text-muted-foreground mt-1">
                Used for greetings, dates, expirations, and activity. Stocked Up uses your device
                time zone setting. Location access is not required.
              </p>

              <label className="mt-4 flex items-center gap-3 cursor-pointer">
                <Toggle
                  value={app.settings.useDeviceTimeZone}
                  onChange={(v) => app.updateSettings({ useDeviceTimeZone: v })}
                />
                <div className="text-sm">
                  <div className="font-semibold">Use device time zone automatically</div>
                  <div className="text-xs text-muted-foreground">
                    Detected: {getDeviceTimeZone()}
                  </div>
                </div>
              </label>

              {!app.settings.useDeviceTimeZone && (
                <div className="mt-4 space-y-2">
                  <select
                    value={app.settings.manualTimeZone || getDeviceTimeZone()}
                    onChange={(e) => app.updateSettings({ manualTimeZone: e.target.value })}
                    className="w-full h-11 px-3 rounded-xl bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {TIME_ZONES.map((tz) => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      app.updateSettings({ useDeviceTimeZone: true, manualTimeZone: "" });
                      toast.success("Reset to device time zone");
                    }}
                    className="w-full h-10 rounded-full bg-muted text-sm font-semibold"
                  >
                    Reset to device time zone
                  </button>
                </div>
              )}

              <div className="mt-3 text-[11px] text-muted-foreground">
                Active: <span className="font-semibold">{getActiveTimeZone(app.settings)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card-soft p-5">
          <h3 className="font-bold">Your Data</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Download a copy of everything or wipe your device clean.
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <button
              onClick={exportData}
              className="flex-1 h-11 rounded-full bg-card border border-border font-semibold text-sm inline-flex items-center justify-center gap-2"
            >
              <Download className="size-4" /> Export My Data
            </button>
            <button
              onClick={() => {
                if (confirm("This will permanently delete all your inventory data. Continue?")) {
                  app.clearAllData();
                  toast.success("All data cleared");
                }
              }}
              className="flex-1 h-11 rounded-full bg-destructive/10 text-destructive font-semibold text-sm inline-flex items-center justify-center gap-2"
            >
              <Trash2 className="size-4" /> Delete My Data
            </button>
          </div>
        </div>

        <div className="card-soft p-5 bg-primary-soft/40">
          <h3 className="font-bold">Our Promise</h3>
          <ul className="text-sm text-muted-foreground mt-2 space-y-1.5 list-disc pl-4">
            <li>We never sell your data.</li>
            <li>We don't share your inventory or shopping habits with advertisers.</li>
            <li>All online lookups use encrypted connections.</li>
            <li>Offline data stays on your device.</li>
          </ul>
        </div>
      </div>
    </AppLayout>
  );
}

function SettingRow({
  icon,
  title,
  desc,
  value,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="card-soft p-5 flex items-start gap-4">
      <div className="size-9 rounded-xl bg-primary-soft text-primary grid place-items-center shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <div className="font-semibold">{title}</div>
        <div className="text-sm text-muted-foreground mt-1">{desc}</div>
      </div>
      <div>
        {children ?? (value && <span className="text-xs font-semibold text-muted-foreground">{value}</span>)}
      </div>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`w-11 h-6 rounded-full p-0.5 transition-colors ${value ? "bg-primary" : "bg-muted"}`}
    >
      <span
        className={`block size-5 rounded-full bg-white shadow-sm transition-transform ${
          value ? "translate-x-5" : ""
        }`}
      />
    </button>
  );
}
