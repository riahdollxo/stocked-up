import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Category =
  | "Pantry"
  | "Fridge"
  | "Freezer"
  | "Bathroom"
  | "Cleaning"
  | "Laundry"
  | "Pet Supplies"
  | "Medicine"
  | "Miscellaneous";

export const CATEGORIES: Category[] = [
  "Pantry",
  "Fridge",
  "Freezer",
  "Bathroom",
  "Cleaning",
  "Laundry",
  "Pet Supplies",
  "Medicine",
  "Miscellaneous",
];

export interface InventoryItem {
  id: string;
  name: string;
  brand?: string;
  category: Category;
  startingQuantity: number;
  usedThisMonth: number;
  addedThisMonth: number;
  lowStockLimit: number;
  price: number;
  store: string;
  lastPurchased: string;
  notes: string;
  image?: string | null;
  barcode?: string;
  packageSize?: string;
  expirationDate?: string | null;
  unit?: string;
  avgCycleDays?: number;
  isDemo?: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type AvatarType = "photo" | "emoji" | "initials";

export interface UserProfile {
  id: string;
  name?: string;
  avatarType: AvatarType;
  avatarImage?: string;
  avatarEmoji?: string;
  initials?: string;
  createdAt: string;
  timezonePreference: "device" | "manual";
  manualTimezone?: string;
  householdMemberId?: string;
}

export interface HouseholdMember {
  id: string;
  name: string;
  role: "Admin" | "Member" | "Viewer";
  avatarColor: string;
  avatarType: AvatarType;
  avatarEmoji?: string;
  avatarImage?: string;
  initials?: string;
  createdAt?: string;
  lastActive: string; // ISO
  itemsUpdated: number;
}

export interface Meal {
  id: string;
  name: string;
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  ingredients: string[];
  cooked: boolean;
  isDemo?: boolean;
}

export interface PurchaseRecord {
  itemId: string;
  date: string;
  qty: number;
  price: number;
}

export interface ShoppingListItem {
  id: string;
  inventoryItemId?: string;
  name: string;
  category: Category;
  quantityNeeded: number;
  estimatedPrice: number;
  purchased: boolean;
  purchasedBy?: string;
  purchasedAt?: string;
  createdAt: string;
  userAdded?: boolean;
}

export type ActivityType =
  | "profile_created"
  | "member_invited"
  | "item_added"
  | "item_updated"
  | "quantity_changed"
  | "item_purchased"
  | "barcode_scanned"
  | "new_month_started"
  | "settings_changed"
  | "item_removed";

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  message: string;
  actorId: string;
  actorName: string;
  actorAvatar?: string;
  itemId?: string;
  createdAt: string;
  memberId: string;
  memberName: string;
  action: "added" | "updated" | "purchased" | "removed" | "scanned" | "invited" | "settings" | "rollover" | "profile";
  itemName: string;
  date: string;
}

export interface FeatureControls {
  demoMode: boolean;
  barcodeScanner: boolean;
  aiPredictions: boolean;
  expirationTracking: boolean;
  mealPlanner: boolean;
  budgetForecasting: boolean;
  householdSharing: boolean;
  voiceAssistant: boolean;
  bulkSavings: boolean;
  cloudSync: boolean;
  localOnlyMode: boolean;
  productImageUploads: boolean;
  offlineProductCache: boolean;
}

export const DEFAULT_FEATURE_CONTROLS: FeatureControls = {
  demoMode: false,
  barcodeScanner: true,
  aiPredictions: false,
  expirationTracking: true,
  mealPlanner: false,
  budgetForecasting: true,
  householdSharing: false,
  voiceAssistant: false,
  bulkSavings: false,
  cloudSync: false,
  localOnlyMode: true,
  productImageUploads: true,
  offlineProductCache: true,
};

