export const BRAND = {
    name: "SynQ",
    arabicName: "SynQ",
    description: "A private, guided space for mental wellbeing and clearer next steps.",
} as const;

/**
 * How to reach SynQ. Left empty on purpose: the real institutional details are provided by the company
 * and shown on /trust only when set (never invented, never a placeholder in front of a health authority).
 */
export const CONTACT: { email: string | null; phone: string | null; address: string | null } = {
    email: null,
    phone: null,
    address: null,
};

/**
 * Emergency line shown in footers and on /trust. TODO(owner): confirm the number and add a local helpline.
 * Only the number given by the owner is used here; nothing is looked up or invented.
 */
export const EMERGENCY = { number: "999" } as const;
