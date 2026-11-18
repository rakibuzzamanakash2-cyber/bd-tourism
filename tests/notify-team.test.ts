import { beforeEach, describe, expect, it, vi } from "vitest";

// notifyTeam pulls this in dynamically, to avoid a cycle; vi.mock covers that too.
const reportError = vi.fn();
vi.mock("@/lib/report-error", () => ({ reportError }));

const { notifyTeam } = await import("@/lib/email");

describe("team notifications that do not go out", () => {
  beforeEach(() => {
    reportError.mockClear();
    // No RESEND_API_KEY in tests, so every send fails the way a misconfigured
    // or expired key would in production. Nothing leaves the machine.
    delete process.env.RESEND_API_KEY;
  });

  it("reports a notification it could not send", async () => {
    const sent = await notifyTeam({ subject: "Quote needed: Sylhet (ABC123)", lines: ["someone asked"] });

    expect(sent.success).toBe(false);
    expect(reportError).toHaveBeenCalledTimes(1);

    const [err, context] = reportError.mock.calls[0];
    expect(context).toEqual({ where: "email" });
    // The subject has to survive into the error, or the log says nothing useful
    // about which request is sitting unanswered.
    expect(String((err as Error).message)).toContain("Quote needed: Sylhet (ABC123)");
  });

  it("stays quiet when the error reporter is the caller, so a broken mailer cannot loop", async () => {
    const sent = await notifyTeam({ subject: "New error: boom", lines: ["boom"], recordFailure: false });

    expect(sent.success).toBe(false);
    expect(reportError).not.toHaveBeenCalled();
  });
});