export const FEATURE_LABELS: Record<keyof FeatureControls, { title: string; desc: string; major?: boolean }> = {
  demoMode: { title: "Demo Mode", desc: "Populate the app with sample inventory and meals so you can explore the UI." },
  barcodeScanner: { title: "Barcode Scanner", desc: "Scan product barcodes to add items quickly." },
  aiPredictions: { title: "AI Restock Predictions", desc: "Predict when you'll run out based on usage patterns." },
  expirationTracking: { title: "Expiration Tracking", desc: "Track expiration dates and surface items expiring soon." },
  mealPlanner: { title: "Meal Planner", desc: "Plan weekly meals and link them to inventory." },
  budgetForecasting: { title: "Budget Forecasting", desc: "Forecast monthly spending based on your purchase history." },
  householdSharing: { title: "Household Sharing", desc: "Share inventory and activity with household members.", major: true },
  voiceAssistant: { title: "Voice Assistant", desc: "Add items and check stock by voice." },
  bulkSavings: { title: "Bulk Savings", desc: "Costco & Sam's optimization — compare unit prices for bulk buys." },
  cloudSync: { title: "Cloud Sync", desc: "Sync your inventory across devices.", major: true },
  localOnlyMode: { title: "Local-Only Mode", desc: "Keep all data on this device. No uploads, no sync.", major: true },
  productImageUploads: { title: "Product Image Uploads", desc: "Attach photos to inventory items." },
  offlineProductCache: { title: "Offline Product Cache", desc: "Cache barcode lookups for faster offline scans." },
};

export interface AppSettings {
  useDeviceTimeZone: boolean;
  manualTimeZone: string;
  cloudSync: boolean;
  streakDays: number;
  demoMode: boolean;
  currency: string;
  units: "imperial" | "metric";
  features: FeatureControls;
}




interface AppState {
  profile: UserProfile | null;
  inventory: InventoryItem[];
  history: PurchaseRecord[];
  household: HouseholdMember[];
  shoppingItems: ShoppingListItem[];
  meals: Meal[];
  purchased: string[];
  currentMonth: string;
  online: boolean;
  localOnlyMode: boolean;
  activity: ActivityEntry[];
  currentUserId: string;
  settings: AppSettings;
}

interface AppContextValue extends AppState {
  endingQty: (i: InventoryItem) => number;
  saveProfile: (profile: Omit<UserProfile, "id" | "createdAt"> & { id?: string }) => UserProfile;
  addItem: (item: Omit<InventoryItem, "id">) => InventoryItem;
  updateItem: (id: string, patch: Partial<InventoryItem>) => void;
  removeItem: (id: string) => void;
  addShoppingItem: (item: Omit<ShoppingListItem, "id" | "createdAt" | "purchased">) => ShoppingListItem;
  togglePurchased: (id: string) => void;
  rolloverMonth: (nextMonth: string) => void;
  setMealCooked: (id: string, cooked: boolean) => void;
  addMeal: (meal: Omit<Meal, "id">) => void;
  saveProductCache: (barcode: string, product: Partial<InventoryItem>) => void;
  lookupCachedProduct: (barcode: string) => Partial<InventoryItem> | null;
  setOnline: (v: boolean) => void;
  setLocalOnlyMode: (v: boolean) => void;
  exportData: () => string;
  clearAllData: () => void;
  addMember: (m: Omit<HouseholdMember, "id" | "lastActive" | "itemsUpdated">) => HouseholdMember;
  updateMember: (id: string, patch: Partial<HouseholdMember>) => void;
  removeMember: (id: string) => void;
  setCurrentUser: (id: string) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  setDemoMode: (on: boolean) => void;
  setFeature: <K extends keyof FeatureControls>(key: K, value: FeatureControls[K]) => void;
  isFeatureEnabled: (key: keyof FeatureControls) => boolean;
  currentUser: HouseholdMember | undefined;

}


const Ctx = createContext<AppContextValue | null>(null);

const STORAGE_KEY = "stocked-up:v2";
const PRODUCT_CACHE_KEY = "stocked-up:products:v1";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const today = () => new Date().toISOString();
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};
const daysAhead = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
};

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const normalizeItem = (item: Omit<InventoryItem, "id">, actorId?: string): InventoryItem => {
  const now = today();
  return {
    ...item,
    id: uid(),
    startingQuantity: Number(item.startingQuantity) || 0,
    usedThisMonth: Number(item.usedThisMonth) || 0,
    addedThisMonth: Number(item.addedThisMonth) || 0,
    lowStockLimit: Number(item.lowStockLimit) || 0,
    price: Number(item.price) || 0,
    store: item.store || "",
    lastPurchased: item.lastPurchased || now,
    notes: item.notes || "",
    createdBy: item.createdBy || actorId,
    updatedBy: item.updatedBy || actorId,
    createdAt: item.createdAt || now,
    updatedAt: now,
  };
};

