import { STATUS_LABEL, type Status } from "@/lib/data";

const FILL: Record<Status, string> = {
  upcoming: "#cfe3ff",
  live: "var(--s-lime)",
  confirming: "var(--s-yellow)",
  unsold: "#fff",
  stickers_due: "#cfe3ff",
  in_review: "var(--s-yellow)",
  proof_rejected: "var(--s-pink)",
  running: "var(--s-lime)",
  proof_overdue: "var(--s-pink)",
  complete: "#fff",
};

export default function StatusBadge({ status }: { status: Status }) {
  return <span className="pill" style={{ background: FILL[status] }}>{STATUS_LABEL[status]}</span>;
}

const TITLES = { error: "Something went wrong", success: "Done", info: "Note" } as const;
const NOTICE_FILL = { error: "var(--s-pink)", success: "var(--s-lime)", info: "#cfe3ff" } as const;

export function Notice({ kind = "error", title, children }: { kind?: "error" | "success" | "info"; title?: string; children: React.ReactNode }) {
  return (
    <div role={kind === "error" ? "alert" : "status"} className="sticker mb-6 rounded-[18px] px-5 py-4" style={{ background: NOTICE_FILL[kind] }}>
      <div className="font-extrabold">{title ?? TITLES[kind]}</div>
      <div className="mt-0.5 text-sm">{children}</div>
    </div>
  );
}
