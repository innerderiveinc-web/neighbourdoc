import { api, fail, ok, readJson, requireRole } from "../_server";

export async function POST(request: Request) {
  const guard = requireRole(request, ["doctor", "admin", "superadmin"]);
  if (!guard.authorized) return guard.response;

  try {
    return ok(api.createPrescription(await readJson(request)), { status: 201 });
  } catch (error) {
    return fail(error, 404);
  }
}
