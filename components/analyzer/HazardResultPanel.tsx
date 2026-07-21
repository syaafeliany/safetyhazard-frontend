import {
  HardHat,
  Shield,
  Droplets,
  Construction,
  Cable,
  FlaskConical,
  CheckCircle2,
  XCircle,
  MinusCircle,
  AlertTriangle,
  ScanEye,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Panel status deteksi — diisi dari hasil deteksi backend (real-time  */
/* live-preview ATAU hasil analisa tersimpan). Bukan lagi dummy.       */
/* ------------------------------------------------------------------ */

/** Satu kotak deteksi yang dikembalikan backend (/inspections/live-preview). */
export interface DetectionBox {
  label: string;
  confidence: number;
  danger: boolean;
  bbox: [number, number, number, number];
}

/**
 * Ringkasan mentah deteksi dari backend. Panel PPE butuh tahu APAKAH ada
 * orang di frame supaya bisa membedakan "Present" (ada orang, pakai APD) dari
 * "No person" (tidak ada orang sama sekali). Tanpa ini panel salah lapor
 * "Present" saat frame kosong.
 */
export interface DetectionSummary {
  person_count: number;
  helmet_count: number;
  vest_count: number;
  has_person: boolean;
  // Berapa orang yang APD-nya tidak terpakai (inferensi spasial per-orang).
  workers_missing_helmet?: number;
  workers_missing_vest?: number;
  env_hazards: string[];
  // Skor risiko agregat + band (safe/low/moderate/high/critical).
  risk_score?: number;
  risk_band?: string;
}

// Band skor risiko → warna & label tampilan.
const RISK_BAND_META: Record<
  string,
  { label: string; badge: string; bar: string }
> = {
  safe: {
    label: "Safe",
    badge: "bg-green-500/10 text-green-600 dark:text-green-500",
    bar: "bg-green-500",
  },
  low: {
    label: "Low Risk",
    badge: "bg-green-500/10 text-green-600 dark:text-green-500",
    bar: "bg-green-500",
  },
  moderate: {
    label: "Moderate Risk",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-500",
    bar: "bg-amber-500",
  },
  high: {
    label: "High Risk",
    badge: "bg-orange-500/10 text-orange-600 dark:text-orange-500",
    bar: "bg-orange-500",
  },
  critical: {
    label: "Critical Risk",
    badge: "bg-brand/10 text-brand",
    bar: "bg-brand",
  },
};

// Skor dipetakan ke lebar bar 0–100% dengan plafon di nilai ini (skor di atas
// ini dianggap "penuh"). Sekadar visual; band tetap sumber kebenaran.
const RISK_BAR_MAX = 30;

// PPE yang dilacak backend (inferensi no_helmet / no_safety_vest).
const PPE_TRACKED: { label: string; icon: LucideIcon; violationLabel: string }[] = [
  { label: "Helmet", icon: HardHat, violationLabel: "no helmet" },
  { label: "Safety Vest", icon: Shield, violationLabel: "no safety vest" },
];

// Hazard lingkungan yang dilacak backend.
const ENV_TRACKED: { label: string; icon: LucideIcon; detectLabel: string }[] = [
  { label: "Wet Floor", icon: Droplets, detectLabel: "wet floor" },
  { label: "Blocked Walkway", icon: Construction, detectLabel: "blocked walkway" },
  { label: "Exposed Cable", icon: Cable, detectLabel: "exposed cable" },
  { label: "Chemical Spill", icon: FlaskConical, detectLabel: "chemical spill" },
];

/**
 * HazardResultPanel — status kelengkapan APD & bahaya lingkungan, dihitung
 * dari daftar `detections` hasil backend. Kalau `detections` null (belum
 * ada analisa) tampilkan placeholder; kalau kosong berarti area aman.
 */
export function HazardResultPanel({
  detections,
  summary,
}: {
  detections?: DetectionBox[] | null;
  summary?: DetectionSummary | null;
}) {
  // Belum ada deteksi yang dijalankan sama sekali.
  if (detections == null) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-foreground">
          Detection Status
        </h2>
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <ScanEye className="size-9 text-muted/50" strokeWidth={1.5} />
          <p className="text-sm text-muted">
            Start the camera or upload an image to run detection.
          </p>
        </div>
      </div>
    );
  }

  const labels = new Set(detections.map((d) => d.label.toLowerCase()));

  // Ada orang di frame? Utamakan summary dari backend; fallback: anggap ada
  // orang kalau ada pelanggaran PPE yang terdeteksi (pelanggaran hanya muncul
  // saat person terdeteksi).
  const hasPerson =
    summary?.has_person ??
    PPE_TRACKED.some((p) => labels.has(p.violationLabel));

  // PPE tiga status:
  //   "none"    → tidak ada orang di frame (bukan "aman", cuma tak relevan)
  //   "present" → ada orang & APD terpakai
  //   "missing" → ada orang TAPI APD tidak terdeteksi (pelanggaran)
  const ppe = PPE_TRACKED.map((p) => ({
    ...p,
    state: !hasPerson
      ? ("none" as const)
      : labels.has(p.violationLabel)
      ? ("missing" as const)
      : ("present" as const),
  }));
  const env = ENV_TRACKED.map((e) => ({
    ...e,
    detected: labels.has(e.detectLabel),
  }));

  const missingCount = ppe.filter((p) => p.state === "missing").length;
  const hazardCount = env.filter((e) => e.detected).length;
  const allClear = missingCount === 0 && hazardCount === 0;

  // Jumlah pekerja & pelanggaran per-jenis APD (dari summary backend). Dipakai
  // untuk lapor "2 of 5 workers missing helmet" alih-alih Missing/Present biner.
  const workers = summary?.person_count ?? 0;
  const noHelmet = summary?.workers_missing_helmet ?? 0;
  const noVest = summary?.workers_missing_vest ?? 0;

  // Skor risiko agregat. Backend sudah menghitung & memetakan ke band; panel
  // hanya menampilkan. Fallback "safe" kalau summary belum ada.
  const riskScore = summary?.risk_score ?? 0;
  const riskBand = summary?.risk_band ?? "safe";
  const bandMeta = RISK_BAND_META[riskBand] ?? RISK_BAND_META.safe;
  const barPct = Math.min(100, Math.round((riskScore / RISK_BAR_MAX) * 100));

  // Teks pelanggaran per-APD untuk ditempel di baris (mis. "2 of 5").
  const helmetNote =
    hasPerson && noHelmet > 0 ? `${noHelmet} of ${workers}` : undefined;
  const vestNote =
    hasPerson && noVest > 0 ? `${noVest} of ${workers}` : undefined;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">
          Detection Status
        </h2>
        <span
          className={cn(
            "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
            allClear
              ? "bg-green-500/10 text-green-600 dark:text-green-500"
              : "bg-brand/10 text-brand"
          )}
        >
          {allClear ? (
            <>
              <CheckCircle2 className="size-3.5" />
              All Clear
            </>
          ) : (
            <>
              <AlertTriangle className="size-3.5" />
              {missingCount + hazardCount} Issue
              {missingCount + hazardCount > 1 ? "s" : ""}
            </>
          )}
        </span>
      </div>

      {/* Risk score agregat — menggabung SEMUA hazard (PPE + lingkungan)
          diboboti tingkat risiko & confidence. Lebih informatif daripada
          sekadar hitung jumlah issue. */}
      <section className="mb-4 rounded-lg border border-border bg-background/50 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Risk Score
          </span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-semibold",
              bandMeta.badge
            )}
          >
            {bandMeta.label}
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tabular-nums text-foreground">
            {riskScore.toFixed(1)}
          </span>
          <span className="text-xs text-muted">risk points</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted/20">
          <div
            className={cn("h-full rounded-full transition-all", bandMeta.bar)}
            style={{ width: `${barPct}%` }}
          />
        </div>
      </section>

      {/* Section 1 — PPE Compliance */}
      <section>
        <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted">
          PPE Compliance
        </h3>
        {!hasPerson ? (
          <p className="mb-2.5 text-xs text-muted">
            No person detected in frame.
          </p>
        ) : (
          <p className="mb-2.5 text-xs text-muted">
            {workers} worker{workers === 1 ? "" : "s"} detected in frame.
          </p>
        )}
        <ul className="space-y-2">
          {ppe.map((item) => (
            <StatusRow
              key={item.label}
              icon={item.icon}
              label={item.label}
              state={item.state}
              note={item.label === "Helmet" ? helmetNote : vestNote}
            />
          ))}
        </ul>
      </section>

      <hr className="my-4 border-border" />

      {/* Section 2 — Environmental Hazards */}
      <section>
        <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted">
          Environmental Hazards
        </h3>
        <ul className="space-y-2">
          {env.map((item) => (
            <StatusRow
              key={item.label}
              icon={item.icon}
              label={item.label}
              // Untuk bahaya lingkungan: terdeteksi = bahaya (merah), else clear.
              state={item.detected ? "detected" : "clear"}
            />
          ))}
        </ul>
      </section>
    </div>
  );
}

