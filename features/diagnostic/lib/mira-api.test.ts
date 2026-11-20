import { describe, expect, it } from "vitest";
import { miraResultSchema, miraTurnSchema } from "./mira-api";

const result = {
  assessment_complete: true,
  recommended_pathway: "ADHD",
  match_strength: "MODERATE",
  supporting_features: ["distractibility"],
  contradictory_features: [],
  other_signals: [],
  missing_information: [],
  safety: { level: "routine", flags: [] },
  orientation_label: "ADHD",
  confidence: null,
  requires_clinician_review: true,
  orientation: "orientation: ADHD clinical assessment",
  disclaimer: "Not a diagnosis.",
  language: "en",
};

const without = (key: keyof typeof result) => Object.fromEntries(Object.entries(result).filter(([name]) => name !== key));

describe("miraResultSchema", () => {
  it("accepts the redacted patient payload with a null confidence", () => {
    const parsed = miraResultSchema.parse(result);
    expect(parsed.confidence).toBeNull();
    expect(parsed.orientation_label).toBe("ADHD");
  });

  it("drops the per-track scores if they ever come back", () => {
    const parsed = miraResultSchema.parse({ ...result, condition_scores: { adhd: 0.8 }, orientation_percentages: { ADHD: 80 } });
    expect(parsed).not.toHaveProperty("condition_scores");
    expect(parsed).not.toHaveProperty("orientation_percentages");
  });

  it("reads an older stored report: missing lists empty, missing review flag recommends a review", () => {
    const legacy = { ...without("supporting_features"), requires_clinician_review: undefined, disclaimer: undefined };
    const parsed = miraResultSchema.parse({ ...legacy, match_strength: "high", orientation_label: null });
    expect(parsed.supporting_features).toEqual([]);
    expect(parsed.requires_clinician_review).toBe(true);
    expect(parsed.disclaimer).toBe("");
    expect(parsed.match_strength).toBe("HIGH");
    expect(parsed.orientation_label).toBeUndefined();
  });

  it("keeps the v2 qualitative levels and drops unknown areas or levels", () => {
    const parsed = miraResultSchema.parse({
      ...result,
      orientation_levels: { ADHD: "more_prominent", BIPOLAR: "limited", PSYCHOSIS: "something_new", OTHER: "moderate" },
      explored_in_depth: ["ADHD"],
      orientation_uncertain: false,
      adaptive_trace: { tracks: {} },
    });
    expect(parsed.orientation_levels).toEqual({ ADHD: "more_prominent", BIPOLAR: "limited" });
    expect(parsed.explored_in_depth).toEqual(["ADHD"]);
    expect(parsed.orientation_uncertain).toBe(false);
    expect(parsed).not.toHaveProperty("adaptive_trace");
  });

  it("reads a v1 report, which has no levels", () => {
    const parsed = miraResultSchema.parse(result);
    expect(parsed.orientation_levels).toBeUndefined();
    expect(parsed.explored_in_depth).toBeUndefined();
  });

  it("refuses a result without an orientation", () => {
    expect(miraResultSchema.safeParse(without("orientation")).success).toBe(false);
  });
});

describe("miraTurnSchema", () => {
  it("turns null options into an empty list and an unknown chapter into undefined", () => {
    const parsed = miraTurnSchema.parse({
      assistant_message: "Hello",
      chapter: "NEW_CHAPTER",
      chapter_progress: 0.25,
      assessment_complete: false,
      safety: { level: "routine", flags: [] },
      result: null,
      language: "ar",
      options: null,
    });
    expect(parsed.options).toEqual([]);
    expect(parsed.chapter).toBeUndefined();
  });

  const turn = { assistant_message: "Hi", chapter_progress: 0.1, assessment_complete: false, safety: { level: "routine", flags: [] }, language: "en" };

  it.each(["OPEN", "FINAL", "EXPLORATION", "CONTEXT", "PRECISION", "DONE"])("accepts the %s phase (v1 and v2 sessions)", (phase) => {
    expect(miraTurnSchema.parse({ ...turn, phase, questions_total: 26 }).phase).toBe(phase);
  });

  it("drops a phase it does not know instead of rejecting the turn", () => {
    const parsed = miraTurnSchema.parse({ ...turn, phase: "SOMETHING_NEW" });
    expect(parsed.phase).toBeUndefined();
    expect(parsed.assistant_message).toBe("Hi");
  });
});
