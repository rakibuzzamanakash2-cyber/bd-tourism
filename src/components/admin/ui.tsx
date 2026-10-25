import Link from "next/link";
import type { BookingStatus, ContactStatus, PaymentStatus, PermitStatus, UserRole } from "@prisma/client";
import { PERMIT_STATUS } from "@/lib/permit-labels";
import { APPLICATION_STATUS_LABEL } from "@/lib/applications";
import { ASSIGNMENT_STATUS_LABEL } from "@/lib/guide-shared";
import { cn } from "@/lib/utils";

// ============================================================
// Page header
// ============================================================
export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-4xl leading-tight">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  );
}

// ============================================================
// Stat card
// ============================================================
export function StatCard({
  label,
  value,
  hint,
  href,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
  tone?: "default" | "attention";
}) {
  const body = (
    <div
      className={cn(
        "h-full rounded-lg border p-5 transition-colors",
        tone === "attention" ? "border-clay-600/30 bg-clay-500/10" : "border-forest-900/10 bg-paper-warm",
        href && "hover:border-forest-900/30",
      )}
    >
      <p className="text-xs uppercase tracking-wider text-ink-mute">{label}</p>
      <p className="mt-2 font-display text-3xl text-forest-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-mute">{hint}</p>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

// ============================================================
// Table
// ============================================================
export function Table({ head, children, empty }: { head: string[]; children: React.ReactNode; empty?: boolean }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-forest-900/10">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-paper-warm text-xs uppercase tracking-wider text-ink-mute">
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className="px-4 py-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-forest-900/10">
          {empty ? (
            <tr>
              <td colSpan={head.length} className="px-4 py-12 text-center text-ink-mute">
                Nothing here.
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}

export const Td = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <td className={cn("px-4 py-3 align-top", className)}>{children}</td>
);

// ============================================================
// Filter pills (links that keep other query params)
// ============================================================
export function FilterPills({
  options,
  current,
  param,
  basePath,
  params,
}: {
  options: { value: string; label: string }[];
  current?: string;
  param: string;
  basePath: string;
  params: Record<string, string | undefined>;
}) {
  const href = (value?: string) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== param && k !== "page") q.set(k, v);
    if (value) q.set(param, value);
    const s = q.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  return (
    <div className="flex flex-wrap gap-2">
      <Pill href={href()} active={!current}>
        All
      </Pill>
      {options.map((o) => (
        <Pill key={o.value} href={href(o.value)} active={current === o.value}>
          {o.label}
        </Pill>
      ))}
    </div>
  );
}

function Pill({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-3 py-1 text-xs",
        active ? "border-forest-900 bg-forest-900 text-paper" : "border-forest-900/15 text-ink-soft hover:border-forest-900/40",
      )}
    >
      {children}
    </Link>
  );
}

/** GET search box that keeps the other filters. */
export function SearchBox({
  basePath,
  params,
  placeholder,
}: {
  basePath: string;
  params: Record<string, string | undefined>;
  placeholder: string;
}) {
  return (
    <form action={basePath} className="flex gap-2">
      {Object.entries(params).map(([k, v]) =>
        v && k !== "q" && k !== "page" ? <input key={k} type="hidden" name={k} value={v} /> : null,
      )}
      <input
        type="search"
        name="q"
        defaultValue={params.q ?? ""}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full rounded-full border border-forest-900/15 bg-paper px-4 py-2 text-sm sm:w-72"
      />
      <button type="submit" className="rounded-full bg-forest-900 px-4 py-2 text-sm text-paper hover:bg-forest-800">
        Search
      </button>
    </form>
  );
}

