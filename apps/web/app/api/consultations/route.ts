import { api, fail, ok, readJson, requireAuth } from "../_server";
import type { BookingInput } from "@neighbourdoc/api";

export async function GET(request: Request) {
  const guard = requireAuth(request);
  if (!guard.authorized) return guard.response;
  return ok(api.listConsultations(guard.user));
}

export async function POST(request: Request) {
  const body = await readJson<BookingInput>(request);
  if (!body.consent) {
    return fail("Explicit patient consent is required before booking a teleconsultation.", 400);
  }
  const result = api.createConsultation(body);
  const responseInit: ResponseInit = { status: result.ok ? 201 : 409 };
  if (result.ok && result.sessionToken) {
    responseInit.headers = {
      "Set-Cookie": `neighbourdoc_session=${result.sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`
    };
  }
  return ok(result, responseInit);
}
