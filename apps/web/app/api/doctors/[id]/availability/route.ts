import { api, fail, ok, readJson, requireRole } from "../../../_server";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = requireRole(request, ["doctor", "admin", "superadmin"]);
  if (!guard.authorized) return guard.response;

  try {
    const { id } = await context.params;
    const body = await readJson<{ availabilityStatus: "online" | "offline" | "busy" }>(request);
    return ok(api.setDoctorAvailability(id, body.availabilityStatus));
  } catch (error) {
    return fail(error, 404);
  }
}