const DEMO_INVENTORY = (): InventoryItem[] => [
  { id: uid(), name: "Paper Towels", brand: "Bounty", category: "Cleaning", startingQuantity: 5, usedThisMonth: 2, addedThisMonth: 0, lowStockLimit: 4, price: 15.49, store: "Walmart", lastPurchased: daysAgo(12), notes: "Our go-to brand. Works the best!", barcode: "037000746225", packageSize: "6 rolls", unit: "packs", avgCycleDays: 21, isDemo: true, createdAt: daysAgo(30), updatedAt: daysAgo(2) },
  { id: uid(), name: "Dish Soap", brand: "Dawn", category: "Cleaning", startingQuantity: 2, usedThisMonth: 1, addedThisMonth: 0, lowStockLimit: 1, price: 2.99, store: "Walmart", lastPurchased: daysAgo(18), notes: "", barcode: "012546677789", packageSize: "1 bottle", unit: "bottle", avgCycleDays: 25, isDemo: true, createdAt: daysAgo(30), updatedAt: daysAgo(3) },
  { id: uid(), name: "Toothpaste", brand: "Crest", category: "Bathroom", startingQuantity: 3, usedThisMonth: 1, addedThisMonth: 0, lowStockLimit: 1, price: 3.99, store: "Target", lastPurchased: daysAgo(30), notes: "", barcode: "030772047423", packageSize: "1 tube", unit: "tube", avgCycleDays: 45, isDemo: true, createdAt: daysAgo(45), updatedAt: daysAgo(5) },
  { id: uid(), name: "Oatmeal", brand: "Quaker", category: "Pantry", startingQuantity: 3, usedThisMonth: 1, addedThisMonth: 0, lowStockLimit: 1, price: 3.48, store: "Aldi", lastPurchased: daysAgo(20), notes: "", expirationDate: daysAhead(180), unit: "box", avgCycleDays: 30, isDemo: true, createdAt: daysAgo(32), updatedAt: daysAgo(4) },
  { id: uid(), name: "Milk", brand: "Horizon", category: "Fridge", startingQuantity: 2, usedThisMonth: 1, addedThisMonth: 0, lowStockLimit: 1, price: 4.29, store: "Walmart", lastPurchased: daysAgo(3), notes: "", expirationDate: daysAhead(3), unit: "gallon", avgCycleDays: 7, isDemo: true, createdAt: daysAgo(10), updatedAt: daysAgo(1) },
  { id: uid(), name: "Greek Yogurt", brand: "Chobani", category: "Fridge", startingQuantity: 4, usedThisMonth: 2, addedThisMonth: 0, lowStockLimit: 2, price: 1.25, store: "Aldi", lastPurchased: daysAgo(5), notes: "", expirationDate: daysAhead(5), unit: "cup", avgCycleDays: 10, isDemo: true, createdAt: daysAgo(12), updatedAt: daysAgo(1) },
  { id: uid(), name: "Vitamins", brand: "Nature Made", category: "Medicine", startingQuantity: 2, usedThisMonth: 0, addedThisMonth: 0, lowStockLimit: 1, price: 8.99, store: "CVS", lastPurchased: daysAgo(50), notes: "", expirationDate: daysAhead(8), unit: "bottle", avgCycleDays: 90, isDemo: true, createdAt: daysAgo(60), updatedAt: daysAgo(10) },
];

const DEMO_MEALS = (): Meal[] => [
  { id: uid(), name: "Lemon Garlic Salmon", day: "Mon", ingredients: ["Salmon", "Lemon", "Garlic"], cooked: true, isDemo: true },
  { id: uid(), name: "Chicken Stir Fry", day: "Tue", ingredients: ["Chicken", "Pasta", "Soy Sauce"], cooked: true, isDemo: true },
  { id: uid(), name: "Taco Night", day: "Wed", ingredients: ["Tortillas", "Beef", "Cheese"], cooked: false, isDemo: true },
  { id: uid(), name: "Pasta Primavera", day: "Thu", ingredients: ["Pasta", "Tomato", "Basil"], cooked: false, isDemo: true },
];

