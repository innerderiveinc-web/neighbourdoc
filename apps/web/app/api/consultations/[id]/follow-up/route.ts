import { api, fail, ok, readJson } from "../../../_server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await readJson<{ responseCode: "1" | "2" | "3" | 1 | 2 | 3; notes?: string }>(request);

  if (!body.responseCode || !["1", "2", "3", 1, 2, 3].includes(body.responseCode)) {
    return fail("Invalid responseCode. Must be 1 (recovered), 2 (mild symptoms), or 3 (worsening).", 400);
  }

  try {
    const result = api.recordFollowUpResponse(id, {
      responseCode: body.responseCode,
      notes: body.notes
    });
    return ok(result);
  } catch (err: any) {
    return fail(err.message || "Failed to record follow-up response.", 400);
  }
}
