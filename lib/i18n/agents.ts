import { DEMO_CLINICIAN, DEMO_OBSERVATIONS, DEMO_PATIENT } from "@/content/demo-fixtures";
import type { Lang } from "@/lib/i18n/config";

/**
 * Copy for the dedicated agent pages (/mira, /lumina, /psy) and the home page's agents section. Short on purpose:
 * titles, one line each, and the few numbers that matter. `ar` is typed against the same shape as `en`: a missing
 * key fails the build. Names, roles and status lines live in `dictionary.header.agents.items`.
 */

type Pair = readonly [title: string, line: string];
type Item = readonly [title: string, line: string, tag: string];

export type AgentPageCopy = {
  seo: { title: string; description: string };
  hero: { eyebrow: string; titleA: string; titleB: string; body: string; primary: string; secondary: string };
  /** Three numbers under the hero: [value, label]. */
  stats: readonly Pair[];
  role: { eyebrow: string; titleA: string; titleB: string; items: readonly Item[] };
  flow: { eyebrow: string; titleA: string; titleB: string; stepLabel: string; steps: readonly Pair[] };
  trust: {
    eyebrow: string;
    titleA: string;
    titleB: string;
    doesTitle: string;
    does: readonly string[];
    doesNotTitle: string;
    doesNot: readonly string[];
    note: string;
  };
  handoff: { eyebrow: string; title: string; body: string; cta: string };
  cta: { eyebrow: string; titleA: string; titleB: string; body: string; primary: string; benefits: readonly string[] };
};

export type MiraPreviewCopy = {
  caption: string;
  /** The screening tools floating around the hero phone. */
  tools: readonly string[];
  chat: { title: string; chapter: string; question: string; answer: string; typing: string };
  chapters: readonly string[];
  safetyChip: string;
  screens: {
    hello: { greeting: string; ask: string; name: string; cta: string };
    days: { chapter: string; question: string; options: readonly string[] };
    safety: { title: string; status: string; ok: string };
    result: { title: string; signalsTitle: string; areas: readonly string[]; levels: readonly string[]; note: string; review: string; reviewValue: string; download: string };
  };
};

export type LuminaPreviewCopy = {
  caption: string;
  signals: readonly string[];
  today: string;
  saved: string;
  greeting: string;
  views: {
    checkin: { title: string };
    journal: { title: string; entry: string; themes: readonly string[]; note: string };
    trend: { title: string; baseline: string; today: string; verdict: string; consistency: string };
    report: { title: string; sections: readonly string[]; share: string; consent: string };
  };
  bento: { goals: string; week: string };
  /**
   * The first screen of the app, as the window on /lumina and the hero draw it. `levels` [lower, usual, higher] read each
   * ring against the person's usual range, centred on usual (as on /care-paths), never a "higher is better" score.
   */
  home: { wellbeing: string; wellbeingLine: string; levels: readonly [string, string, string]; signalsTitle: string; signals: readonly string[]; planTitle: string; plan: readonly string[]; nextTitle: string; nextLine: string };
};

export type LuminaTracksCopy = {
  eyebrow: string;
  titleA: string;
  titleB: string;
  intro: string;
  /** What every user does, whatever the condition. */
  sharedTitle: string;
  sharedLine: string;
  /** The interactive mood card of the shared routine: five levels, one supportive line each. */
  mood: { title: string; prompt: string; levels: readonly string[]; messages: readonly string[]; saved: string };
  cards: readonly { tag: string; title: string; line: string; points: readonly string[] }[];
  /** Illustrative content for the small live previews inside the two cards (shown under the page's "example content" caption). */
  demo: {
    spark: { heading: string; tasks: readonly string[]; steps: readonly string[]; reminder: string; tip: string };
    library: { heading: string; items: readonly Pair[]; breathe: string };
  };
};

/**
 * The clinician app, drawn on /psy as the real dashboard: its rail, its overview, a request, a patient and a weekly report.
 * Names are examples; codes and times stay as they are in both languages.
 */
export type PsyPreviewCopy = {
  caption: string;
  /** The "shared by the patient" tag: the one rule behind every screen. */
  shared: string;
  greeting: string;
  summary: string;
  /** [name, role] of the signed-in clinician. */
  clinician: Pair;
  search: string;
  /** Rail groups: [group title, item labels]. Same order as the real app, icons are fixed in the component. */
  nav: readonly (readonly [group: string, items: readonly string[]])[];
  settings: string;
  /** The red card of the rail: [title, call to action]. */
  triage: Pair;
  /** The two buttons of the page header: [triage, schedule]. */
  actions: Pair;
  period: string;
  /** [label, value, caption]. */
  kpis: readonly (readonly [label: string, value: string, caption: string])[];
  activity: { title: string; description: string; tabs: readonly string[]; legend: readonly string[] };
  risk: { title: string; description: string; labels: readonly string[]; worsened: string };
  /** [title, meta, badge]. */
  attention: { title: string; description: string; items: readonly (readonly [title: string, meta: string, badge: string])[] };
  /** [time, patient, kind and length]. */
  agenda: { title: string; description: string; today: string; items: readonly (readonly [time: string, patient: string, line: string])[] };
  /** [name, code, last activity]. */
  patients: { title: string; description: string; all: string; columns: readonly string[]; rows: readonly (readonly [name: string, code: string, last: string, observation: string])[] };
  requests: {
    title: string;
    description: string;
    waiting: string;
    note: string;
    /** [name, code, line, wait]. */
    items: readonly (readonly [name: string, code: string, line: string, wait: string])[];
    primary: string;
    accept: string;
    decline: string;
    accepted: string;
  };
  patient: {
    back: string;
    name: string;
    code: string;
    chips: readonly string[];
    statusTitle: string;
    /** [label, value]. */
    facts: readonly Pair[];
    tabs: readonly string[];
    chartTitle: string;
    baseline: string;
    verdict: string;
    signals: readonly string[];
    alertsTitle: string;
    alert: string;
    notShared: string;
  };
  report: {
    title: string;
    description: string;
    patient: string;
    headline: string;
    period: string;
    sections: readonly string[];
    annotate: string;
    annotation: string;
    acknowledge: string;
    acknowledged: string;
  };
};

export type AgentPagesCopy = {
  mira: AgentPageCopy & { preview: MiraPreviewCopy };
  lumina: AgentPageCopy & { preview: LuminaPreviewCopy; tracks: LuminaTracksCopy };
  /** `requestAccess` replaces the workspace sign-in label while the clinician app has no public URL (PSY_APP_URL). */
  psy: AgentPageCopy & { preview: PsyPreviewCopy; requestAccess: string };
};

