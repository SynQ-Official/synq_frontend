import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { emptyCheckinForm, errorKind, fromObservation, isEmptyCheckin, toCheckinInput, visibleTabs } from "./logic";
import type { Permissions } from "./api";

const none: Permissions = { canCheckin: false, canJournal: false, canViewReports: false, canUseGuidance: false, canViewResources: false, canUseSafetyPlan: false, childSelfReport: false, viewChildSelfReport: false, showClinician: false };

describe("family portal logic", () => {
  it("shows only the tabs the clinician granted", () => {
    expect(visibleTabs(none)).toEqual(["overview"]);
    expect(visibleTabs({ ...none, canCheckin: true, canUseSafetyPlan: true })).toEqual(["overview", "checkin", "safety"]);
    expect(visibleTabs({ ...none, canViewResources: true })).toEqual(["overview", "resources", "room"]);
  });

  it("sends unknown answers as null with no source, known answers with their source", () => {
    const form = emptyCheckinForm();
    form.mood = { value: 2, source: "REPORTED_BY_CHILD" };
    form.sleepHours = { value: 7.5, source: "OBSERVED" };
    form.difficulties = ["sleep"];
    const input = toCheckinInput(form);
    expect(input).toEqual(expect.objectContaining({ mood: 2, energy: null, focus: null, sleepHours: 7.5, difficulties: ["sleep"] }));
    expect(input.sources).toEqual({ mood: "REPORTED_BY_CHILD", sleepHours: "OBSERVED" });
  });

  it("an all-unknown form is empty, and a saved observation round-trips", () => {
    expect(isEmptyCheckin(emptyCheckinForm())).toBe(true);
    const back = fromObservation({ mood: 3, energy: null, sources: { mood: "REPORTED_BY_CHILD", energy: "UNKNOWN" }, behaviors: ["calm"] });
    expect(back.mood).toEqual({ value: 3, source: "REPORTED_BY_CHILD" });
    expect(back.energy.value).toBeNull();
    expect(toCheckinInput(back).sources).toEqual({ mood: "REPORTED_BY_CHILD" });
  });

  it("maps server refusals to what the parent needs to know", () => {
    expect(errorKind(new ApiError("x", 403, "FAMILY_ACCESS_NOT_ACTIVE"))).toBe("not-active");
    expect(errorKind(new ApiError("x", 403, "FAMILY_PERMISSION_DENIED"))).toBe("denied");
    expect(errorKind(new ApiError("x", 409, "FAMILY_LINK_STALE"))).toBe("stale");
    expect(errorKind(new ApiError("x", 404))).toBe("not-found");
    expect(errorKind(new ApiError("x", 0))).toBe("network");
    expect(errorKind(new Error("x"))).toBe("other");
  });
});
