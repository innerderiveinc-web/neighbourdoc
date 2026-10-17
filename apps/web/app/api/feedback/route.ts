import { api, ok, readJson } from "../_server";

export async function POST(request: Request) {
  return ok(api.addFeedback(await readJson(request)), { status: 201 });
}
