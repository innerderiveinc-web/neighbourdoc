import { api, fail, ok, readJson } from "../../_server";
import { VerifyPaymentSchema } from "@neighbourdoc/shared";

export async function POST(request: Request) {
  try {
    const rawBody = await readJson(request);
    const parsed = VerifyPaymentSchema.safeParse(rawBody);
    if (!parsed.success) {
      const errorMsg = parsed.error.errors[0]?.message || "Invalid payment verification data.";
      return fail(errorMsg, 400);
    }

    const result = api.verifyPayment(parsed.data);
    return ok(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    return fail(error, 400);
  }
}
