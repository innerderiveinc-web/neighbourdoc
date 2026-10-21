import { api, fail, ok, readJson, requireRole } from "../_server";
import { CreateDoctorSchema } from "@neighbourdoc/shared";

export async function GET() {
  return ok(api.listDoctors());
}

export async function POST(request: Request) {
  const guard = requireRole(request, ["admin", "superadmin"]);
  if (!guard.authorized) return guard.response;

  try {
    const rawBody = await readJson(request);
    const parsed = CreateDoctorSchema.safeParse(rawBody);
    if (!parsed.success) {
      const errorMsg = parsed.error.errors[0]?.message || "Invalid doctor registration input.";
      return fail(errorMsg, 400);
    }

    return ok(api.createDoctor(parsed.data), { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
