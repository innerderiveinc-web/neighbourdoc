import { api, authenticate, fail, ok, readJson } from "../../_server";

export async function GET(request: Request) {
  const auth = authenticate(request);
  const targetUserId =
    auth.authenticated && auth.user?.sub
      ? auth.user.sub
      : new URL(request.url).searchParams.get("userId") ?? undefined;
  return ok(api.getPatientMe(targetUserId));
}

export async function PATCH(request: Request) {
  try {
    const auth = authenticate(request);
    const body = await readJson<{ userId?: string }>(request);
    const targetUserId = auth.authenticated && auth.user?.sub ? auth.user.sub : body.userId;
    if (!targetUserId) {
      return fail("userId or valid authentication token required", 400);
    }
    return ok(api.updatePatientMe(targetUserId, body));
  } catch (error) {
    return fail(error, 404);
  }
}
