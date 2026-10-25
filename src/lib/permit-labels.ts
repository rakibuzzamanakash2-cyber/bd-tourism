import type { PermitStatus } from "@prisma/client";

/** How each permit status is shown, to the team and to travelers. */
export const PERMIT_STATUS: Record<PermitStatus, { label: string; traveler: string; tone: "amber" | "green" | "grey" | "red" }> = {
  NOT_STARTED: {
    label: "Not started",
    traveler: "We'll start your permit application within 24 hours of payment.",
    tone: "amber",
  },
  DOCUMENTS_NEEDED: {
    label: "Documents needed",
    traveler: "We need something from you before we can apply — see the note below.",
    tone: "amber",
  },
  SUBMITTED: {
    label: "Submitted",
    traveler: "Your application is with the authorities. Approval usually takes 5–7 working days.",
    tone: "grey",
  },
  APPROVED: {
    label: "Approved",
    traveler: "Approved. Carry your passport on the trip; your guide will have the permit.",
    tone: "green",
  },
  REJECTED: {
    label: "Not approved",
    traveler: "The permit wasn't approved. We'll refund the processing fee and help you rearrange the trip.",
    tone: "red",
  },
};

/** Permits still needing work from the team. */
export const OPEN_PERMIT_STATUSES: PermitStatus[] = ["NOT_STARTED", "DOCUMENTS_NEEDED", "SUBMITTED"];
