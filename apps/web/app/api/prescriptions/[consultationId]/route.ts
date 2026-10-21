import { api, fail, ok, requireAuth } from "../../_server";

export async function GET(request: Request, context: { params: Promise<{ consultationId: string }> }) {
  const guard = requireAuth(request);
  if (!guard.authorized) return guard.response;

  const { consultationId } = await context.params;
  const prescription = api.getPrescriptionByConsultation(consultationId, guard.user);
  if (!prescription) {
    return fail("Prescription record not found or access denied.", 404);
  }
  return ok(prescription);
}
