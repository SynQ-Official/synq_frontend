import { api } from "@/lib/api/client";
import { profileApi } from "@/lib/api/patient";

/**
 * Whether Mira has anything left to do for the signed-in patient: `done` (go to the dashboard) or `open` (start or resume).
 * The API decides (`GET /me/orientation`): a track the care team set, or a finished orientation, closes Mira without a
 * single Mira call. Only while Mira is still required does the attempt count matter (a spent last attempt closes it too).
 * Rejects with the API's error; the caller decides what a 401 or an outage means.
 */
export async function resolveOrientation(): Promise<"done" | "open"> {
  const { data } = await profileApi.orientation();
  if (!data.miraRequired) return "done";
  const attempts = await api.get<{ blocked?: boolean }>("/mira/attempts");
  return attempts.blocked ? "done" : "open";
}
