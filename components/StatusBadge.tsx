import { STATUS_LABEL, type Status } from "@/lib/data";

const COLORS: Record<Status, string> = {
  open: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  sold_out: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  in_review: "bg-amber-50 text-amber-800 ring-amber-200",
  proof_rejected: "bg-rose-50 text-rose-700 ring-rose-200",
  approved: "bg-sky-50 text-sky-700 ring-sky-200",
  paid_out: "bg-stone-100 text-stone-700 ring-stone-300",
};

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${COLORS[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function Notice({ kind = "error", children }: { kind?: "error" | "success" | "info"; children: React.ReactNode }) {
  const c =
    kind === "error"
      ? "border-rose-200 bg-rose-50 text-rose-800"
      : kind === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
        : "border-indigo-200 bg-indigo-50 text-indigo-900";
  return <div className={`mb-6 rounded-xl border px-4 py-3 text-sm ${c}`}>{children}</div>;
}
