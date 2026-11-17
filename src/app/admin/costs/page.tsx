import Link from "next/link";
import type { CostKind } from "@prisma/client";
import { AdminPageHeader } from "@/components/admin/ui";
import { CostRateForm, CostSettingsForm } from "@/components/admin/cost-rate-form";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { KIND_LABEL, TIER_ORDER, bdt, perPersonPerDay, tierLabel, usd, withServiceFee } from "@/lib/costs";
import { readSettings } from "@/lib/settings";

export const metadata = { title: "Costs" };

const ORDER: CostKind[] = ["LODGING", "MEALS", "TRANSPORT", "GUIDE", "PERMIT"];

export default async function AdminCostsPage() {
  await requireAdmin();
  const [rates, settings, pricier] = await Promise.all([
    db.costRate.findMany({ orderBy: [{ kind: "asc" }, { sortOrder: "asc" }] }),
    readSettings(),
    db.district.findMany({ where: { costMultiplier: { not: 1 } }, select: { name: true, slug: true, costMultiplier: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="max-w-4xl">
      <AdminPageHeader
        title="Costs"
        description="What a trip costs us, in parts. These numbers drive the rough daily figure on every district page, so keep them close to what you actually pay. They started as placeholders — replace them with real supplier prices."
      />

      <section className="mb-10 rounded-lg border border-forest-900/10 bg-paper-warm p-5">
        <h2 className="mb-4 font-display text-xl">Applies to everything</h2>
        <CostSettingsForm serviceFeePercent={settings.serviceFeePercent} estimateGroupSize={settings.estimateGroupSize} />
      </section>

      {ORDER.map((kind) => {
        const group = rates.filter((r) => r.kind === kind);
        if (group.length === 0) return null;
        return (
          <section key={kind} className="mb-10">
            <h2 className="font-display text-xl">{KIND_LABEL[kind]}</h2>
            {group.map((r) => (
              <CostRateForm key={r.id} rate={r} />
            ))}
          </section>
        );
      })}

      <section className="mb-10 rounded-lg border border-forest-900/10 p-5">
        <h2 className="font-display text-xl">What that works out to</h2>
        <p className="mt-1 text-sm text-ink-mute">
          Per person per day in an ordinary district, for a group of {settings.estimateGroupSize}, with the {settings.serviceFeePercent}% fee on top.
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          {TIER_ORDER.map((tier) => {
            const base = perPersonPerDay(rates, tier, { groupSize: settings.estimateGroupSize });
            if (base === null) return null;
            const charged = withServiceFee(base, settings.serviceFeePercent);
            return (
              <li key={tier} className="flex justify-between gap-4 border-b border-forest-900/5 pb-2">
                <span>{tierLabel(tier)}</span>
                <span className="tabular-nums">
                  costs us {bdt(base)} · we charge {bdt(charged)} ({usd(charged)})
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2 className="font-display text-xl">Districts that cost more</h2>
        <p className="mt-1 text-sm text-ink-mute">
          Set a district&rsquo;s multiplier on its own form in{" "}
          <Link href="/admin/districts" className="underline underline-offset-4">Districts</Link>. 1.0 is ordinary; 1.4 means
          everything there costs about 40% more to arrange.
        </p>
        {pricier.length === 0 ? (
          <p className="mt-3 text-sm text-ink-mute">Every district is currently set to 1.0.</p>
        ) : (
          <ul className="mt-3 space-y-1 text-sm">
            {pricier.map((d) => (
              <li key={d.slug} className="flex justify-between gap-4 border-b border-forest-900/5 pb-1">
                <span>{d.name}</span>
                <span className="tabular-nums">×{d.costMultiplier.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
