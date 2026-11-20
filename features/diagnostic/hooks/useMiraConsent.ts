"use client";

import { useCallback, useState } from "react";
import { profileApi } from "@/lib/api/patient";
import { CONSENT_VERSION } from "@/lib/patient/consent";

/**
 * The consent to the orientation, as the chat needs it: the API asks for it (ORIENTATION_CONSENT_REQUIRED), the
 * patient accepts the current text, and the SAME orientation resumes (`resume` is the session's to decide).
 */
export function useMiraConsent(): {
  required: boolean;
  busy: boolean;
  failed: boolean;
  require: () => void;
  accept: (resume: () => void) => Promise<void>;
} {
  const [required, setRequired] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const require = useCallback(() => setRequired(true), []);

  const accept = useCallback(async (resume: () => void) => {
    setBusy(true);
    setFailed(false);
    try {
      await profileApi.setOrientationConsent(true, CONSENT_VERSION);
      setRequired(false);
      resume();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }, []);

  return { required, busy, failed, require, accept };
}
