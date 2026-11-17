/**
 * Splits one of Mira's messages into what she says first and the question she asks, for display only.
 *
 * Mira writes `lead \n\n [transition \n\n] [head] question`, where head is "Situation 2 of 5: ",
 * "Question 3 of 5: " or "Last question: " (or the Arabic equivalent). The wording is never changed:
 * lead + head + question is the original text.
 */
export type QuestionKind = "situation" | "choice" | "final";

export type SplitMessage = {
  lead: string;
  /** The head as written by Mira, without its colon ("Situation 2 of 5"); null for an unlabelled question. */
  label: string | null;
  kind: QuestionKind | null;
  question: string | null;
};

const HEAD = /(Situation \d+ of \d+|الموقف \d+ من \d+|Question \d+ of \d+|السؤال \d+ من \d+|Last question|السؤال الأخير)\s*:\s*/;

function kindOf(label: string): QuestionKind {
  if (/^(Situation|الموقف)/.test(label)) return "situation";
  if (/^(Last|السؤال الأخير)/.test(label)) return "final";
  return "choice";
}

export function splitQuestion(content: string): SplitMessage {
  const text = content.replace(/\r/g, "").trimEnd();
  const cut = text.lastIndexOf("\n\n");
  const before = cut === -1 ? "" : text.slice(0, cut);
  const last = cut === -1 ? text : text.slice(cut + 2).trim();

  const head = last.match(HEAD);
  const asked = head?.index !== undefined ? last.slice(head.index + head[0].length).trim() : "";
  // No question after the head yet (a reply still streaming in): keep the text whole rather than hide the head.
  if (head && head.index !== undefined && asked) {
    const prefix = last.slice(0, head.index).trim(); // e.g. "Here is the question again:"
    return {
      lead: [before, prefix].filter(Boolean).join("\n\n"),
      label: head[1],
      kind: kindOf(head[1]),
      question: asked,
    };
  }
  // Unlabelled (the open questions): the closing paragraph is the question when it asks one.
  if (cut !== -1 && /[?؟]\s*$/.test(last)) return { lead: before, label: null, kind: null, question: last };
  return { lead: text, label: null, kind: null, question: null };
}
