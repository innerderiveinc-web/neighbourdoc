import { api, ok } from "../../_server";

export async function GET(_request: Request, context: { params: Promise<{ consultationId: string }> }) {
  const { consultationId } = await context.params;
  const prescription = api.getPrescriptionByConsultation(consultationId);
  return ok(prescription ?? { ok: false, error: "Prescription not found." }, { status: prescription ? 200 : 404 });
}
