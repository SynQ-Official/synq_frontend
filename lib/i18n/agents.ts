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
    result: { title: string; areas: readonly string[]; review: string; reviewValue: string; download: string };
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
  /** The first screen of the app, as the window on /lumina and the hero draw it. */
  home: { wellbeing: string; wellbeingLine: string; signalsTitle: string; signals: readonly string[]; planTitle: string; plan: readonly string[]; nextTitle: string; nextLine: string };
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
  patients: { title: string; description: string; columns: readonly string[]; rows: readonly (readonly [name: string, code: string, last: string])[] };
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
  psy: AgentPageCopy & { preview: PsyPreviewCopy };
};

const en: AgentPagesCopy = {
  mira: {
    seo: {
      title: "Mira — guided orientation and structured screening",
      description:
        "Meet Mira, SynQ's orientation agent: a private, guided conversation built on established screening tools for ADHD, bipolar disorder and psychotic symptoms, and a clear summary to bring to a clinician. Included with your SynQ account.",
    },
    hero: {
      eyebrow: "Mira · Orientation agent",
      titleA: "A first conversation",
      titleB: "that notices what matters.",
      body: "A calm, guided conversation — then a clear summary to bring to a professional. An orientation that supports clinical assessment; it is not a diagnosis.",
      primary: "Start with Mira",
      secondary: "See how it works",
    },
    stats: [
      ["~2", "minutes"],
      ["3", "screening areas"],
      ["1", "per account"],
    ],
    role: {
      eyebrow: "What Mira does",
      titleA: "Careful,",
      titleB: "and human-first.",
      items: [
        ["Gentle intake", "Five everyday situations, about two minutes.", "Intake"],
        ["Established screening tools", "ASRS · MDQ · PQ-B, asked in a natural conversation.", "Screening"],
        ["Structured triage", "Signals become a match level and a next step.", "Triage"],
        ["Risk detection", "A safety check runs the whole time.", "Safety"],
        ["A report to bring", "Key signals, ready for a professional.", "Report"],
        ["Private, bilingual", "English or Arabic. Included with your account.", "Private"],
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
        ["Safety stays on", "Anything urgent reaches a human."],
        ["Get your orientation", "Signals, strength, next step."],
      ],
    },
    trust: {
      eyebrow: "Clear boundaries",
      titleA: "Orientation,",
      titleB: "not a diagnosis.",
      doesTitle: "Mira does",
      does: ["Questions based on established tools", "Plain-language signals", "A next-step suggestion", "Alerts a clinician when you may be at risk"],
      doesNotTitle: "Mira never",
      doesNot: ["Diagnose", "Recommend treatment or medication", "Replace a clinician", "Share without your consent"],
      note: "In an emergency, contact local emergency services or a qualified clinician immediately.",
    },
    handoff: { eyebrow: "After Mira", title: "Meet Lumina.", body: "Your daily space: check-in, journal, baseline.", cta: "Discover Lumina" },
    cta: {
      eyebrow: "Begin when you are ready",
      titleA: "Two minutes.",
      titleB: "One clear picture.",
      body: "Create your account and give your consent: the orientation opens right away.",
      primary: "Start with Mira",
      benefits: ["Included with your account", "Private by design", "A summary to take away"],
    },
    preview: {
      caption: "Illustration — example content",
      tools: ["ASRS · ADHD", "MDQ · Bipolar", "PQ-B · Psychosis"],
      chat: {
        title: "Orientation",
        chapter: "Evening",
        question: "Do you ever need far less sleep, yet still feel full of energy?",
        answer: "A few times — maybe twice a week.",
        typing: "Mira is reflecting…",
      },
      chapters: ["Morning", "Midday", "Evening", "Inner voice"],
      safetyChip: "Safety · no urgent flags",
      screens: {
        hello: { greeting: "Hello, I'm Mira.", ask: "What should I call you?", name: "Sara", cta: "Continue" },
        days: { chapter: "Evening", question: "Do you ever need far less sleep, yet feel full of energy?", options: ["Never", "Sometimes", "Often"] },
        safety: { title: "Safety check", status: "Listening", ok: "No urgent flags" },
        result: {
          title: "Your orientation",
          areas: ["Bipolar spectrum", "ADHD", "Psychosis spectrum"],
          review: "Clinician review",
          reviewValue: "Recommended",
          download: "Download report",
        },
      },
    },
  },
  lumina: {
    seo: {
      title: "Lumina — daily check-ins, journal and reports",
      description:
        "Meet Lumina, SynQ's daily companion: a quick check-in, a private bilingual journal, simple goals, your own baseline and a monthly clinician report you share only with your consent.",
    },
    hero: {
      eyebrow: "Lumina · Your daily space",
      titleA: "Your days,",
      titleB: "kept and understood.",
      body: "Check in for a few seconds, write freely, and watch your own baseline take shape. A clinician sees a report only when you decide to share it.",
      primary: "Enter Lumina",
      secondary: "See how it works",
    },
    stats: [
      ["5", "signals a day"],
      ["30", "days, one picture"],
      ["1", "monthly report"],
    ],
    role: {
      eyebrow: "What Lumina holds",
      titleA: "Everything your day needs,",
      titleB: "nothing it doesn't.",
      items: [
        ["A calm welcome", "Opens on how you are today, not on a wall of numbers.", "Today"],
        ["Daily check-in", "Mood, energy, focus, stress and sleep. Seconds, not forms.", "Check-in"],
        ["Smart journal", "Write in English, Gulf Arabic or both. Lumina lifts out themes and emotions; it never labels you.", "Journal"],
        ["Your own baseline", "You, compared with you. A line inside your usual range is a steady month.", "Baseline"],
        ["Goals that bend", "Done, partly done or missed: every day counts and none of them judges you.", "Goals"],
        ["A report you control", "A monthly summary for your clinician, shared only if you switch it on.", "Report"],
      ],
    },
    flow: {
      eyebrow: "A day with Lumina",
      titleA: "A few seconds a day,",
      titleB: "a clearer month.",
      stepLabel: "Step",
      steps: [
        ["Check in", "Five signals, a few taps. That is the whole routine."],
        ["Write freely", "English, Gulf Arabic or both, in your own words."],
        ["Watch it take shape", "Your baseline, your trends and the patterns worth noticing."],
        ["Share by choice", "A monthly report for your clinician, only when you switch it on."],
      ],
    },
    trust: {
      eyebrow: "Your data, your call",
      titleA: "Private by design,",
      titleB: "shared by choice.",
      doesTitle: "Lumina does",
      does: ["Compares you with you", "Shows evidence and limits", "Describes patterns, not causes", "Reports only with consent"],
      doesNotTitle: "Lumina never",
      doesNot: ["Diagnose or label", "Score you against others", "Replace your clinician", "Share your journal"],
      note: "Lumina is not an emergency service. If you are in danger, contact local emergency services right away.",
    },
    handoff: { eyebrow: "Before Lumina", title: "Start with Mira.", body: "A private orientation in about two minutes, done once with your account.", cta: "Meet Mira" },
    cta: {
      eyebrow: "Make the days count",
      titleA: "Your next month,",
      titleB: "already clearer.",
      body: "Your daily space opens once Mira's orientation is done.",
      primary: "Enter Lumina",
      benefits: ["Daily check-in and journal", "Private by design", "You decide what is shared"],
    },
    tracks: {
      eyebrow: "Three conditions, one daily thread",
      titleA: "Built around",
      titleB: "how you live.",
      intro: "Lumina adapts to the three conditions SynQ supports. Whatever the condition, the daily rhythm is the same — and a clinician stays in charge of care.",
      sharedTitle: "The same daily core, for everyone",
      sharedLine: "ADHD, bipolar disorder and schizophrenia share one simple routine.",
      mood: {
        title: "How are you today?",
        prompt: "Tap the face that fits. There is no wrong answer.",
        levels: ["Low", "Down", "Okay", "Good", "Great"],
        messages: [
          "A heavy day. Noted, and you are not alone with it.",
          "Not an easy one. A small step is enough today.",
          "Steady. A calm day counts too.",
          "Good to hear. Notice what helped.",
          "A bright one. Keep a note of what made it so.",
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
          tag: "Bipolar disorder · Schizophrenia",
          title: "Psychoeducation and self-management",
          line: "A library of approved resources to understand your condition, practise coping strategies and recognise your own triggers.",
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
        trend: { title: "Last 30 days", baseline: "Your baseline", today: "Today", verdict: "Within your usual range", consistency: "Consistency" },
        report: { title: "Monthly report", sections: ["Trends", "Evidence", "Data limits"], share: "Share with my clinician", consent: "Only with your consent" },
      },
      bento: { goals: "goals today", week: "This week" },
      home: {
        wellbeing: "Today's wellbeing",
        wellbeingLine: "How you are, at a glance",
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
      title: "Clinician Workspace — care between sessions",
      description:
        "Meet the Clinician Workspace, where a licensed clinician follows the patients who choose to share: requests, alerts, sessions, notes and monthly reports. It supports clinical judgment and never replaces it.",
    },
    hero: {
      eyebrow: "Clinician Workspace · Consent-based care",
      titleA: "Your patients, between",
      titleB: "sessions, in view.",
      body: "A calm workspace for licensed clinicians: requests, alerts, sessions and monthly reports from patients who chose to share. It supports your judgment; it never replaces it.",
      primary: "Open the workspace",
      secondary: "See how it works",
    },
    stats: [
      ["3", "conditions followed"],
      ["30", "days, one picture"],
      ["1", "monthly report each"],
    ],
    role: {
      eyebrow: "What the workspace holds",
      titleA: "Everything a follow-up needs,",
      titleB: "nothing it doesn't.",
      items: [
        ["Patient requests", "Accept who you can follow. Patients choose their clinician; you choose your caseload.", "Requests"],
        ["Clinical alerts", "A signal outside someone's usual range reaches you, with the evidence behind it.", "Alerts"],
        ["Patient profiles", "Baseline, trends and what Mira's orientation found, in one record.", "Patients"],
        ["Sessions and coverage", "Schedule, prepare and follow up, and see who covers when you are away.", "Sessions"],
        ["Monthly reports", "Read what the patient shared, then review and annotate it.", "Reports"],
        ["Structured notes", "Your clinical notes, kept beside the journal themes the patient chose to share.", "Notes"],
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
        ["Read the picture", "Baseline, trends and signals for one patient, against their own range."],
        ["Review and annotate", "A monthly report, read and annotated. The decision stays yours."],
      ],
    },
    trust: {
      eyebrow: "Clear boundaries",
      titleA: "Support for judgment,",
      titleB: "never a substitute.",
      doesTitle: "The workspace does",
      does: ["Shows only what patients share", "Raises signals with their evidence", "Compares each patient with their own baseline", "Keeps your notes and annotations"],
      doesNotTitle: "The workspace never",
      doesNot: ["Diagnose", "Prescribe or advise treatment", "Replace a clinician's judgment", "Share data without consent"],
      note: "The workspace is a clinical support interface, not an emergency service. In immediate danger, contact local emergency services.",
    },
    handoff: { eyebrow: "What your patients use", title: "Meet Lumina.", body: "The daily check-in and journal your patients keep, and share with you only by choice.", cta: "Meet Lumina" },
    cta: {
      eyebrow: "For licensed clinicians",
      titleA: "Follow care,",
      titleB: "with what matters.",
      body: "Sign in to your workspace, or ask for access.",
      primary: "Open the workspace",
      benefits: ["Consent-based sharing", "Alerts with evidence", "Monthly reports"],
    },
    preview: {
      caption: "Illustrative screens of the clinician app, with example content. No real patients.",
      shared: "Shared by the patient",
      greeting: "Good morning, Layla",
      summary: "1 high-priority alert and 3 sessions today.",
      clinician: ["Dr. Layla Haddad", "Psychologist"],
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
      risk: { title: "Caseload risk", description: "12 monitored patients", labels: ["Priority", "Watch", "Stable"], worsened: "1 patient worsened since last week" },
      attention: {
        title: "Needs your attention",
        description: "Alerts, priority reports and pending reviews",
        items: [
          ["Sleep well below usual range for 5 days", "Sara K. · 2 hours ago", "High"],
          ["Check-ins paused for a week", "Omar R. · 5 hours ago", "Moderate"],
          ["Priority monthly report", "Lina B. · 1 day ago", "Priority"],
          ["Assessment awaiting review", "Mira orientation · 1 day ago", "Review"],
        ],
      },
      agenda: {
        title: "Agenda",
        description: "Upcoming sessions",
        today: "Today",
        items: [
          ["09:30", "Sara K.", "follow-up · 45 min"],
          ["11:00", "Adam T.", "intake · 60 min"],
          ["14:15", "Omar R.", "follow-up · 30 min"],
        ],
      },
      patients: {
        title: "Priority patients",
        description: "Ranked by status, open alerts and drift",
        columns: ["Patient", "Status", "Drift", "Open alerts", "Last activity"],
        rows: [
          ["Sara K.", "SK-014", "2 hours ago"],
          ["Omar R.", "OR-007", "5 hours ago"],
          ["Lina B.", "LB-021", "1 day ago"],
          ["Yara M.", "YM-011", "2 days ago"],
        ],
      },
      requests: {
        title: "Requests",
        description: "Patients proposed to you",
        waiting: "2 patient requests waiting for your answer",
        note: "Accept or decline to start care. Nothing is shared until you do.",
        items: [
          ["Adam T.", "AT-003", "Referred after a first screening", "Waiting 1 day"],
          ["Nour S.", "NS-030", "Mira orientation · ADHD signals", "Waiting 3 hours"],
        ],
        primary: "Proposed as primary",
        accept: "Accept",
        decline: "Decline",
        accepted: "Added to your patients",
      },
      patient: {
        back: "Patients",
        name: "Sara K.",
        code: "SK-014",
        chips: ["ADHD", "Primary clinician"],
        statusTitle: "Clinical status",
        facts: [
          ["Status", "Priority"],
          ["Drift", "0.62"],
          ["Following", "8 weeks"],
          ["Language", "EN"],
        ],
        tabs: ["Overview", "Life chart", "Assessments", "Notes"],
        chartTitle: "Mood against the usual range",
        baseline: "Usual range",
        verdict: "Within range this month, one dip in week 3",
        signals: ["Sleep", "Focus", "Energy"],
        alertsTitle: "Open alerts",
        alert: "Sleep below usual range for 5 days",
        notShared: "Not shared by the patient: journal entries. Safety alerts still reach you.",
      },
      report: {
        title: "Monthly reports",
        description: "Read, annotate and acknowledge",
        patient: "Lina B.",
        headline: "Priority monthly report",
        period: "This month",
        sections: ["Trend", "Journal themes", "Goals"],
        annotate: "Your annotation",
        annotation: "Discuss the sleep routine at the next session.",
        acknowledge: "Acknowledge",
        acknowledged: "Acknowledged",
      },
    },
  },
};

const ar: AgentPagesCopy = {
  mira: {
    seo: {
      title: "ميرا — توجيه موجَّه وفحص منظَّم",
      description:
        "تعرّف على ميرا، وكيلة التوجيه في SynQ: محادثة خاصة وموجَّهة مبنية على أدوات فحص معروفة حول اضطراب فرط الحركة وتشتت الانتباه والاضطراب ثنائي القطب وأعراض الذهان، وملخص واضح تحمله إلى مختص. ضمن حسابك في SynQ.",
    },
    hero: {
      eyebrow: "ميرا · وكيلة التوجيه",
      titleA: "محادثة أولى",
      titleB: "تلاحظ ما يهم.",
      body: "محادثة هادئة وموجَّهة، ثم ملخص واضح تحمله إلى مختص. توجيه يدعم التقييم السريري، وليس تشخيصاً.",
      primary: "ابدأ مع ميرا",
      secondary: "اكتشف كيف تعمل",
    },
    stats: [
      ["~2", "دقائق"],
      ["3", "مجالات فحص"],
      ["1", "لكل حساب"],
    ],
    role: {
      eyebrow: "ما تفعله ميرا",
      titleA: "حذرة،",
      titleB: "والإنسان أولاً.",
      items: [
        ["استقبال هادئ", "خمسة مواقف يومية في نحو دقيقتين.", "استقبال"],
        ["أدوات فحص معروفة", "ASRS · MDQ · PQ-B، تُطرح ضمن محادثة طبيعية.", "فحص"],
        ["فرز منظَّم", "تتحول الإشارات إلى مستوى تطابق وخطوة تالية.", "فرز"],
        ["رصد المخاطر", "فحص أمان يعمل طوال الوقت.", "أمان"],
        ["تقرير تحمله معك", "الإشارات الرئيسية جاهزة لمختص.", "تقرير"],
        ["خاصة وبلغتين", "العربية أو الإنجليزية. ضمن حسابك.", "خاص"],
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
        ["الأمان حاضر دائماً", "أي أمر عاجل يصل إلى إنسان."],
        ["تلقَّ توجيهك", "الإشارات والقوة والخطوة التالية."],
      ],
    },
    trust: {
      eyebrow: "حدود واضحة",
      titleA: "توجيه،",
      titleB: "وليس تشخيصاً.",
      doesTitle: "ما تفعله ميرا",
      does: ["أسئلة مبنية على أدوات معروفة", "إشارات بلغة بسيطة", "اقتراح خطوة تالية", "تنبّه مختصاً حين قد تكون في خطر"],
      doesNotTitle: "ما لا تفعله ميرا",
      doesNot: ["لا تشخّص", "لا توصي بعلاج أو دواء", "لا تحلّ محل المختص", "لا تشارك دون موافقتك"],
      note: "في حالات الطوارئ، تواصل فوراً مع خدمات الطوارئ المحلية أو مع مختص مؤهل.",
    },
    handoff: { eyebrow: "بعد ميرا", title: "تعرّف على لومينا.", body: "مساحتك اليومية: فحص ومفكرة وخط مرجعي.", cta: "اكتشف لومينا" },
    cta: {
      eyebrow: "ابدأ حين تكون مستعداً",
      titleA: "دقيقتان.",
      titleB: "صورة واحدة واضحة.",
      body: "أنشئ حسابك وامنح موافقتك: يُفتح التوجيه فوراً.",
      primary: "ابدأ مع ميرا",
      benefits: ["ضمن حسابك", "خاص في التصميم", "ملخص تحمله معك"],
    },
    preview: {
      caption: "توضيحي — محتوى تجريبي",
      tools: ["ASRS · فرط الحركة", "MDQ · ثنائي القطب", "PQ-B · الذهان"],
      chat: {
        title: "التوجيه",
        chapter: "المساء",
        question: "هل تحتاج أحياناً إلى نوم أقل بكثير ومع ذلك تشعر بطاقة كاملة؟",
        answer: "عدة مرات — ربما مرتين في الأسبوع.",
        typing: "ميرا تتأمل…",
      },
      chapters: ["الصباح", "منتصف النهار", "المساء", "الصوت الداخلي"],
      safetyChip: "الأمان · لا مؤشرات عاجلة",
      screens: {
        hello: { greeting: "مرحباً، أنا ميرا.", ask: "بماذا تحب أن أناديك؟", name: "سارة", cta: "متابعة" },
        days: { chapter: "المساء", question: "هل تحتاج أحياناً إلى نوم أقل بكثير ومع ذلك تشعر بطاقة كاملة؟", options: ["أبداً", "أحياناً", "كثيراً"] },
        safety: { title: "فحص الأمان", status: "تصغي", ok: "لا مؤشرات عاجلة" },
        result: {
          title: "توجيهك",
          areas: ["طيف ثنائي القطب", "فرط الحركة", "طيف الذهان"],
          review: "مراجعة المختص",
          reviewValue: "موصى بها",
          download: "نزّل التقرير",
        },
      },
    },
  },
  lumina: {
    seo: {
      title: "لومينا — الفحص اليومي والمفكرة والتقارير",
      description:
        "تعرّف على لومينا، رفيقة SynQ اليومية: فحص سريع، ومفكرة خاصة بلغتين، وأهداف بسيطة، وخطّك المرجعي، وتقرير شهري للمختص لا يُشارَك إلا بموافقتك.",
    },
    hero: {
      eyebrow: "لومينا · مساحتك اليومية",
      titleA: "أيامك،",
      titleB: "محفوظة ومفهومة.",
      body: "سجّل يومك في ثوانٍ، واكتب بحرية، وشاهد خطّك المرجعي يتشكّل. لا يرى المختص تقريراً إلا حين تقرر أنت مشاركته.",
      primary: "ادخل إلى لومينا",
      secondary: "اكتشف كيف تعمل",
    },
    stats: [
      ["5", "إشارات يومياً"],
      ["30", "يوماً، صورة واحدة"],
      ["1", "تقرير شهري"],
    ],
    role: {
      eyebrow: "ما تحمله لومينا",
      titleA: "كل ما يحتاجه يومك،",
      titleB: "ولا شيء زائد.",
      items: [
        ["استقبال هادئ", "تفتح على حالك اليوم، لا على جدار من الأرقام.", "اليوم"],
        ["الفحص اليومي", "المزاج والطاقة والتركيز والتوتر والنوم. ثوانٍ، لا استمارات.", "فحص"],
        ["المفكرة الذكية", "اكتب بالعربية الخليجية أو الإنجليزية أو بهما معاً. تستخرج لومينا المواضيع والمشاعر ولا تصنّفك أبداً.", "مفكرة"],
        ["خطّك المرجعي", "أنت مقارنةً بنفسك. خط داخل نطاقك المعتاد يعني شهراً مستقراً.", "خط مرجعي"],
        ["أهداف مرنة", "منجزة أو جزئية أو فائتة: كل يوم يُحسب ولا حكم على أحد.", "أهداف"],
        ["تقرير بيدك", "ملخص شهري لمختصك، لا يُشارَك إلا إن فعّلته أنت.", "تقرير"],
      ],
    },
    flow: {
      eyebrow: "يوم مع لومينا",
      titleA: "ثوانٍ كل يوم،",
      titleB: "وشهر أوضح.",
      stepLabel: "الخطوة",
      steps: [
        ["سجّل يومك", "خمس إشارات ببضع لمسات. هذا هو الروتين كله."],
        ["اكتب بحرية", "بالعربية الخليجية أو الإنجليزية أو بهما، بكلماتك."],
        ["شاهد الصورة تتشكّل", "خطّك المرجعي واتجاهاتك والأنماط التي تستحق الانتباه."],
        ["شارك بالاختيار", "تقرير شهري لمختصك، حين تفعّله فقط."],
      ],
    },
    trust: {
      eyebrow: "بياناتك، وقرارك",
      titleA: "خاصة في التصميم،",
      titleB: "ومُشارَكة بالاختيار.",
      doesTitle: "ما تفعله لومينا",
      does: ["تقارنك بنفسك", "تُظهر الأدلة وحدودها", "تصف الأنماط لا الأسباب", "تقارير بموافقتك فقط"],
      doesNotTitle: "ما لا تفعله لومينا",
      doesNot: ["لا تشخّص ولا تصنّف", "لا تقيّمك مقارنةً بغيرك", "لا تحلّ محل مختصك", "لا تشارك مفكرتك"],
      note: "لومينا ليست خدمة طوارئ. إن كنت في خطر، تواصل فوراً مع خدمات الطوارئ المحلية.",
    },
    handoff: { eyebrow: "قبل لومينا", title: "ابدأ مع ميرا.", body: "توجيه خاص في نحو دقيقتين، يُجرى مرة واحدة مع حسابك.", cta: "تعرّف على ميرا" },
    cta: {
      eyebrow: "اجعل أيامك محسوبة",
      titleA: "شهرك القادم،",
      titleB: "أوضح من الآن.",
      body: "تُفتح مساحتك اليومية فور اكتمال توجيه ميرا.",
      primary: "ادخل إلى لومينا",
      benefits: ["فحص يومي ومفكرة", "خاص في التصميم", "أنت تقرر ما يُشارَك"],
    },
    tracks: {
      eyebrow: "ثلاث حالات، خيط يومي واحد",
      titleA: "مصمَّمة حول",
      titleB: "طريقة عيشك.",
      intro: "تتكيّف لومينا مع الحالات الثلاث التي تدعمها SynQ. وأياً كانت الحالة، يبقى الإيقاع اليومي نفسه — ويبقى المختص هو المسؤول عن الرعاية.",
      sharedTitle: "النواة اليومية نفسها للجميع",
      sharedLine: "اضطراب فرط الحركة وتشتت الانتباه والاضطراب ثنائي القطب والفصام يتشاركون روتيناً بسيطاً واحداً.",
      mood: {
        title: "كيف حالك اليوم؟",
        prompt: "اضغط على الوجه المناسب. لا توجد إجابة خاطئة.",
        levels: ["منخفض", "متعب", "عادي", "جيد", "رائع"],
        messages: [
          "يوم ثقيل. سجّلناه، ولست وحدك معه.",
          "ليس يوماً سهلاً. تكفي خطوة صغيرة اليوم.",
          "مستقر. اليوم الهادئ مهم أيضاً.",
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
          tag: "ثنائي القطب · الفصام",
          title: "التثقيف النفسي والإدارة الذاتية",
          line: "مكتبة موارد معتمدة لفهم حالتك، وممارسة استراتيجيات التكيّف، والتعرّف على محفّزاتك الخاصة.",
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
        trend: { title: "آخر 30 يوماً", baseline: "خطّك المرجعي", today: "اليوم", verdict: "ضمن نطاقك المعتاد", consistency: "الانتظام" },
        report: { title: "التقرير الشهري", sections: ["الاتجاهات", "الأدلة", "حدود البيانات"], share: "شارك مع مختصي", consent: "بموافقتك فقط" },
      },
      bento: { goals: "أهداف اليوم", week: "هذا الأسبوع" },
      home: {
        wellbeing: "حالك اليوم",
        wellbeingLine: "نظرة سريعة على حالك",
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
      title: "مساحة عمل المختص — رعاية بين الجلسات",
      description:
        "تعرّف على مساحة عمل المختص، حيث يتابع فيها المختص المرخّص مرضاه الذين يختارون المشاركة: الطلبات والتنبيهات والجلسات والملاحظات والتقارير الشهرية. تدعم الحكم السريري ولا تحلّ محله.",
    },
    hero: {
      eyebrow: "مساحة عمل المختص · رعاية بالموافقة",
      titleA: "مرضاك بين الجلسات،",
      titleB: "أمام ناظريك.",
      body: "مساحة هادئة للمختصين المرخّصين: طلبات وتنبيهات وجلسات وتقارير شهرية من مرضى اختاروا المشاركة. تدعم حكمك ولا تحلّ محله.",
      primary: "افتح مساحة العمل",
      secondary: "اكتشف كيف تعمل",
    },
    stats: [
      ["3", "اضطرابات تتم متابعتها"],
      ["30", "يوماً، صورة واحدة"],
      ["1", "تقرير شهري لكل مريض"],
    ],
    role: {
      eyebrow: "ما تحمله مساحة العمل",
      titleA: "كل ما تحتاجه المتابعة،",
      titleB: "ولا شيء زائد.",
      items: [
        ["طلبات المرضى", "اقبل من تستطيع متابعته. يختار المريض مختصه، وتختار أنت حالاتك.", "الطلبات"],
        ["تنبيهات سريرية", "إشارة خارج النطاق المعتاد لمريض ما تصلك مع الأدلة التي وراءها.", "التنبيهات"],
        ["ملفات المرضى", "الخط المرجعي والاتجاهات وما وجده توجيه ميرا، في سجل واحد.", "المرضى"],
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
        ["اقرأ الصورة", "الخط المرجعي والاتجاهات والإشارات لمريض واحد، مقارنةً بنطاقه هو."],
        ["راجع وعلّق", "تقرير شهري تقرؤه وتعلّق عليه. يبقى القرار لك."],
      ],
    },
    trust: {
      eyebrow: "حدود واضحة",
      titleA: "دعم للحكم السريري،",
      titleB: "لا بديل عنه.",
      doesTitle: "ما تفعله مساحة العمل",
      does: ["تعرض ما يشاركه المرضى فقط", "ترفع الإشارات مع أدلتها", "تقارن كل مريض بخطّه المرجعي", "تحفظ ملاحظاتك وتعليقاتك"],
      doesNotTitle: "ما لا تفعله مساحة العمل",
      doesNot: ["لا تشخّص", "لا تصف دواءً ولا توصي بعلاج", "لا تحلّ محل حكم المختص", "لا تشارك بيانات دون موافقة"],
      note: "مساحة العمل واجهة دعم سريري وليست خدمة طوارئ. في حال الخطر الفوري، تواصل مع خدمات الطوارئ المحلية.",
    },
    handoff: { eyebrow: "ما يستخدمه مرضاك", title: "تعرّف على لومينا.", body: "الفحص اليومي والمفكرة اللذان يحتفظ بهما مرضاك، ولا يشاركونهما معك إلا بالاختيار.", cta: "تعرّف على لومينا" },
    cta: {
      eyebrow: "للمختصين المرخّصين",
      titleA: "تابع الرعاية،",
      titleB: "بما يهم.",
      body: "سجّل الدخول إلى مساحتك، أو اطلب الوصول.",
      primary: "افتح مساحة العمل",
      benefits: ["مشاركة بموافقة المريض", "تنبيهات مع الأدلة", "تقارير شهرية"],
    },
    preview: {
      caption: "شاشات توضيحية من تطبيق المختص بمحتوى تجريبي. لا مرضى حقيقيين.",
      shared: "شاركه المريض",
      greeting: "صباح الخير، ليلى",
      summary: "تنبيه واحد عالي الأولوية و3 جلسات اليوم.",
      clinician: ["د. ليلى حداد", "أخصائية نفسية"],
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
      risk: { title: "مستوى الخطر في الحالات", description: "12 مريضاً تحت المتابعة", labels: ["أولوية", "مراقبة", "مستقر"], worsened: "مريض واحد ساءت حالته منذ الأسبوع الماضي" },
      attention: {
        title: "يحتاج انتباهك",
        description: "تنبيهات وتقارير ذات أولوية ومراجعات معلّقة",
        items: [
          ["النوم دون نطاقه المعتاد بكثير منذ 5 أيام", "سارة ك. · قبل ساعتين", "عالٍ"],
          ["توقّف الفحص اليومي أسبوعاً", "عمر ر. · قبل 5 ساعات", "متوسط"],
          ["تقرير شهري ذو أولوية", "لينا ب. · قبل يوم", "أولوية"],
          ["تقييم بانتظار المراجعة", "توجيه ميرا · قبل يوم", "مراجعة"],
        ],
      },
      agenda: {
        title: "جدول الجلسات",
        description: "الجلسات القادمة",
        today: "اليوم",
        items: [
          ["09:30", "سارة ك.", "متابعة · 45 دقيقة"],
          ["11:00", "آدم ت.", "أولى · 60 دقيقة"],
          ["14:15", "عمر ر.", "متابعة · 30 دقيقة"],
        ],
      },
      patients: {
        title: "المرضى ذوو الأولوية",
        description: "مرتّبون حسب الحالة والتنبيهات المفتوحة والانحراف",
        columns: ["المريض", "الحالة", "الانحراف", "تنبيهات مفتوحة", "آخر نشاط"],
        rows: [
          ["سارة ك.", "SK-014", "قبل ساعتين"],
          ["عمر ر.", "OR-007", "قبل 5 ساعات"],
          ["لينا ب.", "LB-021", "قبل يوم"],
          ["يارا م.", "YM-011", "قبل يومين"],
        ],
      },
      requests: {
        title: "الطلبات",
        description: "مرضى اقتُرحوا عليك",
        waiting: "طلبان من مرضى بانتظار ردّك",
        note: "اقبل أو ارفض لبدء الرعاية. لا يُشارَك شيء قبل ذلك.",
        items: [
          ["آدم ت.", "AT-003", "محال بعد فحص أولي", "ينتظر منذ يوم"],
          ["نور س.", "NS-030", "توجيه ميرا · إشارات تشتت الانتباه", "ينتظر منذ 3 ساعات"],
        ],
        primary: "مقترح كمختص أساسي",
        accept: "قبول",
        decline: "رفض",
        accepted: "أُضيف إلى مرضاك",
      },
      patient: {
        back: "المرضى",
        name: "سارة ك.",
        code: "SK-014",
        chips: ["ADHD", "المختص الأساسي"],
        statusTitle: "الحالة السريرية",
        facts: [
          ["الحالة", "أولوية"],
          ["الانحراف", "0.62"],
          ["المتابعة", "8 أسابيع"],
          ["اللغة", "EN"],
        ],
        tabs: ["نظرة عامة", "الخط الحياتي", "التقييمات", "الملاحظات"],
        chartTitle: "المزاج مقابل النطاق المعتاد",
        baseline: "النطاق المعتاد",
        verdict: "ضمن النطاق هذا الشهر، مع هبوط واحد في الأسبوع الثالث",
        signals: ["النوم", "التركيز", "الطاقة"],
        alertsTitle: "تنبيهات مفتوحة",
        alert: "النوم دون نطاقه المعتاد منذ 5 أيام",
        notShared: "لم يُشارَك من قبل المريض: مدخلات المفكرة. تنبيهات السلامة تصلك دائماً.",
      },
      report: {
        title: "التقارير الشهرية",
        description: "اقرأ وعلّق وأقرّ",
        patient: "لينا ب.",
        headline: "تقرير شهري ذو أولوية",
        period: "هذا الشهر",
        sections: ["الاتجاه", "مواضيع المفكرة", "الأهداف"],
        annotate: "تعليقك",
        annotation: "مناقشة روتين النوم في الجلسة القادمة.",
        acknowledge: "إقرار",
        acknowledged: "تم الإقرار",
      },
    },
  },
};

export const agentPagesCopy: Record<Lang, AgentPagesCopy> = { en, ar };
