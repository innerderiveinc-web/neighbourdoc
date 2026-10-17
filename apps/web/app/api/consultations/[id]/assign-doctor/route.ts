import { api, fail, ok, requireRole } from "../../../_server";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = requireRole(request, ["doctor", "admin", "superadmin"]);
  if (!guard.authorized) return guard.response;

  try {
    const { id } = await context.params;
    return ok(api.assignDoctor(id));
  } catch (error) {
    return fail(error, 404);
  }
}
