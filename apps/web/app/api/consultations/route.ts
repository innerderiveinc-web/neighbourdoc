import { api, ok, readJson } from "../_server";

export async function GET() {
  return ok(api.listConsultations());
}

export async function POST(request: Request) {
  const result = api.createConsultation(await readJson(request));
  return ok(result, { status: result.ok ? 201 : 409 });
}