const en: AgentPagesCopy = {
  mira: {
    seo: {
      title: "Mira: 2-minute orientation for ADHD, bipolar and psychosis",
      description:
        "Mira is SynQ's AI assistant: a 2-minute guided questionnaire built on the ASRS, MDQ and PQ-B screening tools for ADHD, bipolar disorder and psychosis. Not a diagnosis.",
    },
    hero: {
      eyebrow: "Mira · AI orientation assistant",
      titleA: "Mira: a 2-minute first conversation",
      titleB: "before you see your clinician.",
      body: "SynQ's AI assistant for your first step: a two-minute guided questionnaire, written as a chat, built on screening tools clinicians use (ASRS, MDQ, PQ-B). You leave with a summary to discuss with a clinician. Mira is software, not a person, and does not diagnose.",
      primary: "Start with Mira",
      secondary: "See how it works",
    },
    stats: [
      ["~2", "minutes"],
      ["3", "conditions covered"],
      ["1", "time, at the start"],
    ],
    role: {
      eyebrow: "What Mira does",
      titleA: "What happens",
      titleB: "in the conversation.",
      items: [
        ["Everyday questions", "Everyday situations and quick questions, at your own pace.", "Questions"],
        ["Established screening tools", "Questions adapted from ASRS v1.1 (adult ADHD), MDQ (bipolar disorder) and PQ-B (psychosis), asked as a conversation.", "Tools"],
        ["A suggested next step", "Your answers are summarised by area, with a suggested next step to discuss with your clinician.", "Next step"],
        ["Safety check", "If an answer suggests you may be in danger, Mira shows emergency numbers at once, and alerts your clinician if you have connected one.", "Safety"],
        ["A summary for your clinician", "The main points of your answers, to read with your clinician. Shared only if you choose.", "Summary"],
        ["Private, bilingual", "English or Arabic. Saved to your account, private by default.", "Private"],
      ],
    },
    flow: {
      eyebrow: "How Mira works",
      titleA: "From hello to",
      titleB: "a clear next step.",
      stepLabel: "Step",
      steps: [
        ["Say hello", "Just a first name."],
        ["Talk through your days", "Four short chapters, your own words."],
        ["Safety stays on", "If an answer suggests danger, you see emergency numbers at once."],
        ["Get your summary", "Your answers by area, and a suggested next step."],
      ],
    },
    trust: {
      eyebrow: "Clear boundaries",
      titleA: "Orientation,",
      titleB: "not a diagnosis.",
      doesTitle: "Mira does",
      does: ["Questions based on established tools", "A plain-language summary", "A next-step suggestion", "Emergency numbers the moment you may be at risk"],
      doesNotTitle: "Mira never",
      doesNot: ["Diagnose", "Recommend treatment or medication", "Replace a clinician", "Share without your consent"],
      note: "In an emergency, contact local emergency services or a qualified clinician immediately.",
    },
    handoff: { eyebrow: "After Mira", title: "Meet Lumina.", body: "Your daily space: check-in, journal, your usual range.", cta: "Discover Lumina" },
    cta: {
      eyebrow: "Begin when you are ready",
      titleA: "Two minutes,",
      titleB: "then a conversation with your clinician.",
      body: "Create your account, give your consent, and the orientation opens right away. Connect a clinician later, when you choose.",
      primary: "Start with Mira",
      benefits: ["Open to adults, no referral needed", "Private by default", "A summary for your clinician"],
    },
    preview: {
      caption: "Illustration — example content",
      tools: ["ASRS · ADHD", "MDQ · Bipolar", "PQ-B · Psychosis"],
      chat: {
        title: "Orientation",
        chapter: "Evening",
        question: "How often do you get outside for a walk during the week?",
        answer: "A few times — maybe twice a week.",
        typing: "Next question…",
      },
      chapters: ["Morning", "Midday", "Evening", "Inner voice"],
      safetyChip: "Safety · no urgent flags",
      screens: {
        hello: { greeting: "Hello, I'm Mira.", ask: "What should I call you?", name: DEMO_PATIENT.firstName.en, cta: "Continue" },
        days: { chapter: "Evening", question: "How often do you get outside for a walk during the week?", options: ["Never", "Sometimes", "Often"] },
        safety: { title: "Safety check", status: "Listening", ok: "No urgent flags" },
        result: {
          title: "Your orientation",
          signalsTitle: "Signals observed",
          areas: ["Mood and energy", "Focus and attention", "Perceptions and beliefs"],
          levels: ["More prominent signal", "Moderate signal", "Limited signal"],
          note: "Not a diagnosis. A clinician reads it with you.",
          review: "Clinician review",
          reviewValue: "Recommended",
          download: "Download report",
        },
      },
    },
  },
  lumina: {
    seo: {
      title: "Lumina: daily check-in, private journal and monthly summary",
      description:
        "Lumina is SynQ's daily app: a 30-second check-in on mood, energy, focus, stress and sleep, a private journal, and a monthly summary shared only if you choose.",
    },
    hero: {
      eyebrow: "Lumina · Daily check-in and journal",
      titleA: "Lumina: a 30-second daily check-in",
      titleB: "and a private journal.",
      body: "The part of SynQ you use every day: a 30-second check-in on mood, energy, focus, stress and sleep, and a private journal. As days add up, Lumina shows your usual range so changes stand out, and prepares a monthly summary you choose whether to share.",
      primary: "Sign in to Lumina",
      secondary: "See how it works",
    },
    stats: [
      ["5", "questions a day"],
      ["30", "days in each summary"],
      ["1", "summary a month"],
    ],
    role: {
      eyebrow: "What Lumina holds",
      titleA: "Six parts,",
      titleB: "one daily routine.",
      items: [
        ["A simple welcome", "Opens on how you are today, not on a wall of numbers.", "Today"],
        ["Daily check-in", "Mood, energy, focus, stress and sleep. Seconds, not forms.", "Check-in"],
        ["Smart journal", "Write in English, Gulf Arabic or both. Lumina's AI reads your entries to pick out themes and emotions; it never labels you. Your clinician sees those themes only if you switch sharing on. Entries you mark private are never analysed.", "Journal"],
        ["Your usual range", "You, compared with you. It takes shape as your check-ins add up; until then, Lumina simply shows your days.", "Usual range"],
        ["Flexible goals", "Done, partly done or missed: every day counts and none of them judges you.", "Goals"],
        ["A monthly summary you control", "The month's trends, journal themes and goals, with what the data can and cannot show. Your clinician sees it only if you switch sharing on.", "Summary"],
      ],
    },
    flow: {
      eyebrow: "A day with Lumina",
      titleA: "A few seconds a day,",
      titleB: "a clearer month.",
      stepLabel: "Step",
      steps: [
        ["Check in", "Five quick questions, a few taps. That is the whole routine."],
        ["Write freely", "English, Gulf Arabic or both, in your own words."],
        ["See it take shape", "Your usual range, your trends and the patterns worth noticing."],
        ["Share by choice", "A monthly summary for your clinician, only when you switch it on."],
      ],
    },
    trust: {
      eyebrow: "Your data, your call",
      titleA: "What Lumina does,",
      titleB: "and never does.",
      doesTitle: "Lumina does",
      does: ["Compares you with you", "Shows what each summary is based on", "Describes patterns, not causes", "Shares only with your consent"],
      doesNotTitle: "Lumina never",
      doesNot: ["Diagnose or label", "Score you against others", "Replace your clinician", "Share your journal without your consent"],
      note: "Lumina is not an emergency service. If something you write suggests you may be in danger, Lumina shows emergency numbers, and alerts your clinician if you have connected one. If you are in danger now, contact local emergency services right away.",
    },
    handoff: { eyebrow: "Before Lumina", title: "Start with Mira.", body: "A private orientation in about two minutes, done once with your account.", cta: "Meet Mira" },
    cta: {
      eyebrow: "Make the days count",
      titleA: "Lumina opens",
      titleB: "after your first conversation.",
      body: "Lumina is part of your SynQ account. Once Mira's orientation is done, your daily space opens.",
      primary: "Sign in to Lumina",
      benefits: ["Daily check-in and journal", "Private by design", "You decide what is shared"],
    },
    tracks: {
      eyebrow: "Three conditions, one daily thread",
      titleA: "Built around",
      titleB: "how you live.",
      intro: "Lumina adapts to the three conditions SynQ supports. Whatever the condition, the daily rhythm is the same — and a clinician stays in charge of care.",
      sharedTitle: "The same daily core, for everyone",
      sharedLine: "ADHD, bipolar disorder and psychosis share one simple routine.",
      mood: {
        title: "How are you today?",
        prompt: "Tap the face that fits. There is no wrong answer.",
        levels: ["Much lower", "Lower", "Usual", "Higher", "Much higher"],
        messages: [
          "Much lower than usual. Noted, and you are not alone with it.",
          "A bit lower than usual. A small step is enough today.",
          "Your usual. That counts too.",
          "A bit higher than usual. Notice how you sleep tonight.",
          "Much higher than usual. Sleep comes first tonight.",
        ],
        saved: "Saved to today",
      },
      cards: [
        {
          tag: "ADHD",
          title: "Spark, your daily organiser",
          line: "Spark is the AI assistant inside Lumina, designed for ADHD: it helps you structure your day and manage your tasks.",
          points: ["Plan and prioritise your day", "Turn big tasks into small, doable steps", "Gentle reminders, never pressure", "Organising tips built for how ADHD works"],
        },
        {
          tag: "Bipolar disorder · Psychosis",
          title: "Psychoeducation and self-management",
          line: "A library of short readings drawn from WHO, NIMH, NICE and NHS sources, to understand your condition, practise coping strategies and recognise your own triggers.",
          points: ["Psychoeducation in plain language", "Coping strategies you can practise", "Trigger and early-warning awareness", "Reading chosen from your own check-ins"],
        },
      ],
      demo: {
        spark: {
          heading: "Today with Spark",
          tasks: ["Reply to the clinic", "Prepare tomorrow's meeting", "Take a 10-minute walk"],
          steps: ["Open your notes", "Pick three points", "Send them to yourself"],
          reminder: "Reminder · 4:00 pm · Prepare tomorrow's meeting",
          tip: "Tip: start with the smallest step. Five minutes is enough.",
        },
        library: {
          heading: "Library",
          items: [
            ["Understanding your triggers", "5 min read"],
            ["A grounding exercise", "Coping strategy"],
            ["Sleep and mood", "Psychoeducation"],
          ],
          breathe: "Breathe",
        },
      },
    },
    preview: {
      caption: "Illustration — example content",
      signals: ["Mood", "Energy", "Focus", "Stress", "Sleep"],
      today: "Today",
      saved: "Saved",
      greeting: "Good evening",
      views: {
        checkin: { title: "Today's check-in" },
        journal: {
          title: "Smart Journal",
          entry: "Slept badly again, but the morning walk helped. Work still feels heavy.",
          themes: ["Sleep", "Work", "Walking"],
          note: "Themes and emotions — never a diagnosis",
        },
        trend: { title: "Last 30 days", baseline: "Your usual range", today: "Today", verdict: "Within your usual range", consistency: "Consistency" },
        report: { title: "Monthly report", sections: ["Trends", "Evidence", "Data limits"], share: "Share with my clinician", consent: "Only with your consent" },
      },
      bento: { goals: "goals today", week: "This week" },
      home: {
        wellbeing: "Today's wellbeing",
        wellbeingLine: "How you are, at a glance",
        levels: ["Lower", "Usual", "Higher"],
        signalsTitle: "Recent signals",
        signals: ["Your sleep has improved this week", "Mood steady over seven days", "Focus is higher in the morning"],
        planTitle: "Today's plan",
        plan: ["Breathing exercise", "Morning light", "Journal your thoughts"],
        nextTitle: "Within your usual range",
        nextLine: "Nothing to act on today.",
      },
    },
  },
  psy: {
    seo: {
      title: "Clinician workspace for ADHD, bipolar and psychosis care",
      description:
        "A web workspace for licensed clinicians in the UAE and Tunisia: see only what each patient chose to share, plus safety alerts with their evidence. No diagnosis.",
    },
    hero: {
      eyebrow: "Clinician Workspace · Consent-based care",
      titleA: "See what changed since the last visit,",
      titleB: "only what your patient chose to share.",
      body: "A web workspace for licensed clinicians in the UAE and Tunisia. Patients choose you; you see only what each one shares, plus safety alerts with their evidence. The SynQ team reviews every application, and the decision always stays yours.",
      primary: "Sign in to the workspace",
      secondary: "See how it works",
    },
    stats: [
      ["3", "care paths"],
      ["30", "days in each summary"],
      ["1", "summary per patient a month"],
    ],
    role: {
      eyebrow: "What the workspace holds",
      titleA: "What you see,",
      titleB: "for each patient.",
      items: [
        ["Patient requests", "Patients choose their clinician; you choose your caseload. Nothing is shared until you accept.", "Requests"],
        ["Clinical alerts", "A signal outside someone's usual range reaches you, with the evidence behind it.", "Alerts"],
        ["Patient profiles", "Usual range, trends and what Mira's orientation found, in one record.", "Patients"],
        ["Sessions and coverage", "Schedule, prepare and follow up, and see who covers when you are away.", "Sessions"],
        ["Monthly reports", "Read what the patient shared, then review and annotate it.", "Reports"],
        ["Structured notes", "Your clinical notes, kept beside the journal themes a patient chose to share.", "Notes"],
      ],
    },
    flow: {
      eyebrow: "A day in the workspace",
      titleA: "From a new request to",
      titleB: "a note in the record.",
      stepLabel: "Step",
      steps: [
        ["Accept a request", "A patient asks to share with you. You decide who joins your caseload."],
        ["See what changed", "Alerts and today's sessions first, so nothing waits unseen."],
        ["Read the picture", "Usual range, trends and signals for one patient, against their own range."],
        ["Review and annotate", "A monthly report, read and annotated. The decision stays yours."],
      ],
    },
    trust: {
      eyebrow: "Clear boundaries",
      titleA: "Support for judgment,",
      titleB: "never a substitute.",
      doesTitle: "The workspace does",
      does: ["Shows only what patients share", "Raises signals with their evidence", "Compares each patient with their own usual range", "Keeps your notes and annotations"],
      doesNotTitle: "The workspace never",
      doesNot: ["Diagnose", "Prescribe or advise treatment", "Replace a clinician's judgment", "Share data without consent"],
      note: "The workspace is a clinical support interface, not an emergency service. In immediate danger, contact local emergency services.",
    },
    handoff: { eyebrow: "What your patients use", title: "Meet Lumina.", body: "The daily check-in and journal your patients keep, and share with you only by choice.", cta: "Meet Lumina" },
    cta: {
      eyebrow: "For licensed clinicians",
      titleA: "Apply",
      titleB: "as a clinician.",
      body: "For licensed clinicians in the UAE and Tunisia. Send your application: the SynQ team reviews it and replies by e-mail.",
      primary: "Sign in to the workspace",
      benefits: ["Consent-based sharing", "Alerts with evidence", "Monthly reports"],
    },
    preview: {
      caption: "Illustrative screens of the clinician app, with example content. No real patients.",
      shared: "Shared by the patient",
      greeting: "Today",
      summary: "1 high-priority alert and 3 sessions",
      clinician: [DEMO_CLINICIAN.fullName.en, DEMO_CLINICIAN.role.en],
      search: "Search patients, sessions…",
      nav: [
        ["Workspace", ["Overview", "Requests", "Alerts", "Patients", "Sessions"]],
        ["Clinical records", ["Assessments", "Monthly reports", "Notes"]],
        ["Practice", ["Coverage", "Notifications"]],
      ],
      settings: "Settings",
      triage: ["3 alerts awaiting triage", "Open triage queue"],
      actions: ["Triage", "Schedule"],
      period: "30D",
      kpis: [
        ["Open alerts", "3", "2 new vs prev 30d"],
        ["Active patients", "12", "9 engaged vs prev 30d"],
        ["Sessions completed", "38", "vs prev 30d"],
        ["Pending reviews", "4", "2 assessments · 2 monthly reports"],
      ],
      activity: { title: "Clinical activity", description: "Last 30 days", tabs: ["Sessions", "Alerts", "Patient activity"], legend: ["Completed", "Scheduled", "Cancelled"] },
      risk: { title: "Caseload by status", description: "12 patients in your care", labels: ["Priority", "Follow up", "Stable"], worsened: "1 patient worsened since last week" },
      attention: {
        title: "Needs your attention",
        description: "Alerts, priority reports and pending reviews",
        items: [
          [DEMO_OBSERVATIONS.sleep.en, `${DEMO_PATIENT.shortName.en} · 2 hours ago`, "High"],
          [DEMO_OBSERVATIONS.checkinsPaused.en, "Omar R. · 5 hours ago", "Moderate"],
          ["Priority monthly report", "Lina B. · 1 day ago", "Priority"],
          ["Assessment awaiting review", "Mira orientation · 1 day ago", "Review"],
        ],
      },
      agenda: {
        title: "Agenda",
        description: "Upcoming sessions",
        today: "Today",
        items: [
          ["09:30", DEMO_PATIENT.shortName.en, "follow-up · 45 min"],
          ["11:00", "Adam T.", "intake · 60 min"],
          ["14:15", "Omar R.", "follow-up · 30 min"],
        ],
      },
      patients: {
        title: "Priority patients",
        description: "Ranked by status and open alerts",
        all: "All",
        columns: ["Patient", "Status", "Shared observation", "Open alerts", "Last activity"],
        rows: [
          [DEMO_PATIENT.shortName.en, DEMO_PATIENT.code, "2 hours ago", DEMO_OBSERVATIONS.sleep.en],
          ["Omar R.", "OR-007", "5 hours ago", DEMO_OBSERVATIONS.checkinsPaused.en],
          ["Lina B.", "LB-021", "1 day ago", DEMO_OBSERVATIONS.moodLower.en],
          ["Yara M.", "YM-011", "2 days ago", DEMO_OBSERVATIONS.steady.en],
        ],
      },
      requests: {
        title: "Requests",
        description: "Patients proposed to you",
        waiting: "2 patient requests waiting for your answer",
        note: "Accept or decline to start care. Nothing is shared until you do.",
        items: [
          ["Adam T.", "AT-003", "Referred after a first screening", "Waiting 1 day"],
          ["Nour S.", "NS-030", "Mira orientation completed", "Waiting 3 hours"],
        ],
        primary: "Proposed as primary",
        accept: "Accept",
        decline: "Decline",
        accepted: "Added to your patients",
      },
      patient: {
        back: "Patients",
        name: DEMO_PATIENT.shortName.en,
        code: DEMO_PATIENT.code,
        chips: ["Primary clinician"],
        statusTitle: "Clinical status",
        facts: [
          ["Status", "Priority"],
          ["Shared with you", "Mood, sleep"],
          ["Following", "8 weeks"],
          ["Language", "EN"],
        ],
        tabs: ["Overview", "Life chart", "Assessments", "Notes"],
        chartTitle: "Mood against the usual range",
        baseline: "Usual range",
        verdict: "Within range this month, one dip in week 3",
        signals: ["Sleep", "Focus", "Energy"],
        alertsTitle: "Open alerts",
        alert: DEMO_OBSERVATIONS.sleep.en,
        notShared: "Not shared by the patient: journal entries. Journal themes appear only if the patient switches sharing on. Safety alerts always reach you.",
      },
      report: {
        title: "Monthly reports",
        description: "Read, annotate and acknowledge",
        patient: DEMO_PATIENT.shortName.en,
        headline: "Monthly summary",
        period: "This month",
        sections: ["Trend", "Journal themes", "Goals"],
        annotate: "Your annotation",
        annotation: "Discuss the sleep routine at the next session.",
        acknowledge: "Acknowledge",
        acknowledged: "Acknowledged",
      },
    },
    requestAccess: "Apply for access",
  },
};

