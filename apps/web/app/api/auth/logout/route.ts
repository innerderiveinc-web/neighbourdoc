import { api, ok } from "../../_server";

export async function POST() {
  return ok(api.logout());
}
