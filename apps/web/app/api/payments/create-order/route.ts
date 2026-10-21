import { api, fail, ok, readJson } from "../../_server";
import { CreatePaymentOrderSchema } from "@neighbourdoc/shared";

export async function POST(request: Request) {
  try {
    const rawBody = await readJson(request);
    const parsed = CreatePaymentOrderSchema.safeParse(rawBody);
    if (!parsed.success) {
      const errorMsg = parsed.error.errors[0]?.message || "Invalid order parameters.";
      return fail(errorMsg, 400);
    }

    return ok(api.createPaymentOrder(parsed.data), { status: 201 });
  } catch (error) {
    return fail(error, 400);
  }
}
