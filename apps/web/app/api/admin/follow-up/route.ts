import { api, ok, requireRole } from "../../_server";

export async function GET(request: Request) {
  const guard = requireRole(request, ["admin", "superadmin"]);
  if (!guard.authorized) return guard.response;

  const state = api.getState();
  const completed = state.consultations.filter((c) => c.status === "completed" || c.completedAt);
  const followUpSent = state.consultations.filter((c) => c.followUpSentAt);
  const recovered = state.consultations.filter((c) => c.followUpStatus === "recovered");
  const mildSymptoms = state.consultations.filter((c) => c.followUpStatus === "mild_symptoms");
  const worsened = state.consultations.filter((c) => c.followUpStatus === "worsened_escalated");

  const totalResponses = recovered.length + mildSymptoms.length + worsened.length;
  const recoveryRatePercent = totalResponses > 0 ? Math.round((recovered.length / totalResponses) * 100) : 100;

  return ok({
    totalCompleted: completed.length,
    followUpSentCount: followUpSent.length,
    recoveredCount: recovered.length,
    mildSymptomsCount: mildSymptoms.length,
    worsenedCount: worsened.length,
    recoveryRatePercent
  });
}

export async function POST(request: Request) {
  const guard = requireRole(request, ["admin", "superadmin"]);
  if (!guard.authorized) return guard.response;

  const report = api.runDay3FollowUpAgentCycle();
  return ok(report);
}
