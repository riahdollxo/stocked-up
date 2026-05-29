import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3,
  Camera,
  Clock,
  Database,
  Download,
  Globe,
  Ruler,
  Shield,
  Trash2,
  User,
  Users,
} from "lucide-react";

import { useApp, FEATURE_LABELS, type FeatureControls } from "@/lib/store";
import { Sparkles } from "lucide-react";

import { AppLayout } from "@/components/AppLayout";
import { MemberAvatar } from "@/components/MemberAvatar";
import { getActiveTimeZone, getDeviceTimeZone, TIME_ZONES } from "@/lib/greeting";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Stocked Up" },
      { name: "description", content: "Profile, household, privacy and preferences." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const app = useApp();
  const s = app.settings;

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

  function clearProductCache() {
    try {
      localStorage.removeItem("stocked-up:products:v1");
      toast.success("Product cache cleared");
    } catch {
      toast.error("Could not clear cache");
    }
  }

  return (
    <AppLayout>
      <h1 className="text-2xl lg:text-3xl font-bold tracking-tight mb-1">Settings</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Manage your profile, household, privacy and app preferences.
      </p>

      <div className="space-y-8 max-w-2xl">
        {/* Profile */}
        <Section title="Profile" icon={<User className="size-4" />}>
          {app.currentUser ? (
            <Link to="/household" className="card-soft p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
              <MemberAvatar member={app.currentUser} size="lg" />
              <div className="flex-1">
                <div className="font-semibold">{app.currentUser.name}</div>
                <div className="text-xs text-muted-foreground">{app.currentUser.role} · Tap to edit</div>
              </div>
            </Link>
          ) : (
            <Link to="/household" className="card-soft p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
              <div className="size-14 rounded-full bg-primary-soft text-primary grid place-items-center text-xl">
                +
              </div>
              <div className="flex-1">
                <div className="font-semibold">Create your profile</div>
                <div className="text-xs text-muted-foreground">
                  Set a name, choose a photo, emoji, or initials avatar.
                </div>
              </div>
            </Link>
          )}
        </Section>

        {/* Household */}
        <Section title="Household" icon={<Users className="size-4" />}>
          <Link to="/household" className="card-soft p-4 flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="font-semibold">Household members</div>
              <div className="text-xs text-muted-foreground">
                {app.household.length === 0
                  ? "Create your household profile to start syncing inventory activity."
                  : `${app.household.length} ${app.household.length === 1 ? "member" : "members"} · Manage roles & invites`}
              </div>
            </div>
            <span className="text-xs font-semibold text-primary">Manage →</span>
          </Link>
        </Section>

        {/* Features */}
        <Section title="Features" icon={<Sparkles className="size-4" />}>
          <p className="text-xs text-muted-foreground -mt-1 mb-1">
            Turn features on or off. Disabled features are hidden from navigation and the dashboard. Core features (Home, Inventory, Add Item, Shopping List, Settings) are always on.
          </p>
          {(Object.keys(FEATURE_LABELS) as (keyof FeatureControls)[]).map((key) => {
            const meta = FEATURE_LABELS[key];
            return (
              <Row key={key} title={meta.title} desc={meta.desc}>
                <Toggle
                  value={s.features[key]}
                  onChange={(v) => {
                    app.setFeature(key, v);
                    if (key === "demoMode") {
                      toast.success(v ? "Demo data loaded" : "Demo data cleared");
                    } else {
                      toast.success(`${meta.title} ${v ? "enabled" : "disabled"}`);
                    }
                  }}
                />
              </Row>
            );
          })}
        </Section>

        {/* Privacy & Security */}
        <Section title="Privacy & Security" icon={<Shield className="size-4" />}>
          <Row
            icon={<Camera className="size-4" />}
            title="Camera"
            desc="Used only to scan barcodes. Photos and video are never saved."
            value="Ask each time"
          />
        </Section>


        {/* App Preferences */}
        <Section title="App Preferences" icon={<Globe className="size-4" />}>
          <div className="card-soft p-5">
            <div className="flex items-start gap-3">
              <div className="size-9 rounded-xl bg-primary-soft text-primary grid place-items-center shrink-0">
                <Clock className="size-4" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">Time Zone</div>
                <p className="text-sm text-muted-foreground mt-1">
                  Used for greetings, dates, expirations, and activity.
                </p>
                <label className="mt-4 flex items-center gap-3 cursor-pointer">
                  <Toggle
                    value={s.useDeviceTimeZone}
                    onChange={(v) => app.updateSettings({ useDeviceTimeZone: v })}
                  />
                  <div className="text-sm">
                    <div className="font-semibold">Use device time zone</div>
                    <div className="text-xs text-muted-foreground">Detected: {getDeviceTimeZone()}</div>
                  </div>
                </label>
                {!s.useDeviceTimeZone && (
                  <div className="mt-4 space-y-2">
                    <select
                      value={s.manualTimeZone || getDeviceTimeZone()}
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
                  Active: <span className="font-semibold">{getActiveTimeZone(s)}</span>
                </div>
              </div>
            </div>
          </div>

          <Row icon={<BarChart3 className="size-4" />} title="Currency" desc="Used for prices and totals.">
            <select
              value={s.currency}
              onChange={(e) => app.updateSettings({ currency: e.target.value })}
              className="h-9 px-3 rounded-xl bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "MXN"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Row>

          <Row icon={<Ruler className="size-4" />} title="Measurement Units" desc="Imperial or metric.">
            <select
              value={s.units}
              onChange={(e) =>
                app.updateSettings({ units: e.target.value as "imperial" | "metric" })
              }
              className="h-9 px-3 rounded-xl bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="imperial">Imperial</option>
              <option value="metric">Metric</option>
            </select>
          </Row>
        </Section>

        {/* Data & Storage */}
        <Section title="Data & Storage" icon={<Database className="size-4" />}>
          <Row
            icon={<Database className="size-4" />}
            title="Offline storage"
            desc="Your data is saved locally on this device."
            value={app.online ? "Synced" : "Offline"}
          />
          <div className="card-soft p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold">Product cache</div>
                <div className="text-xs text-muted-foreground">
                  Cached barcode lookups for faster scans.
                </div>
              </div>
              <button
                onClick={clearProductCache}
                className="h-9 px-3 rounded-full bg-muted text-xs font-semibold"
              >
                Clear cache
              </button>
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
                  if (confirm("This will permanently delete all your data. Continue?")) {
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
        </Section>
      </div>
    </AppLayout>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display font-bold mb-3 flex items-center gap-2">
        <span className="text-primary">{icon}</span>
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Row({
  icon,
  title,
  desc,
  value,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  desc: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="card-soft p-5 flex items-start gap-4">
      {icon && (
        <div className="size-9 rounded-xl bg-primary-soft text-primary grid place-items-center shrink-0">
          {icon}
        </div>
      )}
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
