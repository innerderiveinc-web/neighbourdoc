import { api, fail, ok, readJson, requireRole } from "../../_server";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const doctor = api.getDoctor(id);
  return ok(doctor ?? { ok: false, error: "Doctor not found." }, { status: doctor ? 200 : 404 });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = requireRole(request, ["doctor", "admin", "superadmin"]);
  if (!guard.authorized) return guard.response;

  try {
    const { id } = await context.params;
    return ok(api.updateDoctor(id, await readJson(request)));
  } catch (error) {
    return fail(error, 404);
  }
}
