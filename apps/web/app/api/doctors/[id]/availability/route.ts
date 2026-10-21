import { api, fail, ok, readJson, requireRole } from "../../../_server";
import { DoctorAvailabilitySchema } from "@neighbourdoc/shared";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = requireRole(request, ["doctor", "admin", "superadmin"]);
  if (!guard.authorized) return guard.response;

  try {
    const { id } = await context.params;
    const rawBody = await readJson(request);
    const parsed = DoctorAvailabilitySchema.safeParse(rawBody);

    if (!parsed.success) {
      const errorMsg = parsed.error.errors[0]?.message || "Invalid availability status.";
      return fail(errorMsg, 400);
    }

    return ok(api.setDoctorAvailability(id, parsed.data.availabilityStatus, guard.user));
  } catch (error) {
    return fail(error, 404);
  }
}