function seedData(): AppState {
  return {
    profile: null,
    inventory: [],
    history: [],
    household: [],
    shoppingItems: [],
    meals: [],
    purchased: [],
    currentMonth: new Date().toLocaleString("en-US", { month: "long", year: "numeric" }),
    online: true,
    localOnlyMode: false,
    activity: [],
    currentUserId: "",
    settings: {
      useDeviceTimeZone: true,
      manualTimeZone: "",
      cloudSync: false,
      streakDays: 0,
      demoMode: false,
      currency: "USD",
      units: "imperial",
      features: { ...DEFAULT_FEATURE_CONTROLS },
    },

  };
}


function load(): AppState {
  if (typeof window === "undefined") return seedData();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedData();
    const parsed = JSON.parse(raw) as Partial<AppState>;
    const seed = seedData();
    const parsedSettings: Partial<AppSettings> = parsed.settings ?? {};
    return {
      ...seed,
      ...parsed,
      settings: {
        ...seed.settings,
        ...parsedSettings,
        features: { ...seed.settings.features, ...(parsedSettings.features ?? {}) },
      },
    };


  } catch {
    return seedData();
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => seedData());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(load());
    setHydrated(true);
    const onOnline = () => setState((s) => ({ ...s, online: true }));
    const onOffline = () => setState((s) => ({ ...s, online: false }));
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state, hydrated]);

  const endingQty = useCallback(
    (i: InventoryItem) => i.startingQuantity + i.addedThisMonth - i.usedThisMonth,
    [],
  );

  const value = useMemo<AppContextValue>(() => {
    const currentUser = state.household.find((m) => m.id === state.currentUserId);

    const pushActivity = (
      s: AppState,
      action: ActivityEntry["action"],
      itemName: string,
      type: ActivityType = "item_updated",
      message?: string,
      itemId?: string,
    ): AppState => {
      const user = s.household.find((m) => m.id === s.currentUserId);
      if (!user) return s;
      const createdAt = today();
      const entry: ActivityEntry = {
        id: uid(),
        type,
        message: message ?? `${user.name} ${action} ${itemName}`,
        actorId: user.id,
        actorName: user.name,
        actorAvatar: user.avatarImage || user.avatarEmoji || user.initials,
        itemId,
        createdAt,
        memberId: user.id,
        memberName: user.name,
        action,
        itemName,
        date: createdAt,
      };
      return {
        ...s,
        activity: [entry, ...s.activity].slice(0, 50),
        household: s.household.map((m) =>
          m.id === user.id ? { ...m, lastActive: today(), itemsUpdated: m.itemsUpdated + 1 } : m,
        ),
      };
    };

    return {
      ...state,
      currentUser,
      endingQty,
      saveProfile(profileDraft) {
        const now = today();
        const profile: UserProfile = {
          ...profileDraft,
          id: profileDraft.id || state.profile?.id || uid(),
          name: profileDraft.name?.trim() || undefined,
          createdAt: state.profile?.createdAt || now,
          timezonePreference: profileDraft.timezonePreference ?? "device",
          manualTimezone: profileDraft.manualTimezone ?? "",
        };
        setState((s) => {
          const existingMemberId = profile.householdMemberId || s.profile?.householdMemberId;
          const existingMember = existingMemberId
            ? s.household.find((m) => m.id === existingMemberId)
            : undefined;
          let nextHousehold = s.household;
          let householdMemberId = existingMemberId;
          if (profile.name) {
            const memberPatch = {
              name: profile.name,
              avatarType: profile.avatarType,
              avatarImage: profile.avatarImage,
              avatarEmoji: profile.avatarEmoji,
              initials: profile.initials || getInitials(profile.name),
            };
            if (existingMember) {
              nextHousehold = s.household.map((m) =>
                m.id === existingMember.id ? { ...m, ...memberPatch } : m,
              );
              householdMemberId = existingMember.id;
            } else {
              householdMemberId = uid();
              nextHousehold = [
                ...s.household,
                {
                  id: householdMemberId,
                  role: "Admin",
                  avatarColor: "#7AAE7E",
                  createdAt: now,
                  lastActive: now,
                  itemsUpdated: 0,
                  ...memberPatch,
                },
              ];
            }
          }
          const next = {
            ...s,
            profile: { ...profile, householdMemberId },
            household: nextHousehold,
            currentUserId: s.currentUserId || householdMemberId || "",
          };
          return householdMemberId && profile.name && !s.profile
            ? pushActivity(next, "profile", profile.name, "profile_created", `${profile.name} created a household profile`)
            : next;
        });
        return profile;
      },
      addItem(item) {
        const newItem: InventoryItem = normalizeItem(item, state.currentUserId);
        setState((s) => pushActivity({ ...s, inventory: [...s.inventory, newItem] }, "added", newItem.name, "item_added", `${currentUser?.name ?? "Someone"} added ${newItem.name}`, newItem.id));
        return newItem;
      },
      updateItem(id, patch) {
        setState((s) => {
          const item = s.inventory.find((it) => it.id === id);
          const quantityChanged = !!item && ["startingQuantity", "usedThisMonth", "addedThisMonth"].some((key) => key in patch);
          const next = {
            ...s,
            inventory: s.inventory.map((it) => (it.id === id ? { ...it, ...patch, updatedBy: s.currentUserId || it.updatedBy, updatedAt: today() } : it)),
          };
          return item ? pushActivity(next, "updated", item.name, quantityChanged ? "quantity_changed" : "item_updated", quantityChanged ? `${currentUser?.name ?? "Someone"} changed quantity for ${item.name}` : `${currentUser?.name ?? "Someone"} updated ${item.name}`, item.id) : next;
        });
      },
      removeItem(id) {
        setState((s) => {
          const item = s.inventory.find((it) => it.id === id);
          const next = {
            ...s,
            inventory: s.inventory.filter((it) => it.id !== id),
            purchased: s.purchased.filter((p) => p !== id),
            shoppingItems: s.shoppingItems.filter((p) => p.inventoryItemId !== id),
          };
          return item ? pushActivity(next, "removed", item.name, "item_removed", `${currentUser?.name ?? "Someone"} removed ${item.name}`, item.id) : next;
        });
      },
      addShoppingItem(item) {
        const newItem: ShoppingListItem = {
          ...item,
          id: uid(),
          createdAt: today(),
          purchased: false,
          userAdded: true,
        };
        setState((s) => ({ ...s, shoppingItems: [...s.shoppingItems, newItem] }));
        return newItem;
      },
      togglePurchased(id) {
        setState((s) => {
          const isPurchased = s.purchased.includes(id);
          if (isPurchased) {
            return {
              ...s,
              purchased: s.purchased.filter((p) => p !== id),
              shoppingItems: s.shoppingItems.map((p) =>
                p.inventoryItemId === id ? { ...p, purchased: false, purchasedBy: undefined, purchasedAt: undefined } : p,
              ),
            };
          }
          const item = s.inventory.find((it) => it.id === id);
          const purchasedAt = today();
          const inv = s.inventory.map((it) =>
            it.id === id
              ? { ...it, addedThisMonth: it.addedThisMonth + 1, lastPurchased: purchasedAt, updatedBy: s.currentUserId, updatedAt: purchasedAt }
              : it,
          );
          const next = {
            ...s,
            purchased: [...s.purchased, id],
            inventory: inv,
            history: item ? [...s.history, { itemId: item.id, date: purchasedAt, qty: 1, price: item.price }] : s.history,
            shoppingItems: s.shoppingItems.map((p) =>
              p.inventoryItemId === id
                ? { ...p, purchased: true, purchasedBy: s.currentUserId, purchasedAt }
                : p,
            ),
          };
          return item ? pushActivity(next, "purchased", item.name, "item_purchased", `${currentUser?.name ?? "Someone"} marked ${item.name} as purchased`, item.id) : next;
        });
      },
      rolloverMonth(nextMonth) {
        setState((s) =>
          pushActivity(
            {
              ...s,
              currentMonth: nextMonth,
              purchased: [],
              shoppingItems: s.shoppingItems.filter((it) => !it.purchased),
              inventory: s.inventory.map((it) => ({
                ...it,
                startingQuantity: it.startingQuantity + it.addedThisMonth - it.usedThisMonth,
                usedThisMonth: 0,
                addedThisMonth: 0,
                updatedAt: today(),
              })),
            },
            "rollover",
            nextMonth,
            "new_month_started",
            `${currentUser?.name ?? "Someone"} started ${nextMonth}`,
          ),
        );
      },
      setMealCooked(id, cooked) {
        setState((s) => ({
          ...s,
          meals: s.meals.map((m) => (m.id === id ? { ...m, cooked } : m)),
        }));
      },
      addMeal(meal) {
        setState((s) => ({ ...s, meals: [...s.meals, { ...meal, id: uid() }] }));
      },
      saveProductCache(barcode, product) {
        if (typeof window === "undefined") return;
        try {
          const raw = localStorage.getItem(PRODUCT_CACHE_KEY);
          const cache = raw ? JSON.parse(raw) : {};
          cache[barcode] = product;
          localStorage.setItem(PRODUCT_CACHE_KEY, JSON.stringify(cache));
        } catch {
          // ignore
        }
      },
      lookupCachedProduct(barcode) {
        if (typeof window === "undefined") return null;
        try {
          const raw = localStorage.getItem(PRODUCT_CACHE_KEY);
          if (!raw) return null;
          const cache = JSON.parse(raw);
          return cache[barcode] ?? null;
        } catch {
          return null;
        }
      },
      setOnline(v) {
        setState((s) => ({ ...s, online: v }));
      },
      setLocalOnlyMode(v) {
        setState((s) => ({ ...s, localOnlyMode: v }));
      },
      exportData() {
        return JSON.stringify(state, null, 2);
      },
      clearAllData() {
        if (typeof window !== "undefined") {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(PRODUCT_CACHE_KEY);
        }
        setState(seedData());
      },
      addMember(m) {
        const createdAt = today();
        const newMember: HouseholdMember = {
          ...m,
          id: uid(),
          createdAt,
          lastActive: createdAt,
          itemsUpdated: 0,
          initials: m.initials || getInitials(m.name),
        };
        setState((s) => {
          const next = {
            ...s,
            household: [...s.household, newMember],
            currentUserId: s.currentUserId || newMember.id,
          };
          return next.currentUserId
            ? pushActivity(next, "invited", newMember.name, "member_invited", `${newMember.name} joined the household`)
            : next;
        });
        return newMember;
      },
      updateMember(id, patch) {
        setState((s) => {
          const nextHousehold = s.household.map((m) => (m.id === id ? { ...m, ...patch } : m));
          return {
            ...s,
            household: nextHousehold,
            profile:
              s.profile?.householdMemberId === id
                ? {
                    ...s.profile,
                    name: typeof patch.name === "string" ? patch.name : s.profile.name,
                    avatarType: patch.avatarType ?? s.profile.avatarType,
                    avatarImage: patch.avatarImage ?? s.profile.avatarImage,
                    avatarEmoji: patch.avatarEmoji ?? s.profile.avatarEmoji,
                    initials: patch.initials ?? s.profile.initials,
                  }
                : s.profile,
          };
        });
      },
      removeMember(id) {
        setState((s) => ({
          ...s,
          household: s.household.filter((m) => m.id !== id),
          currentUserId:
            s.currentUserId === id ? s.household[0]?.id ?? "" : s.currentUserId,
        }));
      },
      setCurrentUser(id) {
        setState((s) => ({ ...s, currentUserId: id }));
      },
      updateSettings(patch) {
        setState((s) => {
          const next = { ...s, settings: { ...s.settings, ...patch } };
          return Object.keys(patch).length > 0
            ? pushActivity(next, "settings", "settings", "settings_changed", `${currentUser?.name ?? "Someone"} updated settings`)
            : next;
        });
      },
      setDemoMode(on) {
        setState((s) => {
          if (on) {
            return {
              ...s,
              inventory: s.inventory.some((i) => i.isDemo) ? s.inventory : [...s.inventory, ...DEMO_INVENTORY()],
              meals: s.meals.some((m) => m.isDemo) ? s.meals : [...s.meals, ...DEMO_MEALS()],
              settings: { ...s.settings, demoMode: true, features: { ...s.settings.features, demoMode: true } },
            };
          }
          return {
            ...s,
            inventory: s.inventory.filter((i) => !i.isDemo),
            meals: s.meals.filter((m) => !m.isDemo),
            history: s.history.filter((h) => s.inventory.some((i) => i.id === h.itemId && !i.isDemo)),
            purchased: s.purchased.filter((id) => s.inventory.some((i) => i.id === id && !i.isDemo)),
            shoppingItems: s.shoppingItems.filter((it) => !it.inventoryItemId || s.inventory.some((i) => i.id === it.inventoryItemId && !i.isDemo)),
            settings: { ...s.settings, demoMode: false, features: { ...s.settings.features, demoMode: false } },
          };
        });
      },
      setFeature(key, value) {
        if (key === "demoMode") {
          this.setDemoMode(Boolean(value));
          return;
        }
        const meta = FEATURE_LABELS[key];
        setState((s) => {
          let next: AppState = {
            ...s,
            settings: { ...s.settings, features: { ...s.settings.features, [key]: value } },
          };
          if (key === "localOnlyMode") {
            next = {
              ...next,
              localOnlyMode: Boolean(value),
              settings: {
                ...next.settings,
                features: { ...next.settings.features, cloudSync: value ? false : next.settings.features.cloudSync },
              },
            };
          }
          if (key === "cloudSync") {
            next = {
              ...next,
              localOnlyMode: value ? false : next.localOnlyMode,
              settings: {
                ...next.settings,
                cloudSync: Boolean(value),
                features: { ...next.settings.features, localOnlyMode: value ? false : next.settings.features.localOnlyMode },
              },
            };
          }
          if (meta?.major && s.currentUserId) {
            return pushActivity(
              next,
              "settings",
              meta.title,
              "settings_changed",
              `${currentUser?.name ?? "Someone"} ${value ? "enabled" : "disabled"} ${meta.title}`,
            );
          }
          return next;
        });
      },
      isFeatureEnabled(key) {
        return state.settings.features[key];
      },

    };
  }, [state, endingQty]);


  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