// ============================================================
// Pagination
// ============================================================
export function Pagination({
  page,
  total,
  take,
  basePath,
  params,
}: {
  page: number;
  total: number;
  take: number;
  basePath: string;
  params: Record<string, string | undefined>;
}) {
  const pages = Math.max(1, Math.ceil(total / take));
  if (pages <= 1) return null;
  const href = (p: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== "page") q.set(k, v);
    if (p > 1) q.set("page", String(p));
    const s = q.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-ink-soft">
      <span>
        Page {page} of {pages} · {total} total
      </span>
      <div className="flex gap-2">
        {page > 1 && (
          <Link href={href(page - 1)} className="rounded-full border border-forest-900/15 px-3 py-1 hover:bg-forest-100">
            ← Previous
          </Link>
        )}
        {page < pages && (
          <Link href={href(page + 1)} className="rounded-full border border-forest-900/15 px-3 py-1 hover:bg-forest-100">
            Next →
          </Link>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Status badges
// ============================================================
const badge = "inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs";
const tones = {
  green: "border-forest-700/30 bg-forest-100 text-forest-800",
  amber: "border-clay-600/30 bg-clay-500/10 text-clay-700",
  grey: "border-ink-mute/30 bg-paper text-ink-mute",
  dark: "border-forest-900/20 bg-forest-900/10 text-forest-900",
  red: "border-clay-700/40 bg-clay-600/15 text-clay-700",
};

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  DRAFT: "Draft",
  PAYMENT_PENDING: "Payment pending",
  PAID: "Paid",
  CONFIRMED: "Confirmed",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  DISPUTED: "Disputed",
};
const bookingTone: Record<BookingStatus, keyof typeof tones> = {
  DRAFT: "grey",
  PAYMENT_PENDING: "amber",
  PAID: "green",
  CONFIRMED: "green",
  IN_PROGRESS: "green",
  COMPLETED: "dark",
  CANCELLED: "grey",
  DISPUTED: "amber",
};
export const BookingStatusBadge = ({ status }: { status: BookingStatus }) => (
  <span className={cn(badge, tones[bookingTone[status]])}>{BOOKING_STATUS_LABEL[status]}</span>
);

const paymentTone: Record<PaymentStatus, keyof typeof tones> = {
  PENDING: "amber",
  SUCCEEDED: "green",
  FAILED: "grey",
  REFUNDED: "dark",
  PARTIAL_REFUND: "dark",
};
const paymentLabel: Record<PaymentStatus, string> = {
  PENDING: "Pending",
  SUCCEEDED: "Paid",
  FAILED: "Failed",
  REFUNDED: "Refunded",
  PARTIAL_REFUND: "Partly refunded",
};
export const PaymentStatusBadge = ({ status }: { status: PaymentStatus }) => (
  <span className={cn(badge, tones[paymentTone[status]])}>{paymentLabel[status]}</span>
);

const contactTone: Record<ContactStatus, keyof typeof tones> = {
  NEW: "amber",
  READ: "grey",
  REPLIED: "green",
  ARCHIVED: "grey",
};
export const ContactStatusBadge = ({ status }: { status: ContactStatus }) => (
  <span className={cn(badge, tones[contactTone[status]])}>{status.charAt(0) + status.slice(1).toLowerCase()}</span>
);

export const RoleBadge = ({ role }: { role: UserRole }) => (
  <span className={cn(badge, role === "ADMIN" ? tones.dark : tones.grey)}>{role.charAt(0) + role.slice(1).toLowerCase()}</span>
);

export const PermitStatusBadge = ({ status }: { status: PermitStatus }) => (
  <span className={cn(badge, tones[PERMIT_STATUS[status].tone])}>{PERMIT_STATUS[status].label}</span>
);

const applicationTone: Record<string, keyof typeof tones> = {
  DRAFT: "grey",
  SUBMITTED: "amber",
  UNDER_REVIEW: "amber",
  INTERVIEW: "amber",
  HOME_VISIT: "amber",
  CHANGES_REQUESTED: "grey",
  APPROVED: "green",
  REJECTED: "red",
};
export const ApplicationStatusBadge = ({ status }: { status: string }) => (
  <span className={cn(badge, tones[applicationTone[status] ?? "grey"])}>{APPLICATION_STATUS_LABEL[status] ?? status}</span>
);

const assignmentTone: Record<string, keyof typeof tones> = { PENDING: "amber", ACCEPTED: "green", DECLINED: "red", CANCELLED: "grey" };
export const AssignmentStatusBadge = ({ status }: { status: string }) => (
  <span className={cn(badge, tones[assignmentTone[status] ?? "grey"])}>{ASSIGNMENT_STATUS_LABEL[status] ?? status}</span>
);
