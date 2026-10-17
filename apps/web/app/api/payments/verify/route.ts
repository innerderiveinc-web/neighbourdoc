import { api, ok, readJson } from "../../_server";

export async function POST(request: Request) {
  const result = api.verifyPayment(await readJson(request));
  return ok(result, { status: result.ok ? 200 : 404 });
}
