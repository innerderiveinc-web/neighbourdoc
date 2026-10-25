import crypto from "node:crypto";
import { getConsultationPrice, type ConsultationPlan } from "@neighbourdoc/shared";
import type { PaymentOrder } from "../types/index.ts";

export function createPaymentOrder(plan: ConsultationPlan): PaymentOrder {
  const price = getConsultationPrice(plan);
  return {
    orderId: `order_${crypto.randomUUID()}`,
    amount: price.amount,
    currency: price.currency,
    gateway: "razorpay",
    keyId: process.env.RAZORPAY_KEY_ID ?? "rzp_test_replace_me"
  };
}

export function verifyRazorpaySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!secret || !signature || !payload) return false;
  try {
    const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    if (expected.length !== signature.length) return false;
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}