export const DEMO_PRODUCTS: Record<
  string,
  {
    name: string;
    brand: string;
    category: Category;
    packageSize: string;
    lowStockLimit: number;
    price: number;
    store: string;
  }
> = {
  "037000746225": { name: "Bounty Paper Towels", brand: "Bounty", category: "Cleaning", packageSize: "6 rolls", lowStockLimit: 2, price: 15.49, store: "Walmart" },
  "012546677789": { name: "Dawn Dish Soap", brand: "Dawn", category: "Cleaning", packageSize: "1 bottle", lowStockLimit: 1, price: 2.99, store: "Walmart" },
  "030772047423": { name: "Crest Toothpaste", brand: "Crest", category: "Bathroom", packageSize: "1 tube", lowStockLimit: 1, price: 3.99, store: "Target" },
  "038000138416": { name: "Frosted Flakes", brand: "Kellogg's", category: "Pantry", packageSize: "1 box", lowStockLimit: 1, price: 4.49, store: "Walmart" },
  "036000291452": { name: "Scott Toilet Paper", brand: "Scott", category: "Bathroom", packageSize: "12 rolls", lowStockLimit: 2, price: 8.99, store: "Costco" },
};

export function lookupBarcode(barcode: string) {
  return DEMO_PRODUCTS[barcode] ?? null;
}

export function daysUntil(dateISO?: string | null) {
  if (!dateISO) return null;
  const ms = new Date(dateISO).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function categoryIcon(c: Category): string {
  const map: Record<Category, string> = {
    Pantry: "🧺",
    Fridge: "🧊",
    Freezer: "❄️",
    Bathroom: "🛁",
    Cleaning: "🧴",
    Laundry: "🧺",
    "Pet Supplies": "🐾",
    Medicine: "💊",
    Miscellaneous: "📦",
  };
  return map[c];
}
