import { describe, expect, it } from "vitest";
import { parseRole, roleDestination, signInHref } from "./auth-role";

describe("auth role routing", () => {
  it("only accepts the two known roles", () => {
    expect(parseRole("patient")).toBe("patient");
    expect(parseRole("parent")).toBe("parent");
    expect(parseRole("admin")).toBeNull();
    expect(parseRole(null)).toBeNull();
  });

  it("keeps each role inside its own area", () => {
    expect(roleDestination("patient", "/dashboard/journal?x=1")).toBe("/dashboard/journal?x=1");
    expect(roleDestination("patient", "/family")).toBeNull();
    expect(roleDestination("parent", "/family/children/abc?tab=progress")).toBe("/family/children/abc?tab=progress");
    expect(roleDestination("parent", "/dashboard")).toBeNull();
  });

  it("refuses open redirects and the portal's public pages", () => {
    for (const bad of ["//evil.com", "https://evil.com/family", "/\\evil.com", "/familyx", "/dashboardx", "javascript:alert(1)"]) {
      expect(roleDestination("parent", bad)).toBeNull();
      expect(roleDestination("patient", bad)).toBeNull();
    }
    expect(roleDestination("parent", "/family/register")).toBeNull();
    expect(roleDestination("parent", "/family/sign-in?redirect=/family")).toBeNull();
    for (const publicPage of ["/family/forgot-password", "/family/reset-password?token=x", "/family/verify-email?token=x"]) {
      expect(roleDestination("parent", publicPage)).toBeNull();
    }
    expect(roleDestination("parent", "/family/children")).toBe("/family/children");
  });

  it("builds the canonical sign-in URL", () => {
    expect(signInHref("parent")).toBe("/auth/signin?role=parent");
    expect(signInHref("parent", "/family/settings")).toBe("/auth/signin?role=parent&redirect=%2Ffamily%2Fsettings");
    expect(signInHref("parent", "/dashboard")).toBe("/auth/signin?role=parent");
    expect(signInHref("patient", "/dashboard/check-in")).toBe("/auth/signin?role=patient&redirect=%2Fdashboard%2Fcheck-in");
  });
});
