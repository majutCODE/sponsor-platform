import { STATUS_LABEL, type Status } from "@/lib/data";
import Badge, { type BadgeTone } from "@/components/arc/badge/badge";
import Alert from "@/components/arc/alert/alert";

const TONES: Record<Status, BadgeTone> = {
  upcoming: "info",
  live: "success",
  confirming: "warning",
  unsold: "neutral",
  stickers_due: "info",
  in_review: "warning",
  proof_rejected: "danger",
  running: "success",
  proof_overdue: "danger",
  complete: "neutral",
};

export default function StatusBadge({ status }: { status: Status }) {
  return <Badge tone={TONES[status]} dot pill size="sm">{STATUS_LABEL[status]}</Badge>;
}

const TITLES = { error: "Something went wrong", success: "Done", info: "Note" } as const;

export function Notice({ kind = "error", title, children }: { kind?: "error" | "success" | "info"; title?: string; children: React.ReactNode }) {
  return (
    <Alert className="mb-6" tone={kind === "error" ? "danger" : kind} title={title ?? TITLES[kind]}>
      {children}
    </Alert>
  );
}
