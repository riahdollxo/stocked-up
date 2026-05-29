import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Pencil, Trash2, UserPlus, X, Upload, Smile, Type, Check } from "lucide-react";
import { useApp, getInitials, type HouseholdMember, type AvatarType } from "@/lib/store";
import { AppLayout } from "@/components/AppLayout";
import { MemberAvatar } from "@/components/MemberAvatar";
import { timeAgo } from "@/lib/greeting";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/household")({
  head: () => ({
    meta: [
      { title: "Household — Stocked Up" },
      { name: "description", content: "Share inventory with everyone in your home." },
    ],
  }),
  component: HouseholdPage,
});

const ROLES: HouseholdMember["role"][] = ["Admin", "Member", "Viewer"];

const COLOR_THEMES = [
  "#7AAE7E", "#D9A86C", "#E8A28E", "#A4B8D8",
  "#C9B6E0", "#F2C57C", "#9EC9C2", "#E89BB0",
];

const EMOJI_CHOICES = ["🏡", "🌿", "🌸", "🌞", "🌙", "⭐", "🐻", "🐱", "🐶", "🦊", "🌈", "🍓", "🍋", "🌻", "💚", "✨"];

type Draft = Omit<HouseholdMember, "id" | "lastActive" | "itemsUpdated"> & { id?: string };

