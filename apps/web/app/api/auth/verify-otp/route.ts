import { api, fail, ok, readJson } from "../../_server";
import { VerifyOtpSchema } from "@neighbourdoc/shared";

export async function POST(request: Request) {
  const json = await readJson(request);
  const parsed = VerifyOtpSchema.safeParse(json);
  if (!parsed.success) {
    return fail(parsed.error.errors[0]?.message ?? "Invalid phone or OTP code format.", 400);
  }
  const result = api.verifyOtp(parsed.data);
  const responseInit: ResponseInit = { status: result.ok ? 200 : 400 };
  if (result.ok && result.sessionToken) {
    responseInit.headers = {
      "Set-Cookie": `neighbourdoc_session=${result.sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`
    };
  }
  return ok(result, responseInit);
}
