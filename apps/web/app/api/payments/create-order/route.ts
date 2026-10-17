import { api, ok, readJson } from "../../_server";

export async function POST(request: Request) {
  return ok(api.createPaymentOrder(await readJson(request)), { status: 201 });
}
