"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { UserRole } from "@prisma/client";
import { adminSetUserRole } from "@/lib/actions/admin/users";

export function RoleSelect({ userId, role, isSelf }: { userId: string; role: UserRole; isSelf: boolean }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <select
      aria-label="Role"
      defaultValue={role}
      disabled={pending || isSelf}
      title={isSelf ? "You can't change your own role" : undefined}
      className="rounded-md border border-forest-900/15 bg-paper px-2 py-1 text-sm disabled:opacity-60"
      onChange={(e) => {
        const next = e.target.value as UserRole;
        if (next === "ADMIN" && !window.confirm("Give this person full admin access?")) {
          e.target.value = role;
          return;
        }
        start(async () => {
          const r = await adminSetUserRole({ userId, role: next });
          if (!r.ok) {
            toast.error(r.error);
            e.target.value = role;
            return;
          }
          toast.success(r.message ?? "Role updated");
          router.refresh();
        });
      }}
    >
      <option value="TOURIST">Tourist</option>
      <option value="GUIDE">Guide</option>
      <option value="HOST">Host</option>
      <option value="ADMIN">Admin</option>
    </select>
  );
}
