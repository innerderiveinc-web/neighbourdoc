import { api, fail, ok, readJson, requireRole } from "../../../_server";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const guard = requireRole(request, ["admin", "superadmin"]);
  if (!guard.authorized) return guard.response;

  try {
    const { id } = await context.params;
    const body = await readJson<{ notes?: string }>(request);
    const doctor = api.verifyDoctor(id, guard.user, body.notes);
    return ok({ ok: true, doctor });
  } catch (error) {
    return fail(error, 400);
  }
}
