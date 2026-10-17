import { api, fail, ok, readJson, requireRole } from "../_server";

export async function GET() {
  return ok(api.listDoctors());
}

export async function POST(request: Request) {
  const guard = requireRole(request, ["admin", "superadmin"]);
  if (!guard.authorized) return guard.response;

  try {
    return ok(api.createDoctor(await readJson(request)), { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
