import { api, fail, ok, readJson } from "../../_server";
import { SendOtpSchema } from "@neighbourdoc/shared";

export async function POST(request: Request) {
  const json = await readJson(request);
  const parsed = SendOtpSchema.safeParse(json);
  if (!parsed.success) {
    return fail(parsed.error.errors[0]?.message ?? "Invalid phone number format.", 400);
  }
  const result = api.sendOtp(parsed.data);
  return ok(result, { status: result.ok ? 200 : 400 });
}
