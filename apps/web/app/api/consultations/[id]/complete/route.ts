import { api, fail, ok, readJson, requireRole } from "../../../_server";
import { CompleteConsultationSchema } from "@neighbourdoc/shared";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = requireRole(request, ["doctor", "admin", "superadmin"]);
  if (!guard.authorized) return guard.response;

  try {
    const { id } = await context.params;
    const rawBody = await readJson(request);
    const parsed = CompleteConsultationSchema.safeParse(rawBody);

    if (!parsed.success) {
      const errorMsg = parsed.error.errors[0]?.message || "Invalid consultation completion input.";
      return fail(errorMsg, 400);
    }

    return ok(api.completeConsultation(id, parsed.data, guard.user));
  } catch (error) {
    return fail(error, 404);
  }
}
