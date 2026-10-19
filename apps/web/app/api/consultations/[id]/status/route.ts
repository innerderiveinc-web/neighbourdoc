import { api, fail, ok, readJson, requireRole } from "../../../_server";
import type { ConsultationStatus } from "@neighbourdoc/shared";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = requireRole(request, ["doctor", "admin", "superadmin"]);
  if (!guard.authorized) return guard.response;

  try {
    const { id } = await context.params;
    const body = await readJson<{ status: ConsultationStatus }>(request);
    return ok(api.updateConsultationStatus(id, body.status));
  } catch (error) {
    return fail(error, 404);
  }
}
