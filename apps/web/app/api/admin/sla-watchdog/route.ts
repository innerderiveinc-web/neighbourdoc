import { api, ok, requireRole } from "../../_server";

export async function GET(request: Request) {
  const guard = requireRole(request, ["admin", "superadmin"]);
  if (!guard.authorized) return guard.response;

  const state = api.getState();
  const now = Date.now();

  const activeConsultations = state.consultations
    .filter((c) => c.paymentStatus === "paid" && c.status !== "completed" && c.status !== "refunded")
    .map((c) => {
      const refTime = c.paidAt || c.createdAt;
      const elapsedMs = Math.max(0, now - new Date(refTime).getTime());
      const elapsedMinutes = Math.floor(elapsedMs / (60 * 1000));
      const slaLimitMinutes = state.settings?.slaCallbackMinutes ?? 15;
      const remainingMinutes = Math.max(0, slaLimitMinutes - elapsedMinutes);

      let urgencyStatus: "safe" | "warning" | "critical" | "breached" = "safe";
      if (elapsedMinutes >= slaLimitMinutes) {
        urgencyStatus = "breached";
      } else if (elapsedMinutes >= 12) {
        urgencyStatus = "critical";
      } else if (elapsedMinutes >= 8) {
        urgencyStatus = "warning";
      }

      return {
        id: c.id,
        patientId: c.patientId,
        doctorId: c.doctorId,
        status: c.status,
        paymentStatus: c.paymentStatus,
        amount: c.amount,
        symptoms: c.symptoms,
        callbackDeadline: c.callbackDeadline,
        paidAt: c.paidAt,
        createdAt: c.createdAt,
        elapsedMinutes,
        remainingMinutes,
        urgencyStatus
      };
    });

  return ok({
    activeCount: activeConsultations.length,
    consultations: activeConsultations
  });
}

export async function POST(request: Request) {
  const guard = requireRole(request, ["admin", "superadmin"]);
  if (!guard.authorized) return guard.response;

  const report = api.runSlaWatchdogCycle({
    autoRefundAdminActor: guard.user
  });

  return ok(report);
}
