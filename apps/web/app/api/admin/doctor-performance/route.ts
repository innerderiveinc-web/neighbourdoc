import { api, ok, requireRole } from "../../_server";

export async function GET(request: Request) {
  const guard = requireRole(request, ["admin", "superadmin"]);
  if (!guard.authorized) return guard.response;

  return ok(api.doctorPerformance());
}
