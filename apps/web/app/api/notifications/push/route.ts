import { api, ok, readJson, requireRole } from "../../_server";

export async function POST(request: Request) {
  const guard = requireRole(request, ["admin", "superadmin", "doctor"]);
  if (!guard.authorized) return guard.response;

  return ok(api.sendNotification({ ...(await readJson(request)), channel: "push" }), { status: 202 });
}
