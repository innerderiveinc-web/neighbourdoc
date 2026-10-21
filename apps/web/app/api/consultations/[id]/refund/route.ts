import { api, fail, ok, readJson, requireRole } from "../../../_server";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const guard = requireRole(request, ["admin", "superadmin"]);
  if (!guard.authorized) return guard.response;

  try {
    const { id } = await context.params;
    const body = await readJson<{ reason?: string }>(request);
    const reason = body.reason || "15-minute SLA breach guarantee refund";
    const result = api.executeRefund(id, guard.user, reason);
    return ok(result);
  } catch (error) {
    return fail(error, 400);
  }
}
