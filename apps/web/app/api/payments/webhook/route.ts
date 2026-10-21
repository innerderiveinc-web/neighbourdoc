import { api, ok } from "../../_server";

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  const result = api.handlePaymentWebhook(payload, signature);
  return ok(result, { status: result.ok ? 200 : 400 });
}
