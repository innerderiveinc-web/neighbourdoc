import { api, fail, ok, requireAuth } from "../../_server";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = requireAuth(request);
  if (!guard.authorized) return guard.response;

  const { id } = await context.params;
  const consultation = api.getConsultation(id, guard.user);
  if (!consultation) {
    return fail("Consultation record not found or access denied.", 404);
  }
  return ok(consultation);
}
