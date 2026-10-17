import { api, ok } from "../../_server";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const consultation = api.getConsultation(id);
  return ok(consultation ?? { ok: false, error: "Consultation not found." }, { status: consultation ? 200 : 404 });
}
