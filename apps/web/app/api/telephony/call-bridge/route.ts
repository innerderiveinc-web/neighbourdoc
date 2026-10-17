import { api, fail, ok, readJson, requireRole } from "../../_server";

export async function POST(request: Request) {
  const guard = requireRole(request, ["doctor", "admin", "superadmin"]);
  if (!guard.authorized) return guard.response;

  try {
    const body = await readJson<{ consultationId: string; doctorPhone?: string }>(request);
    if (!body.consultationId) {
      return fail("consultationId is required", 400);
    }

    const doctorPhone = body.doctorPhone ?? guard.user.phone;
    const bridge = api.initiateTelephonyBridge({
      consultationId: body.consultationId,
      doctorPhone
    });

    return ok({ ok: true, bridge }, { status: 201 });
  } catch (error) {
    return fail(error, 400);
  }
}
