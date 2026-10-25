import { cn } from "@/lib/utils";

export const inputClass =
  "w-full rounded-md border border-forest-900/15 bg-paper px-3 py-2 text-sm aria-[invalid=true]:border-clay-600";

/** Label + control + hint/error, with the label linked to the control. */
export function Field({
  id,
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && <span className="text-clay-600"> *</span>}
      </label>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p className="mt-1 text-xs text-clay-700">{error}</p>
      ) : (
        hint && <p className="mt-1 text-xs text-ink-mute">{hint}</p>
      )}
    </div>
  );
}

export function Checkbox({
  name,
  label,
  hint,
  defaultChecked,
  value,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultChecked?: boolean;
  value?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5">
      <input type="checkbox" name={name} value={value} defaultChecked={defaultChecked} className="mt-0.5 size-4" />
      <span>
        <span className="text-sm">{label}</span>
        {hint && <span className="block text-xs text-ink-mute">{hint}</span>}
      </span>
    </label>
  );
}

export function FormSection({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-lg border border-forest-900/10 p-5", className)}>
      <h2 className="mb-4 font-sans text-xs uppercase tracking-wider text-ink-mute">{title}</h2>
      <div className="space-y-5">{children}</div>
    </section>
  );
}
