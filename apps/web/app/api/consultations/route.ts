import { api, fail, ok, readJson, requireAuth } from "../_server";
import { BookingSchema } from "@neighbourdoc/shared";

export async function GET(request: Request) {
  const guard = requireAuth(request);
  if (!guard.authorized) return guard.response;
  return ok(api.listConsultations(guard.user));
}

export async function POST(request: Request) {
  const rawBody = await readJson(request);
  const parsed = BookingSchema.safeParse(rawBody);

  if (!parsed.success) {
    const errorMsg = parsed.error.errors[0]?.message || "Invalid booking details provided.";
    return fail(errorMsg, 400);
  }

  const result = api.createConsultation(parsed.data);
  const responseInit: ResponseInit = { status: result.ok ? 201 : 409 };
  if (result.ok && result.sessionToken) {
    responseInit.headers = {
      "Set-Cookie": `neighbourdoc_session=${result.sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`
    };
  }
  return ok(result, responseInit);
}
