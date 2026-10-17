import { api, fail, ok, readJson, requireRole } from "../../../_server";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = requireRole(request, ["admin", "superadmin", "partner"]);
  if (!guard.authorized) return guard.response;

  try {
    const { id } = await context.params;
    return ok(api.addOrganizationMember(id, await readJson(request)), { status: 201 });
  } catch (error) {
    return fail(error, 404);
  }
}