const ar: AgentPagesCopy = {
  mira: {
    seo: {
      title: "ميرا: توجيه في دقيقتين لفرط الحركة وثنائي القطب والذهان",
      description:
        "ميرا مساعدة SynQ بالذكاء الاصطناعي: استبيان موجَّه في دقيقتين مبني على أدوات الفحص ASRS وMDQ وPQ-B لفرط الحركة وثنائي القطب والذهان. ليس تشخيصاً.",
    },
    hero: {
      eyebrow: "ميرا · مساعدة التوجيه بالذكاء الاصطناعي",
      titleA: "ميرا: محادثة أولى في دقيقتين",
      titleB: "قبل لقائك بمختصك.",
      body: "مساعدة SynQ بالذكاء الاصطناعي لخطوتك الأولى: استبيان موجَّه في دقيقتين، مكتوب على شكل محادثة، مبني على أدوات فحص يستخدمها المختصون (ASRS وMDQ وPQ-B). تخرج بملخص تناقشه مع مختص. ميرا برنامج وليست شخصاً، ولا تشخّص.",
      primary: "ابدأ مع ميرا",
      secondary: "اكتشف كيف تعمل",
    },
    stats: [
      ["~2", "دقائق"],
      ["3", "حالات مشمولة"],
      ["1", "مرة، في البداية"],
    ],
    role: {
      eyebrow: "ما تفعله ميرا",
      titleA: "ما يحدث",
      titleB: "خلال المحادثة.",
      items: [
        ["أسئلة يومية", "مواقف يومية وأسئلة سريعة، على مهلك.", "أسئلة"],
        ["أدوات فحص معروفة", "أسئلة مقتبسة من ASRS v1.1 (فرط الحركة لدى البالغين) وMDQ (ثنائي القطب) وPQ-B (الذهان)، تُطرح كمحادثة.", "أدوات"],
        ["خطوة تالية مقترحة", "تُلخَّص إجاباتك حسب كل مجال، مع خطوة تالية مقترحة تناقشها مع مختصك.", "الخطوة التالية"],
        ["فحص الأمان", "إن أشارت إجابة إلى أنك قد تكون في خطر، تعرض ميرا أرقام الطوارئ فوراً، وتنبّه مختصك إن كنت قد ربطت حسابك بمختص.", "أمان"],
        ["ملخص لمختصك", "أهم ما في إجاباتك، لتقرأه مع مختصك. لا يُشارَك إلا إن اخترت.", "ملخص"],
        ["خاصة وبلغتين", "العربية أو الإنجليزية. محفوظة في حسابك وخاصة افتراضياً.", "خاص"],
      ],
    },
    flow: {
      eyebrow: "كيف تعمل ميرا",
      titleA: "من التحية إلى",
      titleB: "خطوة تالية واضحة.",
      stepLabel: "الخطوة",
      steps: [
        ["ابدأ بالتحية", "اسمك الأول فقط."],
        ["تحدّث عن أيامك", "أربعة فصول قصيرة، بكلماتك."],
        ["الأمان حاضر دائماً", "إن أشارت إجابة إلى خطر، ترى أرقام الطوارئ فوراً."],
        ["تلقَّ ملخصك", "إجاباتك حسب كل مجال، وخطوة تالية مقترحة."],
      ],
    },
    trust: {
      eyebrow: "حدود واضحة",
      titleA: "توجيه،",
      titleB: "وليس تشخيصاً.",
      doesTitle: "ما تفعله ميرا",
      does: ["أسئلة مبنية على أدوات معروفة", "ملخص بلغة بسيطة", "اقتراح خطوة تالية", "أرقام الطوارئ فور أن تكون في خطر"],
      doesNotTitle: "ما لا تفعله ميرا",
      doesNot: ["لا تشخّص", "لا توصي بعلاج أو دواء", "لا تحلّ محل المختص", "لا تشارك دون موافقتك"],
      note: "في حالات الطوارئ، تواصل فوراً مع خدمات الطوارئ المحلية أو مع مختص مؤهل.",
    },
    handoff: { eyebrow: "بعد ميرا", title: "تعرّف على لومينا.", body: "مساحتك اليومية: فحص ومفكرة ونطاقك المعتاد.", cta: "اكتشف لومينا" },
    cta: {
      eyebrow: "ابدأ حين تكون مستعداً",
      titleA: "دقيقتان،",
      titleB: "ثم حديث مع مختصك.",
      body: "أنشئ حسابك وامنح موافقتك، فيُفتح التوجيه فوراً. واربط حسابك بمختص لاحقاً، متى اخترت.",
      primary: "ابدأ مع ميرا",
      benefits: ["مفتوحة للبالغين، دون إحالة", "خاص افتراضياً", "ملخص لمختصك"],
    },
    preview: {
      caption: "توضيحي — محتوى تجريبي",
      tools: ["ASRS · فرط الحركة", "MDQ · ثنائي القطب", "PQ-B · الذهان"],
      chat: {
        title: "التوجيه",
        chapter: "المساء",
        question: "كم مرة تخرج للمشي خلال الأسبوع؟",
        answer: "عدة مرات — ربما مرتين في الأسبوع.",
        typing: "السؤال التالي…",
      },
      chapters: ["الصباح", "منتصف النهار", "المساء", "الصوت الداخلي"],
      safetyChip: "الأمان · لا مؤشرات عاجلة",
      screens: {
        hello: { greeting: "مرحباً، أنا ميرا.", ask: "بماذا تحب أن أناديك؟", name: DEMO_PATIENT.firstName.ar, cta: "متابعة" },
        days: { chapter: "المساء", question: "كم مرة تخرج للمشي خلال الأسبوع؟", options: ["أبداً", "أحياناً", "كثيراً"] },
        safety: { title: "فحص الأمان", status: "تصغي", ok: "لا مؤشرات عاجلة" },
        result: {
          title: "توجيهك",
          signalsTitle: "الإشارات المرصودة",
          areas: ["المزاج والطاقة", "التركيز والانتباه", "الإدراك والمعتقدات"],
          levels: ["إشارة أوضح", "إشارة متوسطة", "إشارة محدودة"],
          note: "ليس تشخيصاً. يقرؤه معك مختص.",
          review: "مراجعة المختص",
          reviewValue: "موصى بها",
          download: "نزّل التقرير",
        },
      },
    },
  },
  lumina: {
    seo: {
      title: "لومينا: فحص يومي ومفكرة خاصة وملخص شهري",
      description:
        "لومينا تطبيق SynQ اليومي: فحص في 30 ثانية للمزاج والطاقة والتركيز والتوتر والنوم، ومفكرة خاصة، وملخص شهري لا يُشارَك إلا إن اخترت.",
    },
    hero: {
      eyebrow: "لومينا · الفحص اليومي والمفكرة",
      titleA: "لومينا: فحص يومي في 30 ثانية",
      titleB: "ومفكرة خاصة.",
      body: "الجزء الذي تستخدمه كل يوم في SynQ: فحص في 30 ثانية للمزاج والطاقة والتركيز والتوتر والنوم، ومفكرة خاصة. ومع مرور الأيام تُظهر لومينا نطاقك المعتاد فتبرز التغيّرات، وتُعدّ ملخصاً شهرياً تختار أنت مشاركته.",
      primary: "سجّل الدخول إلى لومينا",
      secondary: "اكتشف كيف تعمل",
    },
    stats: [
      ["5", "أسئلة يومياً"],
      ["30", "يوماً في كل ملخص"],
      ["1", "ملخص شهرياً"],
    ],
    role: {
      eyebrow: "ما تحمله لومينا",
      titleA: "ستة أجزاء،",
      titleB: "وروتين يومي واحد.",
      items: [
        ["استقبال بسيط", "تفتح على حالك اليوم، لا على جدار من الأرقام.", "اليوم"],
        ["الفحص اليومي", "المزاج والطاقة والتركيز والتوتر والنوم. ثوانٍ، لا استمارات.", "فحص"],
        ["المفكرة الذكية", "اكتب بالعربية الخليجية أو الإنجليزية أو بهما معاً. يقرأ الذكاء الاصطناعي في لومينا مدخلاتك ليستخرج المواضيع والمشاعر، ولا يصنّفك أبداً. لا يرى مختصك هذه المواضيع إلا إن فعّلت المشاركة. ولا تُحلَّل المدخلات التي تجعلها خاصة.", "مفكرة"],
        ["نطاقك المعتاد", "أنت مقارنةً بنفسك. يتشكّل مع تراكم فحوصاتك، وحتى ذلك الحين تعرض لومينا أيامك ببساطة.", "النطاق المعتاد"],
        ["أهداف مرنة", "منجزة أو جزئية أو فائتة: كل يوم يُحسب ولا حكم على أحد.", "أهداف"],
        ["ملخص شهري بيدك", "اتجاهات الشهر ومواضيع المفكرة والأهداف، مع ما تستطيع البيانات إظهاره وما لا تستطيع. لا يراه مختصك إلا إن فعّلت المشاركة.", "ملخص"],
      ],
    },
    flow: {
      eyebrow: "يوم مع لومينا",
      titleA: "ثوانٍ كل يوم،",
      titleB: "وشهر أوضح.",
      stepLabel: "الخطوة",
      steps: [
        ["سجّل يومك", "خمسة أسئلة سريعة ببضع لمسات. هذا هو الروتين كله."],
        ["اكتب بحرية", "بالعربية الخليجية أو الإنجليزية أو بهما، بكلماتك."],
        ["الصورة تتشكّل", "نطاقك المعتاد واتجاهاتك والأنماط التي تستحق الانتباه."],
        ["شارك بالاختيار", "ملخص شهري لمختصك، حين تفعّله فقط."],
      ],
    },
    trust: {
      eyebrow: "بياناتك، وقرارك",
      titleA: "ما تفعله لومينا،",
      titleB: "وما لا تفعله أبداً.",
      doesTitle: "ما تفعله لومينا",
      does: ["تقارنك بنفسك", "تُظهر ما يستند إليه كل ملخص", "تصف الأنماط لا الأسباب", "لا تشارك إلا بموافقتك"],
      doesNotTitle: "ما لا تفعله لومينا",
      doesNot: ["لا تشخّص ولا تصنّف", "لا تقيّمك مقارنةً بغيرك", "لا تحلّ محل مختصك", "لا تشارك مفكرتك دون موافقتك"],
      note: "لومينا ليست خدمة طوارئ. إن أشار ما تكتبه إلى أنك قد تكون في خطر، تعرض لومينا أرقام الطوارئ، وتنبّه مختصك إن كنت قد ربطت حسابك بمختص. وإن كنت في خطر الآن، تواصل فوراً مع خدمات الطوارئ المحلية.",
    },
    handoff: { eyebrow: "قبل لومينا", title: "ابدأ مع ميرا.", body: "توجيه خاص في نحو دقيقتين، يُجرى مرة واحدة مع حسابك.", cta: "تعرّف على ميرا" },
    cta: {
      eyebrow: "اجعل أيامك محسوبة",
      titleA: "تُفتح لومينا",
      titleB: "بعد محادثتك الأولى.",
      body: "لومينا جزء من حسابك في SynQ. وبعد اكتمال توجيه ميرا، تُفتح مساحتك اليومية.",
      primary: "سجّل الدخول إلى لومينا",
      benefits: ["فحص يومي ومفكرة", "خاص في التصميم", "أنت تقرر ما يُشارَك"],
    },
    tracks: {
      eyebrow: "ثلاث حالات، خيط يومي واحد",
      titleA: "مصمَّمة حول",
      titleB: "طريقة عيشك.",
      intro: "تتكيّف لومينا مع الحالات الثلاث التي تدعمها SynQ. وأياً كانت الحالة، يبقى الإيقاع اليومي نفسه — ويبقى المختص هو المسؤول عن الرعاية.",
      sharedTitle: "النواة اليومية نفسها للجميع",
      sharedLine: "اضطراب فرط الحركة وتشتت الانتباه والاضطراب ثنائي القطب والذهان تتشارك روتيناً بسيطاً واحداً.",
      mood: {
        title: "كيف حالك اليوم؟",
        prompt: "اضغط على الوجه المناسب. لا توجد إجابة خاطئة.",
        levels: ["أقل بكثير", "أقل", "كالمعتاد", "أعلى", "أعلى بكثير"],
        messages: [
          "يوم ثقيل. سجّلناه، ولست وحدك معه.",
          "ليس يوماً سهلاً. تكفي خطوة صغيرة اليوم.",
          "كالمعتاد. وهذا مهم أيضاً.",
          "جميل أن تسمع ذلك. لاحظ ما ساعدك.",
          "يوم مشرق. دوّن ما جعله كذلك.",
        ],
        saved: "تم الحفظ لليوم",
      },
      cards: [
        {
          tag: "فرط الحركة وتشتت الانتباه",
          title: "سبارك، منظّمك اليومي",
          line: "سبارك مساعد الذكاء الاصطناعي داخل لومينا، مصمَّم لاضطراب فرط الحركة وتشتت الانتباه: يساعدك على تنظيم يومك وإدارة مهامك.",
          points: ["خطّط ورتّب أولويات يومك", "حوّل المهام الكبيرة إلى خطوات صغيرة قابلة للتنفيذ", "تذكيرات لطيفة دون أي ضغط", "نصائح تنظيم مبنية على طريقة عمل اضطراب فرط الحركة"],
        },
        {
          tag: "ثنائي القطب · الذهان",
          title: "التثقيف النفسي والإدارة الذاتية",
          line: "مكتبة قراءات قصيرة مأخوذة من مصادر منظمة الصحة العالمية وNIMH وNICE وNHS، لفهم حالتك، وممارسة استراتيجيات التكيّف، والتعرّف على محفّزاتك الخاصة.",
          points: ["تثقيف نفسي بلغة بسيطة", "استراتيجيات تكيّف يمكنك ممارستها", "الوعي بالمحفّزات والإنذارات المبكرة", "قراءات تُختار من فحوصاتك اليومية"],
        },
      ],
      demo: {
        spark: {
          heading: "يومك مع سبارك",
          tasks: ["الردّ على العيادة", "تحضير اجتماع الغد", "مشي لمدة 10 دقائق"],
          steps: ["افتح ملاحظاتك", "اختر ثلاث نقاط", "أرسلها إلى نفسك"],
          reminder: "تذكير · 4:00 مساءً · تحضير اجتماع الغد",
          tip: "نصيحة: ابدأ بأصغر خطوة. خمس دقائق تكفي.",
        },
        library: {
          heading: "المكتبة",
          items: [
            ["فهم محفّزاتك", "قراءة 5 دقائق"],
            ["تمرين تثبيت", "استراتيجية تأقلم"],
            ["النوم والمزاج", "تثقيف نفسي"],
          ],
          breathe: "تنفّس",
        },
      },
    },
    preview: {
      caption: "توضيحي — محتوى تجريبي",
      signals: ["المزاج", "الطاقة", "التركيز", "التوتر", "النوم"],
      today: "اليوم",
      saved: "تم الحفظ",
      greeting: "مساء الخير",
      views: {
        checkin: { title: "فحص اليوم" },
        journal: {
          title: "المفكرة الذكية",
          entry: "نمتُ سيئاً مرة أخرى، لكن مشي الصباح ساعدني. ما زال العمل يبدو ثقيلاً.",
          themes: ["النوم", "العمل", "المشي"],
          note: "مواضيع ومشاعر — وليس تشخيصاً",
        },
        trend: { title: "آخر 30 يوماً", baseline: "نطاقك المعتاد", today: "اليوم", verdict: "ضمن نطاقك المعتاد", consistency: "الانتظام" },
        report: { title: "التقرير الشهري", sections: ["الاتجاهات", "الأدلة", "حدود البيانات"], share: "شارك مع مختصي", consent: "بموافقتك فقط" },
      },
      bento: { goals: "أهداف اليوم", week: "هذا الأسبوع" },
      home: {
        wellbeing: "حالك اليوم",
        wellbeingLine: "نظرة سريعة على حالك",
        levels: ["أقل", "كالمعتاد", "أعلى"],
        signalsTitle: "إشارات حديثة",
        signals: ["نومك تحسّن هذا الأسبوع", "مزاجك مستقر منذ سبعة أيام", "تركيزك أعلى في الصباح"],
        planTitle: "خطة اليوم",
        plan: ["تمرين تنفّس", "ضوء الصباح", "دوّن أفكارك"],
        nextTitle: "ضمن نطاقك المعتاد",
        nextLine: "لا شيء يستدعي تصرفاً اليوم.",
      },
    },
  },
  psy: {
    seo: {
      title: "مساحة عمل المختص لرعاية فرط الحركة وثنائي القطب والذهان",
      description:
        "مساحة عمل على الويب للمختصين المرخّصين في الإمارات وتونس: لا ترى إلا ما اختار كل مريض مشاركته، مع تنبيهات السلامة وأدلتها. ليست تشخيصاً أبداً.",
    },
    hero: {
      eyebrow: "مساحة عمل المختص · رعاية بالموافقة",
      titleA: "انظر ما تغيّر منذ الزيارة الأخيرة،",
      titleB: "فقط ما اختار مريضك مشاركته.",
      body: "مساحة عمل على الويب للمختصين المرخّصين في الإمارات وتونس. يختارك المرضى، ولا ترى إلا ما يشاركه كل منهم، مع تنبيهات السلامة وأدلتها. يراجع فريق SynQ كل طلب انضمام، ويبقى القرار لك دائماً.",
      primary: "سجّل الدخول إلى مساحة العمل",
      secondary: "اكتشف كيف تعمل",
    },
    stats: [
      ["3", "مسارات رعاية"],
      ["30", "يوماً في كل ملخص"],
      ["1", "ملخص لكل مريض شهرياً"],
    ],
    role: {
      eyebrow: "ما تحمله مساحة العمل",
      titleA: "ما تراه",
      titleB: "لكل مريض.",
      items: [
        ["طلبات المرضى", "يختار المريض مختصه، وتختار أنت حالاتك. لا يُشارَك شيء قبل أن تقبل.", "الطلبات"],
        ["تنبيهات سريرية", "إشارة خارج النطاق المعتاد لمريض ما تصلك مع الأدلة التي وراءها.", "التنبيهات"],
        ["ملفات المرضى", "النطاق المعتاد والاتجاهات وما وجده توجيه ميرا، في سجل واحد.", "المرضى"],
        ["الجلسات والتغطية", "جدولة وتحضير ومتابعة، مع رؤية من يغطي مكانك عند غيابك.", "الجلسات"],
        ["تقارير شهرية", "اقرأ ما شاركه المريض ثم راجعه وعلّق عليه.", "التقارير"],
        ["ملاحظات منظّمة", "ملاحظاتك السريرية بجانب مواضيع المفكرة التي اختار المريض مشاركتها.", "الملاحظات"],
      ],
    },
    flow: {
      eyebrow: "يوم في مساحة العمل",
      titleA: "من طلب جديد إلى",
      titleB: "ملاحظة في السجل.",
      stepLabel: "الخطوة",
      steps: [
        ["اقبل طلباً", "مريض يطلب مشاركة بياناته معك. أنت تقرر من ينضم إلى حالاتك."],
        ["انظر ما تغيّر", "التنبيهات وجلسات اليوم أولاً، كي لا ينتظر شيء دون أن يُرى."],
        ["اقرأ الصورة", "النطاق المعتاد والاتجاهات والإشارات لمريض واحد، مقارنةً بنطاقه هو."],
        ["راجع وعلّق", "تقرير شهري تقرؤه وتعلّق عليه. يبقى القرار لك."],
      ],
    },
    trust: {
      eyebrow: "حدود واضحة",
      titleA: "دعم للحكم السريري،",
      titleB: "لا بديل عنه.",
      doesTitle: "ما تفعله مساحة العمل",
      does: ["تعرض ما يشاركه المرضى فقط", "ترفع الإشارات مع أدلتها", "تقارن كل مريض بنطاقه المعتاد", "تحفظ ملاحظاتك وتعليقاتك"],
      doesNotTitle: "ما لا تفعله مساحة العمل",
      doesNot: ["لا تشخّص", "لا تصف دواءً ولا توصي بعلاج", "لا تحلّ محل حكم المختص", "لا تشارك بيانات دون موافقة"],
      note: "مساحة العمل واجهة دعم سريري وليست خدمة طوارئ. في حال الخطر الفوري، تواصل مع خدمات الطوارئ المحلية.",
    },
    handoff: { eyebrow: "ما يستخدمه مرضاك", title: "تعرّف على لومينا.", body: "الفحص اليومي والمفكرة اللذان يحتفظ بهما مرضاك، ولا يشاركونهما معك إلا بالاختيار.", cta: "تعرّف على لومينا" },
    cta: {
      eyebrow: "للمختصين المرخّصين",
      titleA: "قدّم طلبك",
      titleB: "كمختص.",
      body: "للمختصين المرخّصين في الإمارات وتونس. أرسل طلبك: يراجعه فريق SynQ ويرد عليك بالبريد الإلكتروني.",
      primary: "سجّل الدخول إلى مساحة العمل",
      benefits: ["مشاركة بموافقة المريض", "تنبيهات مع الأدلة", "تقارير شهرية"],
    },
    preview: {
      caption: "شاشات توضيحية من تطبيق المختص بمحتوى تجريبي. لا مرضى حقيقيين.",
      shared: "شاركه المريض",
      greeting: "اليوم",
      summary: "تنبيه واحد عالي الأولوية و3 جلسات",
      clinician: [DEMO_CLINICIAN.fullName.ar, DEMO_CLINICIAN.role.ar],
      search: "ابحث عن مريض أو جلسة…",
      nav: [
        ["مساحة العمل", ["نظرة عامة", "الطلبات", "التنبيهات", "المرضى", "الجلسات"]],
        ["السجلات السريرية", ["التقييمات", "التقارير الشهرية", "الملاحظات"]],
        ["العيادة", ["التغطية", "الإشعارات"]],
      ],
      settings: "الإعدادات",
      triage: ["3 تنبيهات بانتظار الفرز", "افتح قائمة الفرز"],
      actions: ["الفرز", "جدولة"],
      period: "30 يوماً",
      kpis: [
        ["تنبيهات مفتوحة", "3", "2 جديدان مقابل 30 يوماً سابقة"],
        ["مرضى نشطون", "12", "9 متفاعلين مقابل 30 يوماً سابقة"],
        ["جلسات مكتملة", "38", "مقابل 30 يوماً سابقة"],
        ["مراجعات معلّقة", "4", "تقييمان · تقريران شهريان"],
      ],
      activity: { title: "النشاط السريري", description: "آخر 30 يوماً", tabs: ["الجلسات", "التنبيهات", "نشاط المرضى"], legend: ["مكتملة", "مجدولة", "ملغاة"] },
      risk: { title: "الحالات حسب الوضع", description: "12 مريضاً في رعايتك", labels: ["أولوية", "متابعة", "مستقر"], worsened: "مريض واحد ساءت حالته منذ الأسبوع الماضي" },
      attention: {
        title: "يحتاج انتباهك",
        description: "تنبيهات وتقارير ذات أولوية ومراجعات معلّقة",
        items: [
          [DEMO_OBSERVATIONS.sleep.ar, `${DEMO_PATIENT.shortName.ar} · قبل ساعتين`, "عالٍ"],
          [DEMO_OBSERVATIONS.checkinsPaused.ar, "عمر ر. · قبل 5 ساعات", "متوسط"],
          ["تقرير شهري ذو أولوية", "لينا ب. · قبل يوم", "أولوية"],
          ["تقييم بانتظار المراجعة", "توجيه ميرا · قبل يوم", "مراجعة"],
        ],
      },
      agenda: {
        title: "جدول الجلسات",
        description: "الجلسات القادمة",
        today: "اليوم",
        items: [
          ["09:30", DEMO_PATIENT.shortName.ar, "متابعة · 45 دقيقة"],
          ["11:00", "آدم ت.", "أولى · 60 دقيقة"],
          ["14:15", "عمر ر.", "متابعة · 30 دقيقة"],
        ],
      },
      patients: {
        title: "المرضى ذوو الأولوية",
        description: "مرتّبون حسب الحالة والتنبيهات المفتوحة",
        all: "الكل",
        columns: ["المريض", "الحالة", "ملاحظة مشارَكة", "تنبيهات مفتوحة", "آخر نشاط"],
        rows: [
          [DEMO_PATIENT.shortName.ar, DEMO_PATIENT.code, "قبل ساعتين", DEMO_OBSERVATIONS.sleep.ar],
          ["عمر ر.", "OR-007", "قبل 5 ساعات", DEMO_OBSERVATIONS.checkinsPaused.ar],
          ["لينا ب.", "LB-021", "قبل يوم", DEMO_OBSERVATIONS.moodLower.ar],
          ["يارا م.", "YM-011", "قبل يومين", DEMO_OBSERVATIONS.steady.ar],
        ],
      },
      requests: {
        title: "الطلبات",
        description: "مرضى اقتُرحوا عليك",
        waiting: "طلبان من مرضى بانتظار ردّك",
        note: "اقبل أو ارفض لبدء الرعاية. لا يُشارَك شيء قبل ذلك.",
        items: [
          ["آدم ت.", "AT-003", "محال بعد فحص أولي", "ينتظر منذ يوم"],
          ["نور س.", "NS-030", "أكمل توجيه ميرا", "ينتظر منذ 3 ساعات"],
        ],
        primary: "مقترح كمختص أساسي",
        accept: "قبول",
        decline: "رفض",
        accepted: "أُضيف إلى مرضاك",
      },
      patient: {
        back: "المرضى",
        name: DEMO_PATIENT.shortName.ar,
        code: DEMO_PATIENT.code,
        chips: ["المختص الأساسي"],
        statusTitle: "الحالة السريرية",
        facts: [
          ["الحالة", "أولوية"],
          ["مُشارَك معك", "المزاج، النوم"],
          ["المتابعة", "8 أسابيع"],
          ["اللغة", "EN"],
        ],
        tabs: ["نظرة عامة", "الخط الحياتي", "التقييمات", "الملاحظات"],
        chartTitle: "المزاج مقابل النطاق المعتاد",
        baseline: "النطاق المعتاد",
        verdict: "ضمن النطاق هذا الشهر، مع هبوط واحد في الأسبوع الثالث",
        signals: ["النوم", "التركيز", "الطاقة"],
        alertsTitle: "تنبيهات مفتوحة",
        alert: DEMO_OBSERVATIONS.sleep.ar,
        notShared: "لم يُشارَك من قبل المريض: مدخلات المفكرة. لا تظهر مواضيع المفكرة إلا إن فعّل المريض المشاركة. تنبيهات السلامة تصلك دائماً.",
      },
      report: {
        title: "التقارير الشهرية",
        description: "اقرأ وعلّق وأقرّ",
        patient: DEMO_PATIENT.shortName.ar,
        headline: "ملخص شهري",
        period: "هذا الشهر",
        sections: ["الاتجاه", "مواضيع المفكرة", "الأهداف"],
        annotate: "تعليقك",
        annotation: "مناقشة روتين النوم في الجلسة القادمة.",
        acknowledge: "إقرار",
        acknowledged: "تم الإقرار",
      },
    },
    requestAccess: "قدّم طلب انضمام",
  },
};

export const agentPagesCopy: Record<Lang, AgentPagesCopy> = { en, ar };
