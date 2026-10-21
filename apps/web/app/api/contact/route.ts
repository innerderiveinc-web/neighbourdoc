import { api, fail, ok, readJson } from "../_server";
import { ContactTicketSchema } from "@neighbourdoc/shared";

export async function POST(request: Request) {
  try {
    const rawBody = await readJson(request);
    const parsed = ContactTicketSchema.safeParse(rawBody);

    if (!parsed.success) {
      const errorMsg = parsed.error.errors[0]?.message || "Valid name, phone number, and message are required.";
      return fail(errorMsg, 400);
    }

    const result = api.createContactTicket(parsed.data);
    return ok(result, { status: 201 });
  } catch (error) {
    return fail(error, 400);
  }
}
