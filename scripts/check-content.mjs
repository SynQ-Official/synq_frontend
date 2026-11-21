#!/usr/bin/env node
/**
 * Fails when shipped copy contains draft markers, the wrong crisis number or banned wording.
 * Only string literals and JSX text are read (comments are stripped first), so code comments and identifiers never trip it.
 * Usage: npm run check:content
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const SCAN = ["app", "components", "config", "content", "lib/i18n", "lib/config", "lib/family/copy.ts"];
const EXTENSIONS = /\.(ts|tsx|mjs|json)$/;
// Tests assert on banned values on purpose.
const SKIP = [/\.test\.tsx?$/, /\.spec\.tsx?$/];

/** Markers that are wrong anywhere, even inside a single token. */
const HARD_RULES = [
  [/\bTODO\b/, "TODO"],
  [/\bTBD\b/, "TBD"],
  [/\blorem\b/i, "lorem"],
  [/(?<![\d.#-])197(?![\d.])/, "197 (Tunisian police line, not a crisis line)"],
  [/✨/u, "✨"],
  [/\bar_AR\b/, "ar_AR (use ar_AE)"],
];

/** Wording rules: only applied to prose, never to class lists, storage keys, import paths or identifiers. */
const COPY_RULES = [
  [/vitamind/i, "vitamind"],
  [/\bHot partners\b/i, "Hot partners"],
  [/\bseamless/i, "seamless"],
  [/\bempower/i, "empower"],
  [/\bjourneys?\b/i, "journey"],
  [/\bunlock/i, "unlock"],
  [/\bholistic/i, "holistic"],
  [/\bcutting[- ]edge\b/i, "cutting-edge"],
  [/\bmonitor(?:s|ed|ing)?\b/i, "monitor"],
  [/\btracks? you\b/i, "track you"],
  [/\bwatch(?:es|ed|ing)?\b/i, "watch", "public"],
  [/\bdetect(?:s|ed|ing|ion)?\b/i, "detect"],
  [/\bsurveillance\b/i, "surveillance"],
  [/\bdrift\b/i, "drift"],
  [/\bAI[- ]powered\b/i, "AI-powered"],
  [/\bCompanions?\b/i, "Companions"],
  [/\bcalm(?:er|est|ly|ing)?\b/i, "calm (as a selling point)", "public"],
  [/\bclearer visibility\b/i, "clearer visibility"],
  [/\bbaselines?\b/i, "baseline (say: your usual range)"],
  [/\bsuffer(?:s|ing)? from\b/i, "suffer from"],
  [/\bbattl(?:e|es|ing)\b/i, "battle"],
  [/\b(?:bipolars|schizophrenics|psychotics)\b/i, "diagnosis used as a noun"],
];

/**
 * Rules marked "public" apply to the public site only. Inside the care app and the parent safety plan "calm" names a
 * feature ("Calm corner") or is an instruction ("one calm adult speaks"), and "watch for" is guidance to a parent.
 */
const PUBLIC = /^(app\/(?!dashboard|family|welcome)|components\/(home|agents|legal|support|tracks|layout|help|invite)\/|lib\/i18n\/(config|agents|homeStory|healthcare|team|tracks|trust|legal|help)\.ts|lib\/config\/|config\/|content\/)/;

/** Exact-literal exceptions: [file suffix, literal]. Keep this list short; each entry is code, never copy. */
const ALLOW = [
  // The header menu keeps its original name by the product owner's choice ("Companions", with Mira, Lumina, Clinician Workspace).
  ["lib/i18n/config.ts", "Companions"],
  // A symptom of psychosis described in the person's own words on /tracks, not SynQ watching anyone.
  ["lib/i18n/tracks.ts", "Strong beliefs, or a sense of being watched"],
];

/** A literal that is code, not copy: one token (key, path, identifier) or a Tailwind class list. */
export function isCode(text) {
  const trimmed = text.trim();
  if (!/\s/.test(trimmed)) return /^[\w@./:#${}*%\-[\]()]+$/.test(trimmed) && !/^[A-Z][a-z]/.test(trimmed);
  const tokens = trimmed.split(/\s+/);
  const classy = tokens.filter((token) => /^[!a-z0-9:[\]()/_.%#&,-]+$/.test(token) && /[-:[]/.test(token));
  return classy.length >= tokens.length / 2;
}

function files(path) {
  const full = join(ROOT, path);
  let stat;
  try {
    stat = statSync(full);
  } catch {
    return [];
  }
  if (stat.isFile()) return EXTENSIONS.test(full) ? [full] : [];
  return readdirSync(full).flatMap((name) => files(join(path, name)));
}

/** Blank out comments while keeping offsets, so reported line numbers stay right. `://` (URLs) is not a comment. */
function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\/|(^|[^:"'`\\])\/\/[^\n]*/gm, (match, lead = "") => lead + match.slice(lead.length).replace(/[^\n]/g, " "));
}

/** Quoted strings, template literals, and JSX text between tags. */
const LITERAL = /"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`|>([^<>{}\n]+)</g;

export function scan(rel, raw) {
  const found = [];
  const source = stripComments(raw);
  for (const match of source.matchAll(LITERAL)) {
    const text = match[1] ?? match[0].slice(1, -1);
    if (ALLOW.some(([suffix, value]) => rel.endsWith(suffix) && text === value)) continue;
    const rules = isCode(text) ? HARD_RULES : [...HARD_RULES, ...COPY_RULES.filter(([, , scope]) => scope !== "public" || PUBLIC.test(rel))];
    for (const [pattern, label] of rules) {
      if (!pattern.test(text)) continue;
      const line = source.slice(0, match.index).split("\n").length;
      found.push(`${rel}:${line}  ${label}  ->  ${text.trim().slice(0, 110)}`);
    }
  }
  return found;
}

const problems = SCAN.flatMap(files)
  .map((file) => [relative(ROOT, file).split(sep).join("/"), file])
  .filter(([rel]) => !SKIP.some((pattern) => pattern.test(rel)))
  .flatMap(([rel, file]) => scan(rel, readFileSync(file, "utf8")));

if (problems.length) {
  console.error(problems.join("\n"));
  console.error(`\ncheck:content failed: ${problems.length} problem(s).`);
  process.exit(1);
}
console.log("check:content passed.");
