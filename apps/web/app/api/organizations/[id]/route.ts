import { api, ok } from "../../_server";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const organization = api.getOrganization(id);
  return ok(organization ?? { ok: false, error: "Organization not found." }, { status: organization ? 200 : 404 });
}
