import { api, fail, ok, readJson } from "../_server";

export async function POST(request: Request) {
  try {
    const body = await readJson<{ name?: string; phone?: string; message?: string }>(request);
    if (!body.name || !body.phone || !body.message) {
      return fail("Name, valid phone, and message are required.", 400);
    }
    const result = api.createContactTicket({
      name: body.name,
      phone: body.phone,
      message: body.message
    });
    return ok(result, { status: 201 });
  } catch (error) {
    return fail(error, 400);
  }
}
