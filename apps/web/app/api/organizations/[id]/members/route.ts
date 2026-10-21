import { api, fail, ok, readJson, requireRole } from "../../../_server";
import { AddOrganizationMemberSchema } from "@neighbourdoc/shared";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = requireRole(request, ["admin", "superadmin", "partner"]);
  if (!guard.authorized) return guard.response;

  try {
    const { id } = await context.params;

    // Enforce multi-tenant scoping: Partners can ONLY add members to their own organization
    if (guard.user.role === "partner") {
      if (!guard.user.organizationId || guard.user.organizationId !== id) {
        return fail("Forbidden: You cannot manage members for another organization.", 403);
      }
    }

    const rawBody = await readJson(request);
    const parsed = AddOrganizationMemberSchema.safeParse(rawBody);
    if (!parsed.success) {
      const errorMsg = parsed.error.errors[0]?.message || "Invalid organization member details.";
      return fail(errorMsg, 400);
    }

    return ok(api.addOrganizationMember(id, parsed.data, guard.user), { status: 201 });
  } catch (error) {
    return fail(error, 404);
  }
}
