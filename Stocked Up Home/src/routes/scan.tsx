import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Flashlight,
  Keyboard,
  ScanLine,
  ShieldCheck,
  Wifi,
  WifiOff,
} from "lucide-react";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { useApp, lookupBarcode, CATEGORIES, type Category, DEMO_PRODUCTS } from "@/lib/store";
import { AppLayout } from "@/components/AppLayout";
import { CategoryThumb } from "@/components/CategoryBadge";
import { toast } from "sonner";

export const Route = createFileRoute("/scan")({
  head: () => ({
    meta: [
      { title: "Scan Item — Stocked Up" },
      { name: "description", content: "Scan a barcode to add items to your inventory fast." },
    ],
  }),
  component: ScanPage,
});

type Stage = "permission" | "scanning" | "result" | "manual" | "notFound";
type CamStatus = "idle" | "loading" | "ready" | "denied" | "notfound" | "inuse" | "unsupported" | "error";

interface FoundProduct {
  barcode: string;
  name: string;
  brand: string;
  category: Category;
  packageSize: string;
  lowStockLimit: number;
  price: number;
  store: string;
  source: "cache" | "online" | "demo";
}

export default function ScanPage() {
  const navigate = useNavigate();
  const app = useApp();
  const [stage, setStage] = useState<Stage>("permission");
  const [camStatus, setCamStatus] = useState<CamStatus>("idle");
  const [camMessage, setCamMessage] = useState("");
  const [flashlight, setFlashlight] = useState(false);
  const [flashSupported, setFlashSupported] = useState(false);
  const [multiScan, setMultiScan] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState<FoundProduct | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const controlsRef = useRef<IScannerControls | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const stageRef = useRef<Stage>(stage);
  stageRef.current = stage;

  useEffect(() => {
    // Auto-start camera when scan page mounts
    requestCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  function stopCamera() {
    try { controlsRef.current?.stop(); } catch { /* noop */ }
    controlsRef.current = null;
    const v = videoRef.current;
    const stream = v?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    if (v) v.srcObject = null;
    setFlashSupported(false);
    setFlashlight(false);
  }

  async function toggleFlashlight() {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    const track = stream?.getVideoTracks()[0];
    if (!track) return;
    const next = !flashlight;
    try {
      await track.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] });
      setFlashlight(next);
    } catch {
      toast.error("Flashlight not supported on this device");
    }
  }

  async function requestCamera() {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCamStatus("unsupported");
      setCamMessage("Camera unavailable in preview. Test on a real device or deployed app.");
      setStage("manual");
      return;
    }
    setStage("scanning");
    setCamStatus("loading");
    setCamMessage("Starting camera…");
    try {
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;
      // small wait to ensure <video> mounted
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const videoEl = videoRef.current;
      if (!videoEl) throw new Error("Video element missing");
      const controls = await reader.decodeFromConstraints(
        { video: { facingMode: { ideal: "environment" } } },
        videoEl,
        (result, err) => {
          if (result && stageRef.current === "scanning") {
            handleScan(result.getText());
          }
        },
      );
      controlsRef.current = controls;
      setCamStatus("ready");
      setCamMessage("");
      // detect torch support
      const track = (videoEl.srcObject as MediaStream | null)?.getVideoTracks()[0];
      const caps = (track as MediaStreamTrack & { getCapabilities?: () => MediaTrackCapabilities })?.getCapabilities?.();
      if (caps && "torch" in caps) setFlashSupported(true);
    } catch (e) {
      const err = e as DOMException;
      stopCamera();
      if (err?.name === "NotAllowedError" || err?.name === "SecurityError") {
        setCamStatus("denied");
        setCamMessage("Camera permission denied. Enable camera access in your browser settings to scan barcodes.");
      } else if (err?.name === "NotFoundError" || err?.name === "OverconstrainedError") {
        setCamStatus("notfound");
        setCamMessage("No camera found on this device.");
      } else if (err?.name === "NotReadableError") {
        setCamStatus("inuse");
        setCamMessage("Camera is in use by another app. Close it and try again.");
      } else {
        setCamStatus("error");
        setCamMessage("Scanner failed to initialize. Try again or enter the barcode manually.");
      }
      setStage("manual");
    }
  }

  function findProduct(barcode: string): FoundProduct | null {
    const cached = app.lookupCachedProduct(barcode);
    if (cached && cached.name) {
      return {
        barcode,
        name: cached.name,
        brand: cached.brand ?? "",
        category: (cached.category as Category) ?? "Miscellaneous",
        packageSize: cached.packageSize ?? "1 unit",
        lowStockLimit: cached.lowStockLimit ?? 1,
        price: cached.price ?? 0,
        store: cached.store ?? "",
        source: "cache",
      };
    }
    const demo = app.settings.demoMode ? lookupBarcode(barcode) : null;
    if (demo) {
      const found: FoundProduct = { barcode, ...demo, source: "online" };
      app.saveProductCache(barcode, demo);
      return found;
    }
    return null;
  }

  function handleScan(barcode: string) {
    stopCamera();
    if (navigator.vibrate) navigator.vibrate(40);
    const found = findProduct(barcode);
    if (found) {
      setProduct(found);
      setStage("result");
    } else {
      setProduct({
        barcode,
        name: "",
        brand: "",
        category: "Miscellaneous",
        packageSize: "1 unit",
        lowStockLimit: 1,
        price: 0,
        store: "",
        source: "online",
      });
      setStage("notFound");
    }
  }

  function saveItem() {
    if (!product) return;
    const existing = app.inventory.find((i) => i.barcode === product.barcode);
    if (existing) {
      app.updateItem(existing.id, {
        addedThisMonth: existing.addedThisMonth + quantity,
        lastPurchased: new Date().toISOString(),
      });
      toast.success(`Added ${quantity} to ${product.name}`);
    } else {
      app.addItem({
        name: product.name,
        brand: product.brand,
        category: product.category,
        startingQuantity: 0,
        usedThisMonth: 0,
        addedThisMonth: quantity,
        lowStockLimit: product.lowStockLimit,
        price: product.price,
        store: product.store,
        lastPurchased: new Date().toISOString(),
        notes: "",
        barcode: product.barcode,
        packageSize: product.packageSize,
      });
      toast.success(`${product.name} added to inventory`);
    }
    app.saveProductCache(product.barcode, product);
    setScanCount((c) => c + 1);

    if (multiScan) {
      setProduct(null);
      setQuantity(1);
      requestCamera();
    } else {
      navigate({ to: "/inventory" });
    }
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => {
            stopCamera();
            navigate({ to: "/" });
          }}
          className="size-10 grid place-items-center rounded-full bg-card border border-border"
        >
          <ArrowLeft className="size-4" />
        </button>
        <h1 className="font-bold">Scan Item</h1>
        <div className="flex items-center gap-2">
          <span
            className={`text-[11px] font-semibold inline-flex items-center gap-1 px-2 h-7 rounded-full ${
              app.online ? "bg-primary-soft text-primary" : "bg-warning/20 text-warning-foreground"
            }`}
          >
            {app.online ? <Wifi className="size-3" /> : <WifiOff className="size-3" />}
            {app.online ? "Online" : "Offline"}
          </span>
        </div>
      </div>

      <div className="max-w-xl mx-auto">
        {stage === "permission" && (
          <div className="card-soft p-6 text-center">
            <div className="size-16 rounded-2xl bg-primary-soft text-primary grid place-items-center mx-auto">
              <Camera className="size-7" />
            </div>
            <h2 className="text-lg font-bold mt-4">Camera Access</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
              Stocked Up uses your camera only to scan barcodes. Photos and video are not saved
              unless you choose to upload a product image.
            </p>
            <div className="mt-6 space-y-2">
              <button
                onClick={requestCamera}
                className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold"
              >
                Allow Camera
              </button>
              <button
                onClick={() => setStage("manual")}
                className="w-full h-12 rounded-full bg-muted font-semibold text-foreground"
              >
                Enter Barcode Manually
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-4 inline-flex items-center gap-1">
              <ShieldCheck className="size-3" />
              Camera stops the moment you leave this screen.
            </p>
          </div>
        )}

        {stage === "scanning" && (
          <div className="card-soft p-4">
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-black">
              <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted playsInline />
              <div className="absolute inset-0 bg-foreground/30" />
              {/* Frame overlay */}
              <div className="absolute inset-0 grid place-items-center pointer-events-none">
                <div className="relative w-3/4 aspect-[4/3] rounded-2xl ring-2 ring-primary-foreground/60">
                  <Corner pos="tl" />
                  <Corner pos="tr" />
                  <Corner pos="bl" />
                  <Corner pos="br" />
                  <div className="absolute inset-x-6 top-1/2 h-0.5 bg-primary animate-pulse rounded-full shadow-[0_0_20px_oklch(0.65_0.18_145)]" />
                </div>
              </div>
              {camStatus !== "ready" && (
                <div className="absolute inset-0 grid place-items-center bg-black/60 text-primary-foreground text-sm font-semibold text-center px-6">
                  {camStatus === "loading" && "Starting camera…"}
                  {camStatus === "denied" && "Camera permission required"}
                  {camStatus === "notfound" && "No camera found"}
                  {camStatus === "inuse" && "Camera in use by another app"}
                  {camStatus === "unsupported" && "Camera unavailable in preview"}
                  {camStatus === "error" && "Scanner failed to initialize"}
                </div>
              )}
              <div className="absolute top-3 left-3">
                <CamStatusBadge status={camStatus} />
              </div>
              <div className="absolute bottom-3 inset-x-3 flex items-center justify-between">
                {flashSupported ? (
                  <button
                    onClick={toggleFlashlight}
                    className={`size-10 rounded-full grid place-items-center ${
                      flashlight ? "bg-warning text-warning-foreground" : "bg-card/90 text-foreground"
                    }`}
                  >
                    <Flashlight className="size-4" />
                  </button>
                ) : <span className="size-10" />}
                <span className="px-3 h-8 rounded-full bg-card/90 text-xs font-semibold inline-flex items-center gap-1">
                  <ScanLine className="size-3" /> Point camera at barcode
                </span>
                <button
                  onClick={() => {
                    stopCamera();
                    setStage("manual");
                  }}
                  className="size-10 rounded-full bg-card/90 grid place-items-center"
                >
                  <Keyboard className="size-4" />
                </button>
              </div>

            </div>

            <div className="mt-4 flex items-center justify-between">
              <label className="text-sm font-semibold inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={multiScan}
                  onChange={(e) => setMultiScan(e.target.checked)}
                  className="size-4 accent-[color:var(--primary)]"
                />
                Multi-scan mode {scanCount > 0 && `(${scanCount} scanned)`}
              </label>
            </div>

            {app.settings.demoMode && (
              <>
                <p className="text-xs text-muted-foreground mt-3">
                  Demo Mode: tap a sample barcode to simulate a scan.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.keys(DEMO_PRODUCTS).map((b) => (
                    <button
                      key={b}
                      onClick={() => handleScan(b)}
                      className="px-3 h-8 rounded-full bg-muted text-xs font-semibold"
                    >
                      {DEMO_PRODUCTS[b].name}
                    </button>
                  ))}
                  <button
                    onClick={() => handleScan("999999999999")}
                    className="px-3 h-8 rounded-full bg-warning/20 text-warning-foreground text-xs font-semibold"
                  >
                    Unknown barcode
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {stage === "manual" && (
          <div className="card-soft p-6">
            {camStatus !== "idle" && camStatus !== "ready" && camStatus !== "loading" && (
              <p className="text-sm text-warning-foreground bg-warning/15 p-3 rounded-xl mb-4">
                {camMessage}
                {camStatus === "denied" && (
                  <span className="block mt-1 text-xs text-muted-foreground">
                    iOS Safari: Settings → Safari → Camera → Allow. Chrome: tap the lock icon in the address bar → Camera → Allow.
                  </span>
                )}
              </p>
            )}
            <h2 className="font-bold">Enter Barcode</h2>
            <input
              autoFocus
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              placeholder="037000746225"
              inputMode="numeric"
              className="mt-3 w-full h-12 px-4 rounded-2xl bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              onClick={() => manualBarcode && handleScan(manualBarcode)}
              disabled={!manualBarcode}
              className="mt-4 w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold disabled:opacity-50"
            >
              Look Up
            </button>
            {camStatus !== "unsupported" && camStatus !== "notfound" && (
              <button
                onClick={requestCamera}
                className="mt-2 w-full h-12 rounded-full text-primary font-semibold"
              >
                Try Camera Again
              </button>
            )}
          </div>
        )}


        {stage === "result" && product && (
          <ResultCard
            product={product}
            quantity={quantity}
            setQuantity={setQuantity}
            multiScan={multiScan}
            setMultiScan={setMultiScan}
            onSave={saveItem}
            onAnother={() => {
              setProduct(null);
              setQuantity(1);
              requestCamera();
            }}
          />
        )}

        {stage === "notFound" && product && (
          <div className="card-soft p-6">
            <h2 className="font-bold">Product not found</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Barcode <span className="font-mono">{product.barcode}</span> isn't in your saved
              products or online databases. Add it manually below — we'll save it for next time.
            </p>
            <ManualForm
              product={product}
              setProduct={setProduct}
              onSave={() => {
                if (!product.name) {
                  toast.error("Please add a name");
                  return;
                }
                saveItem();
              }}
            />
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function Corner({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const map = {
    tl: "top-0 left-0 border-l-4 border-t-4 rounded-tl-2xl",
    tr: "top-0 right-0 border-r-4 border-t-4 rounded-tr-2xl",
    bl: "bottom-0 left-0 border-l-4 border-b-4 rounded-bl-2xl",
    br: "bottom-0 right-0 border-r-4 border-b-4 rounded-br-2xl",
  };
  return <div className={`absolute size-6 border-primary ${map[pos]}`} />;
}

function CamStatusBadge({ status }: { status: CamStatus }) {
  const map: Record<CamStatus, { label: string; cls: string }> = {
    idle: { label: "Camera Idle", cls: "bg-card/90 text-foreground" },
    loading: { label: "Camera Loading", cls: "bg-warning/90 text-warning-foreground" },
    ready: { label: "Camera Ready", cls: "bg-primary text-primary-foreground" },
    denied: { label: "Permission Required", cls: "bg-destructive text-destructive-foreground" },
    notfound: { label: "No Camera", cls: "bg-destructive text-destructive-foreground" },
    inuse: { label: "Camera In Use", cls: "bg-destructive text-destructive-foreground" },
    unsupported: { label: "Preview Mode", cls: "bg-muted text-foreground" },
    error: { label: "Camera Error", cls: "bg-destructive text-destructive-foreground" },
  };
  const { label, cls } = map[status];
  return (
    <span className={`px-2.5 h-7 inline-flex items-center gap-1 rounded-full text-[11px] font-semibold ${cls}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

function ResultCard({
  product,
  quantity,
  setQuantity,
  multiScan,
  setMultiScan,
  onSave,
  onAnother,
}: {
  product: FoundProduct;
  quantity: number;
  setQuantity: (n: number) => void;
  multiScan: boolean;
  setMultiScan: (v: boolean) => void;
  onSave: () => void;
  onAnother: () => void;
}) {
  return (
    <div className="card-soft p-5">
      <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-3">
        <CheckCircle2 className="size-4" />
        {product.source === "cache" ? "Found in your saved items" : "Product found online"}
      </div>
      <div className="flex items-center gap-4">
        <CategoryThumb category={product.category} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="text-lg font-bold truncate">{product.name}</div>
          <div className="text-sm text-muted-foreground">{product.brand} • {product.packageSize}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {product.category} • {product.store} • ${product.price.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="mt-5 card-soft p-3 bg-muted/40">
        <div className="text-xs font-semibold text-muted-foreground mb-2">Quantity</div>
        <div className="flex items-center justify-between">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="size-10 rounded-full bg-card grid place-items-center font-bold text-lg"
          >
            −
          </button>
          <div className="text-3xl font-bold tabular-nums">{quantity}</div>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="size-10 rounded-full bg-card grid place-items-center font-bold text-lg"
          >
            +
          </button>
        </div>
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm font-semibold">
        <input
          type="checkbox"
          checked={multiScan}
          onChange={(e) => setMultiScan(e.target.checked)}
          className="size-4 accent-[color:var(--primary)]"
        />
        Keep scanning more items
      </label>

      <button
        onClick={onSave}
        className="mt-4 w-full h-12 rounded-full bg-primary text-primary-foreground font-bold"
      >
        Save to Inventory
      </button>
      <button
        onClick={onAnother}
        className="mt-2 w-full h-12 rounded-full bg-muted font-semibold"
      >
        Scan Another
      </button>
    </div>
  );
}

function ManualForm({
  product,
  setProduct,
  onSave,
}: {
  product: FoundProduct;
  setProduct: (p: FoundProduct) => void;
  onSave: () => void;
}) {
  return (
    <div className="mt-4 space-y-3">
      <Field label="Name">
        <input
          value={product.name}
          onChange={(e) => setProduct({ ...product, name: e.target.value })}
          className="w-full h-11 px-3 rounded-xl bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </Field>
      <Field label="Brand">
        <input
          value={product.brand}
          onChange={(e) => setProduct({ ...product, brand: e.target.value })}
          className="w-full h-11 px-3 rounded-xl bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </Field>
      <Field label="Category">
        <select
          value={product.category}
          onChange={(e) => setProduct({ ...product, category: e.target.value as Category })}
          className="w-full h-11 px-3 rounded-xl bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Price">
          <input
            type="number"
            step="0.01"
            value={product.price}
            onChange={(e) => setProduct({ ...product, price: parseFloat(e.target.value) || 0 })}
            className="w-full h-11 px-3 rounded-xl bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </Field>
        <Field label="Store">
          <input
            value={product.store}
            onChange={(e) => setProduct({ ...product, store: e.target.value })}
            className="w-full h-11 px-3 rounded-xl bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </Field>
      </div>
      <button
        onClick={onSave}
        className="mt-2 w-full h-12 rounded-full bg-primary text-primary-foreground font-bold"
      >
        Save Custom Product
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