/**
 * Baris item dengan ikon di kiri dan lencana status di kanan.
 *
 * State:
 *   present  → hijau "Present"  (APD terpakai)
 *   clear    → hijau "Clear"    (bahaya lingkungan tidak ada)
 *   missing  → merah  "Missing"  (APD tidak terpakai — pelanggaran)
 *   detected → merah  "Detected" (bahaya lingkungan terdeteksi)
 *   none     → abu    "No person" (tidak ada orang → APD tak relevan)
 */
type RowState = "present" | "clear" | "missing" | "detected" | "none";

function StatusRow({
  icon: Icon,
  label,
  state,
}: {
  icon: LucideIcon;
  label: string;
  state: RowState;
}) {
  const isOk = state === "present" || state === "clear";
  const isNone = state === "none";
  const text =
    state === "present"
      ? "Present"
      : state === "clear"
      ? "Clear"
      : state === "missing"
      ? "Missing"
      : state === "detected"
      ? "Detected"
      : "No person";

  const badgeClass = isNone
    ? "bg-muted/10 text-muted"
    : isOk
    ? "bg-green-500/10 text-green-600 dark:text-green-500"
    : "bg-brand/10 text-brand";

  const iconColor = isNone ? "text-muted/50" : isOk ? "text-muted" : "text-brand";

  return (
    <li className="flex items-center justify-between">
      <span className="flex items-center gap-2.5 text-sm text-foreground">
        <Icon className={cn("size-4", iconColor)} strokeWidth={1.75} />
        {label}
      </span>
      <span
        className={cn(
          "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
          badgeClass
        )}
      >
        {isNone ? (
          <MinusCircle className="size-3" />
        ) : isOk ? (
          <CheckCircle2 className="size-3" />
        ) : (
          <XCircle className="size-3" />
        )}
        {text}
      </span>
    </li>
  );
}
