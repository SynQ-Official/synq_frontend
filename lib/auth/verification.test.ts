import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { resendAnswer, runResend, verifyFailure } from "./verification";

describe("resendAnswer", () => {
  it("reads the two documented answers and rejects anything else", () => {
    expect(resendAnswer({ sent: true })).toBe("sent");
    expect(resendAnswer({ alreadyVerified: true })).toBe("alreadyVerified");
    expect(resendAnswer({ sent: false })).toBeNull();
    expect(resendAnswer(null)).toBeNull();
    expect(resendAnswer("sent")).toBeNull();
  });
});

describe("runResend", () => {
  it("maps the answer, the throttle and any other failure to a banner outcome", async () => {
    await expect(runResend(async () => ({ sent: true }))).resolves.toBe("sent");
    await expect(runResend(async () => ({ alreadyVerified: true }))).resolves.toBe("alreadyVerified");
    await expect(runResend(async () => { throw new ApiError("slow down", 429); })).resolves.toBe("throttled");
    await expect(runResend(async () => { throw new ApiError("down", 502); })).resolves.toBe("error");
    await expect(runResend(async () => ({}))).resolves.toBe("error");
  });
});

describe("verifyFailure", () => {
  it("reports only the API's invalid-token code as invalid", () => {
    expect(verifyFailure(new ApiError("bad", 400, "VERIFICATION_TOKEN_INVALID"))).toBe("invalid");
    expect(verifyFailure(new ApiError("down", 0))).toBe("unavailable");
    expect(verifyFailure(new ApiError("bad", 400))).toBe("invalid");
    expect(verifyFailure(new ApiError("bad", 400, "SOMETHING_ELSE"))).toBe("invalid");
    expect(verifyFailure(new ApiError("down", 500))).toBe("unavailable");
    expect(verifyFailure(new Error("network"))).toBe("unavailable");
  });
});
