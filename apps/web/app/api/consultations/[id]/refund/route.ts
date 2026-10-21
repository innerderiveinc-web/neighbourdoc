import { api, fail, ok, readJson, requireRole } from "../../../_server";
import { RefundSchema } from "@neighbourdoc/shared";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const guard = requireRole(request, ["admin", "superadmin"]);
  if (!guard.authorized) return guard.response;

  try {
    const { id } = await context.params;
    const rawBody = await readJson(request);
    const parsed = RefundSchema.safeParse(rawBody);

    if (!parsed.success) {
      const errorMsg = parsed.error.errors[0]?.message || "Invalid refund reason.";
      return fail(errorMsg, 400);
    }

    const reason = parsed.data.reason || "15-minute SLA breach guarantee refund";
    const result = api.executeRefund(id, guard.user, reason);
    return ok(result);
  } catch (error) {
    return fail(error, 400);
  }
}
