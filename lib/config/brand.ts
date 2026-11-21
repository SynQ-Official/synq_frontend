export const BRAND = {
    name: "SynQ",
    arabicName: "SynQ",
    description: "A private, guided space for mental wellbeing and clearer next steps.",
} as const;

/**
 * How to reach SynQ. Left empty on purpose: the real institutional details are provided by the company
 * and shown on /privacy only when set (never invented, never a placeholder in front of a health authority).
 */
export const CONTACT: { email: string | null; phone: string | null; address: string | null } = {
    email: null,
    phone: null,
    address: null,
};

/**
 * Official profiles (LinkedIn, X, Instagram…), emitted as `sameAs` in the Organization JSON-LD.
 * Owner to add the real profile URLs. Empty on purpose: none is guessed, and `sameAs` is omitted until then.
 */
export const SOCIAL_PROFILES: readonly string[] = [];

// Emergency and crisis numbers live in config/emergency.ts.
