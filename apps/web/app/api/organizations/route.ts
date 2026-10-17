import { api, ok, readJson, requireRole } from "../_server";

export async function POST(request: Request) {
  const guard = requireRole(request, ["admin", "superadmin"]);
  if (!guard.authorized) return guard.response;

  return ok(api.createOrganization(await readJson(request)), { status: 201 });
}