function HouseholdPage() {
  const app = useApp();
  const [editing, setEditing] = useState<Draft | null>(null);

  function openNew() {
    setEditing({
      name: "",
      role: "Member",
      avatarType: "initials",
      avatarColor: COLOR_THEMES[app.household.length % COLOR_THEMES.length],
      avatarEmoji: "",
      avatarImage: "",
      initials: "",
    });
  }

  function openEdit(m: HouseholdMember) {
    setEditing({
      id: m.id,
      name: m.name,
      role: m.role,
      avatarType: m.avatarType,
      avatarColor: m.avatarColor,
      avatarEmoji: m.avatarEmoji ?? "",
      avatarImage: m.avatarImage ?? "",
      initials: m.initials ?? getInitials(m.name),
    });
  }

  function save(draft: Draft) {
    const initials = draft.initials || getInitials(draft.name);
    if (!draft.name.trim()) {
      toast.error("Please add a name");
      return;
    }
    if (draft.id) {
      app.updateMember(draft.id, {
        name: draft.name,
        role: draft.role,
        avatarType: draft.avatarType,
        avatarColor: draft.avatarColor,
        avatarEmoji: draft.avatarEmoji,
        avatarImage: draft.avatarImage,
        initials,
      });
      toast.success("Profile updated");
    } else {
      app.addMember({
        name: draft.name,
        role: draft.role,
        avatarType: draft.avatarType,
        avatarColor: draft.avatarColor,
        avatarEmoji: draft.avatarEmoji,
        avatarImage: draft.avatarImage,
        initials,
      });
      toast.success(`${draft.name} invited to the household`);
    }
    setEditing(null);
  }

  function remove(id: string) {
    const m = app.household.find((x) => x.id === id);
    if (!m) return;
    if (confirm(`Remove ${m.name} from the household?`)) {
      app.removeMember(id);
      toast.success(`${m.name} removed`);
    }
  }

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Household</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {app.household.length} members · {app.settings.cloudSync ? "real-time sync" : "this device only"}
          </p>
        </div>
        <button
          onClick={openNew}
          className="px-4 h-10 rounded-full bg-primary text-primary-foreground inline-flex items-center gap-2 text-sm font-semibold shadow-sm"
        >
          <UserPlus className="size-4" /> Invite Member
        </button>
      </div>

      {/* Members grid */}
      {app.household.length === 0 ? (
        <div className="card-soft p-8 text-center">
          <div className="size-14 rounded-full bg-primary-soft text-primary grid place-items-center mx-auto mb-3">
            <UserPlus className="size-6" />
          </div>
          <h2 className="font-bold text-lg">No household members yet</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Add yourself first, then invite anyone who shares your inventory. Activity will track who updates what in real time.
          </p>
          <button
            onClick={openNew}
            className="mt-5 px-5 h-11 rounded-full bg-primary text-primary-foreground inline-flex items-center gap-2 text-sm font-semibold"
          >
            <UserPlus className="size-4" /> Add First Member
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {app.household.map((m) => (
            <div key={m.id} className="card-soft p-5">
              <div className="flex items-start gap-4">
                <button onClick={() => app.setCurrentUser(m.id)} aria-label={`Set ${m.name} as current user`}>
                  <MemberAvatar member={m} size="lg" ring={m.id === app.currentUserId} />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-bold truncate">{m.name}</div>
                    {m.id === app.currentUserId && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary-soft text-primary">
                        You
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {m.role} · {m.itemsUpdated} updates
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Last active {timeAgo(m.lastActive)}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                {m.id !== app.currentUserId && (
                  <button
                    onClick={() => app.setCurrentUser(m.id)}
                    className="flex-1 h-9 px-3 rounded-full bg-primary-soft text-primary text-xs font-semibold"
                  >
                    Set as me
                  </button>
                )}
                <select
                  value={m.role}
                  onChange={(e) =>
                    app.updateMember(m.id, { role: e.target.value as HouseholdMember["role"] })
                  }
                  className="flex-1 h-9 px-3 rounded-full bg-muted text-xs font-semibold focus:outline-none"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <button
                  onClick={() => openEdit(m)}
                  className="size-9 grid place-items-center rounded-full bg-muted text-foreground"
                  aria-label="Edit"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  onClick={() => remove(m.id)}
                  className="size-9 grid place-items-center rounded-full bg-destructive/10 text-destructive"
                  aria-label="Remove"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Activity */}
      <section className="card-soft p-5 mt-6">
        <h2 className="font-bold mb-3">Household Activity</h2>
        <ul className="divide-y divide-border">
          {app.activity.slice(0, 8).map((a) => {
            const m = app.household.find((h) => h.id === a.memberId);
            return (
              <li key={a.id} className="py-3 flex items-center gap-3">
                {m ? (
                  <MemberAvatar member={m} size="sm" />
                ) : (
                  <div className="size-8 rounded-full bg-muted grid place-items-center text-xs font-semibold">
                    {a.memberName[0]}
                  </div>
                )}
                <div className="flex-1 text-sm">
                  <span className="font-semibold">{a.memberName}</span>{" "}
                  <span className="text-muted-foreground">
                    {a.action === "purchased"
                      ? "marked"
                      : a.action === "added"
                        ? "added"
                        : a.action === "removed"
                          ? "removed"
                          : "updated"}
                  </span>{" "}
                  <span className="font-semibold">{a.itemName}</span>
                  {a.action === "purchased" && (
                    <span className="text-muted-foreground"> as purchased</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{timeAgo(a.date)}</span>
              </li>
            );
          })}
          {app.activity.length === 0 && (
            <li className="py-6 text-sm text-muted-foreground text-center">No activity yet.</li>
          )}
        </ul>
      </section>

      <div className="card-soft p-5 mt-6 bg-primary-soft/40">
        <h3 className="font-bold">Photos stay private</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Uploaded profile photos are kept on this device only. They are never shared unless you
          turn on Cloud Sync in Privacy &amp; Security.
        </p>
      </div>

      {editing && (
        <AvatarEditor
          draft={editing}
          onChange={setEditing}
          onSave={() => save(editing)}
          onClose={() => setEditing(null)}
        />
      )}
    </AppLayout>
  );
}

function AvatarEditor({
  draft,
  onChange,
  onSave,
  onClose,
}: {
  draft: Draft;
  onChange: (d: Draft) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const isEdit = !!draft.id;

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onChange({ ...draft, avatarType: "photo", avatarImage: url });
    toast.success("Photo added — stored on this device");
  }

  function removePhoto() {
    onChange({ ...draft, avatarType: "initials", avatarImage: "" });
  }

  const preview: Pick<HouseholdMember, "name" | "avatarType" | "avatarColor" | "avatarEmoji" | "avatarImage" | "initials"> = {
    name: draft.name || "?",
    avatarType: draft.avatarType,
    avatarColor: draft.avatarColor,
    avatarEmoji: draft.avatarEmoji,
    avatarImage: draft.avatarImage,
    initials: draft.initials || getInitials(draft.name || "?"),
  };

  return (
    <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm grid place-items-end sm:place-items-center px-0 sm:px-4">
      <div className="w-full sm:max-w-md bg-card rounded-t-3xl sm:rounded-3xl shadow-card max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-card/95 backdrop-blur px-5 py-4 flex items-center justify-between border-b border-border">
          <h2 className="font-bold text-lg">{isEdit ? "Edit Profile" : "Invite Member"}</h2>
          <button onClick={onClose} className="size-9 grid place-items-center rounded-full bg-muted">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Preview */}
          <div className="flex flex-col items-center gap-3 py-2">
            <MemberAvatar member={preview} size="xl" />
            <div className="text-sm text-muted-foreground">{preview.name}</div>
          </div>

          {/* Name */}
          <Field label="Name">
            <input
              autoFocus
              value={draft.name}
              onChange={(e) =>
                onChange({
                  ...draft,
                  name: e.target.value,
                  initials: getInitials(e.target.value),
                })
              }
              placeholder="First name"
              className="w-full h-11 px-4 rounded-xl bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </Field>

          {/* Role */}
          <Field label="Role">
            <div className="flex bg-muted rounded-full p-1">
              {ROLES.map((r) => (
                <button
                  key={r}
                  onClick={() => onChange({ ...draft, role: r })}
                  className={cn(
                    "flex-1 h-9 rounded-full text-xs font-semibold transition",
                    draft.role === r ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </Field>

          {/* Avatar type tabs */}
          <Field label="Avatar">
            <div className="flex bg-muted rounded-full p-1 mb-3">
              {(["photo", "emoji", "initials"] as AvatarType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => onChange({ ...draft, avatarType: t })}
                  className={cn(
                    "flex-1 h-9 rounded-full text-xs font-semibold inline-flex items-center justify-center gap-1.5 capitalize transition",
                    draft.avatarType === t
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground",
                  )}
                >
                  {t === "photo" && <Upload className="size-3.5" />}
                  {t === "emoji" && <Smile className="size-3.5" />}
                  {t === "initials" && <Type className="size-3.5" />}
                  {t}
                </button>
              ))}
            </div>

            {draft.avatarType === "photo" && (
              <div className="space-y-2">
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={handlePhoto} />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full h-11 rounded-xl bg-primary-soft text-primary font-semibold text-sm inline-flex items-center justify-center gap-2"
                >
                  <Upload className="size-4" /> {draft.avatarImage ? "Replace Photo" : "Upload Photo"}
                </button>
                {draft.avatarImage && (
                  <button
                    onClick={removePhoto}
                    className="w-full h-11 rounded-xl bg-destructive/10 text-destructive font-semibold text-sm"
                  >
                    Remove Photo
                  </button>
                )}
                <p className="text-[11px] text-muted-foreground text-center">
                  Photos stay on this device unless Cloud Sync is on.
                </p>
              </div>
            )}

            {draft.avatarType === "emoji" && (
              <div className="grid grid-cols-8 gap-2">
                {EMOJI_CHOICES.map((e) => (
                  <button
                    key={e}
                    onClick={() => onChange({ ...draft, avatarEmoji: e })}
                    className={cn(
                      "aspect-square rounded-xl bg-muted text-xl grid place-items-center transition",
                      draft.avatarEmoji === e && "ring-2 ring-primary bg-primary-soft",
                    )}
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}

            {draft.avatarType === "initials" && (
              <div className="space-y-2">
                <input
                  value={draft.initials || ""}
                  onChange={(e) =>
                    onChange({ ...draft, initials: e.target.value.slice(0, 2).toUpperCase() })
                  }
                  maxLength={2}
                  placeholder="MA"
                  className="w-full h-11 px-4 rounded-xl bg-muted text-sm font-bold tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <p className="text-[11px] text-muted-foreground text-center">
                  Up to 2 letters — auto-filled from name.
                </p>
              </div>
            )}
          </Field>

          {/* Color theme */}
          <Field label="Color theme">
            <div className="flex flex-wrap gap-2">
              {COLOR_THEMES.map((c) => (
                <button
                  key={c}
                  onClick={() => onChange({ ...draft, avatarColor: c })}
                  className={cn(
                    "size-9 rounded-full ring-offset-2 ring-offset-card transition",
                    draft.avatarColor === c && "ring-2 ring-primary",
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                >
                  {draft.avatarColor === c && (
                    <Check className="size-4 text-white mx-auto" />
                  )}
                </button>
              ))}
            </div>
          </Field>

          <button
            onClick={onSave}
            className="w-full h-12 rounded-full bg-primary text-primary-foreground font-bold"
          >
            Save Profile
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
        {label}
      </div>
      {children}
    </div>
  );
}
