import { api, fail, ok, readJson, requireAuth } from "../../_server";

export async function GET(request: Request) {
  const guard = requireAuth(request);
  if (!guard.authorized) return guard.response;

  // Only superadmin/admin can query another patient; regular users are strictly bound to their authenticated sub
  const isAdmin = guard.user.role === "admin" || guard.user.role === "superadmin";
  const targetUserId =
    isAdmin && new URL(request.url).searchParams.get("userId")
      ? (new URL(request.url).searchParams.get("userId") as string)
      : guard.user.sub;

  const profile = api.getPatientMe(targetUserId);
  if (!profile.user && !profile.patient) {
    return fail("Patient profile not found.", 404);
  }
  return ok(profile);
}

export async function PATCH(request: Request) {
  const guard = requireAuth(request);
  if (!guard.authorized) return guard.response;

  try {
    const body = await readJson<{ userId?: string; name?: string; email?: string; language?: any }>(request);
    const isAdmin = guard.user.role === "admin" || guard.user.role === "superadmin";
    const targetUserId = isAdmin && body.userId ? body.userId : guard.user.sub;

    return ok(api.updatePatientMe(targetUserId, body));
  } catch (error) {
    return fail(error, 404);
  }
}
