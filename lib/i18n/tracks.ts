import type { Lang } from "./config";

/**
 * Copy of /care-paths — the one page that describes the three care paths (ADHD, bipolar disorder, psychosis).
 * One word everywhere: "care path" (menu, footer, page, metadata). The code keeps the `track` identifiers.
 * It says what each is and how it can show up, and what the daily space does differently for it. It does not repeat
 * how Mira or Lumina work (that lives on /mira and /lumina) and it never offers a diagnosis.
 */
export type TrackId = "adhd" | "bipolar" | "psychosis";

type TrackCopy = {
  /** Tab label. */
  tab: string;
  /** Small kicker over the title. */
  kicker: string;
  title: string;
  /** What it is, in two plain sentences. */
  what: string;
  signsTitle: string;
  signs: readonly string[];
  /** How the daily space leans for this track. */
  leansTitle: string;
  leans: readonly { name: string; body: string }[];
  /** Caption under the picture. */
  visual: { caption: string; labels: readonly string[] };
};

export type TracksCopy = {
  seo: { title: string; description: string };
  hero: { eyebrow: string; titleA: string; titleB: string; body: string; scroll: string };
  explorer: { eyebrow: string; titleA: string; titleB: string; pick: string; tracks: Record<TrackId, TrackCopy> };
  matrix: {
    eyebrow: string;
    titleA: string;
    titleB: string;
    body: string;
    columns: readonly string[];
    rows: readonly { label: string; values: readonly [boolean, boolean, boolean] }[];
    yes: string;
    no: string;
  };
  cta: { eyebrow: string; titleA: string; titleB: string; body: string; primary: string; note: string };
};

const en: TracksCopy = {
  seo: {
    title: "Care paths for ADHD, bipolar disorder and psychosis",
    description:
      "What ADHD, bipolar disorder and psychosis are, how each can show up in daily life, and which tools each SynQ care path adds.",
  },
  hero: {
    eyebrow: "Care paths",
    titleA: "Care paths for ADHD,",
    titleB: "bipolar disorder and psychosis.",
    body: "Three care paths share one daily core: check-in, journal and monthly summary. Each adds a few tools suited to it. Mira's orientation suggests a path, and your clinician can confirm or change it.",
    scroll: "Explore the care paths",
  },
  explorer: {
    eyebrow: "The three conditions",
    titleA: "Three ways a mind",
    titleB: "can need support.",
    pick: "Choose a care path",
    tracks: {
      adhd: {
        tab: "ADHD",
        kicker: "Attention and organisation",
        title: "ADHD",
        what: "A difference in how attention, activity and impulses are regulated. It has nothing to do with effort or intelligence: the hard part is usually starting, staying with a task and keeping track of time.",
        signsTitle: "How it can show up",
        signs: [
          "Starting a task is hard, even one that matters",
          "Time, steps and objects slip away",
          "A restless body or a mind that keeps jumping",
          "Long, intense focus on what truly interests you",
        ],
        leansTitle: "What the ADHD care path adds",
        leans: [
          { name: "Spark", body: "Write one thing; it comes back as tiny steps to tick off, beside a short focus timer." },
          { name: "Focus and energy", body: "The check-in follows both, so a scattered week is visible early." },
          { name: "Short exercises", body: "Focus sprints and box breathing, a few minutes each." },
        ],
        visual: { caption: "Scattered effort, lined up one step at a time", labels: ["Everything at once", "One step"] },
      },
      bipolar: {
        tab: "Bipolar disorder",
        kicker: "Mood and energy cycles",
        title: "Bipolar disorder",
        what: "Stretches of unusually high energy and stretches of low mood, with steadier periods between them. Sleep and routine are often the first things to move, sometimes days before the mood does.",
        signsTitle: "How it can show up",
        signs: [
          "Little sleep without feeling tired",
          "Racing thoughts, big plans, quick spending",
          "Weeks of low energy and a flat mood",
          "A mood that changes faster than the day does",
        ],
        leansTitle: "What the bipolar disorder care path adds",
        leans: [
          { name: "Sleep and rhythm", body: "Hours slept, mood and energy are read against your usual range, not an average." },
          { name: "Early changes", body: "When your sleep, mood or energy moves outside your usual range, you see a gentle note to discuss with your clinician. If it suggests a serious risk, you see emergency numbers, and your clinician is alerted if you have connected one." },
          { name: "Reading library", body: "Short articles from WHO, NIMH, NICE and the NHS, at your pace." },
        ],
        visual: { caption: "Your usual range, and how far the days move from it", labels: ["Higher", "Usual", "Lower"] },
      },
      psychosis: {
        tab: "Psychosis",
        kicker: "Perception and thinking",
        title: "Psychosis",
        what: "In psychosis, some of what you see, hear or believe is no longer shared by those around you. Schizophrenia is one condition where it can return. Steady, early support makes a real difference.",
        signsTitle: "How it can show up",
        signs: [
          "Hearing or seeing things others do not",
          "Strong beliefs, or a sense of being watched",
          "Thoughts that feel jumbled or hard to follow",
          "Pulling back, sleeping badly, less energy for daily tasks",
        ],
        leansTitle: "What the psychosis care path adds",
        leans: [
          { name: "A quiet space", body: "No drifting motion and no pressure: the screens only fade, and nothing asks for speed." },
          { name: "Grounding", body: "The 5-4-3-2-1 exercise brings attention back to the room you are in." },
          { name: "A private journal", body: "Yours by default: your clinician sees only what you choose to share. One exception: if something you log or write suggests you may be in danger, you see emergency numbers, and your clinician is alerted if you have connected one." },
        ],
        visual: { caption: "Five things you see, four you feel, and so on, back to the room", labels: ["5", "4", "3", "2", "1"] },
      },
    },
  },
  matrix: {
    eyebrow: "At a glance",
    titleA: "What changes,",
    titleB: "and what stays.",
    body: "The check-in, the journal and the reports are the same for everyone. Only what sits around them adapts.",
    columns: ["ADHD", "Bipolar disorder", "Psychosis"],
    rows: [
      { label: "Spark: one task into small steps", values: [true, false, false] },
      { label: "Focus timer", values: [true, false, false] },
      { label: "Sleep and rhythm read against your usual range", values: [false, true, false] },
      { label: "Reading library", values: [false, true, true] },
      { label: "Grounding exercises", values: [false, false, true] },
      { label: "Motion-free, quiet screens", values: [false, false, true] },
    ],
    yes: "Included",
    no: "Not included",
  },
  cta: {
    eyebrow: "Not sure which one?",
    titleA: "Start with",
    titleB: "a conversation.",
    body: "Mira walks you through everyday situations and quick questions, then suggests a care path to discuss with your clinician. Mira is software: it orients, it never diagnoses.",
    primary: "Meet Mira",
    note: "Only a licensed professional can make a diagnosis.",
  },
};

const ar: TracksCopy = {
  seo: {
    title: "مسارات الرعاية لفرط الحركة وثنائي القطب والذهان",
    description:
      "ما هو اضطراب فرط الحركة وتشتت الانتباه والاضطراب ثنائي القطب والذهان، وكيف يظهر كلٌّ منها في الحياة اليومية، وما الأدوات التي يضيفها كل مسار رعاية في SynQ.",
  },
  hero: {
    eyebrow: "مسارات الرعاية",
    titleA: "مسارات رعاية لفرط الحركة،",
    titleB: "وثنائي القطب والذهان.",
    body: "ثلاثة مسارات رعاية تتشارك نواة يومية واحدة: الفحص اليومي والمفكرة والملخص الشهري، ويضيف كل مسار بعض الأدوات المناسبة له. يقترح توجيه ميرا مسارًا، ويمكن لمختصك أن يؤكده أو يغيّره.",
    scroll: "استكشف مسارات الرعاية",
  },
  explorer: {
    eyebrow: "الحالات الثلاث",
    titleA: "ثلاث طرق قد يحتاج",
    titleB: "فيها العقل إلى دعم.",
    pick: "اختر مسار رعاية",
    tracks: {
      adhd: {
        tab: "فرط الحركة وتشتت الانتباه",
        kicker: "الانتباه والتنظيم",
        title: "فرط الحركة وتشتت الانتباه",
        what: "اختلاف في تنظيم الانتباه والنشاط والاندفاع. لا علاقة له بالجهد أو الذكاء: الصعوبة غالبًا في البدء، والبقاء مع المهمة، وتتبّع الوقت.",
        signsTitle: "كيف قد يظهر",
        signs: [
          "صعوبة في بدء مهمة، حتى المهمة المهمة",
          "يضيع الوقت والخطوات والأغراض",
          "جسد لا يهدأ أو عقل يقفز من فكرة إلى أخرى",
          "تركيز طويل وعميق على ما يثير اهتمامك حقًا",
        ],
        leansTitle: "ما يضيفه مسار فرط الحركة",
        leans: [
          { name: "سبارك", body: "اكتب شيئًا واحدًا، فيعود إليك خطواتٍ صغيرة تضع عليها علامة، بجانب مؤقت تركيز قصير." },
          { name: "التركيز والطاقة", body: "يتابعهما الفحص اليومي، فيظهر الأسبوع المشتَّت مبكرًا." },
          { name: "تمارين قصيرة", body: "جولات تركيز وتنفّس مربّع، بضع دقائق لكلٍّ منها." },
        ],
        visual: { caption: "جهد مبعثر، يصطف خطوةً بعد خطوة", labels: ["كل شيء دفعة واحدة", "خطوة واحدة"] },
      },
      bipolar: {
        tab: "الاضطراب ثنائي القطب",
        kicker: "دورات المزاج والطاقة",
        title: "الاضطراب ثنائي القطب",
        what: "فترات من الطاقة المرتفعة على غير المعتاد وفترات من المزاج المنخفض، تتخللها فترات أهدأ. غالبًا ما يتحرك النوم والروتين أولًا، وأحيانًا قبل المزاج بأيام.",
        signsTitle: "كيف قد يظهر",
        signs: [
          "نوم قليل دون شعور بالتعب",
          "أفكار متسارعة وخطط كبيرة وإنفاق سريع",
          "أسابيع من الطاقة المنخفضة والمزاج المسطّح",
          "مزاج يتغيّر أسرع من اليوم نفسه",
        ],
        leansTitle: "ما يضيفه مسار ثنائي القطب",
        leans: [
          { name: "النوم والإيقاع", body: "تُقرأ ساعات النوم والمزاج والطاقة مقارنةً بنطاقك المعتاد، لا بمتوسط عام." },
          { name: "تغيّرات مبكرة", body: "حين يخرج نومك أو مزاجك أو طاقتك عن نطاقك المعتاد، تظهر لك ملاحظة لطيفة تناقشها مع مختصك. وإن أشار ذلك إلى خطر جدي، ترى أرقام الطوارئ، ويُنبَّه مختصك إن كنت قد ربطت حسابك به." },
          { name: "مكتبة القراءة", body: "مقالات قصيرة من منظمة الصحة العالمية وNIMH وNICE وNHS، بوتيرتك." },
        ],
        visual: { caption: "نطاقك المعتاد، ومدى ابتعاد الأيام عنه", labels: ["أعلى", "المعتاد", "أدنى"] },
      },
      psychosis: {
        tab: "الذهان",
        kicker: "الإدراك والتفكير",
        title: "الذهان",
        what: "في الذهان يصبح بعض ما تراه أو تسمعه أو تعتقده غير مشترك مع من حولك. الفصام إحدى الحالات التي قد يعود فيها. والدعم المبكر المنتظم يصنع فرقًا حقيقيًا.",
        signsTitle: "كيف قد يظهر",
        signs: [
          "سماع أو رؤية ما لا يراه الآخرون",
          "قناعات قوية، أو شعور بأنك مراقَب",
          "أفكار مشوّشة يصعب تتبّعها",
          "انسحاب ونوم سيّئ وطاقة أقل للمهام اليومية",
        ],
        leansTitle: "ما يضيفه مسار الذهان",
        leans: [
          { name: "مساحة بسيطة", body: "بلا حركة منجرفة ولا ضغط: الشاشات تظهر وتتلاشى فقط، ولا شيء يطلب منك السرعة." },
          { name: "التثبيت", body: "تمرين 5-4-3-2-1 يعيد انتباهك إلى الغرفة التي أنت فيها." },
          { name: "مفكرة خاصة", body: "هي لك افتراضيًا: لا يرى مختصك إلا ما تختار مشاركته. استثناء واحد: إن أشار شيء تسجّله أو تكتبه إلى أنك قد تكون في خطر، ترى أرقام الطوارئ، ويُنبَّه مختصك إن كنت قد ربطت حسابك به." },
        ],
        visual: { caption: "خمسة أشياء ترى، وأربعة تلمس، وهكذا، عودةً إلى الغرفة", labels: ["5", "4", "3", "2", "1"] },
      },
    },
  },
  matrix: {
    eyebrow: "في لمحة",
    titleA: "ما يتغيّر،",
    titleB: "وما يبقى.",
    body: "الفحص اليومي والمفكرة والتقارير واحدة للجميع. وحده ما يحيط بها يتكيّف.",
    columns: ["فرط الحركة", "الاضطراب ثنائي القطب", "الذهان"],
    rows: [
      { label: "سبارك: مهمة واحدة إلى خطوات صغيرة", values: [true, false, false] },
      { label: "مؤقت التركيز", values: [true, false, false] },
      { label: "النوم والإيقاع مقارنةً بنطاقك المعتاد", values: [false, true, false] },
      { label: "مكتبة القراءة", values: [false, true, true] },
      { label: "تمارين التثبيت", values: [false, false, true] },
      { label: "شاشات بسيطة بلا حركة", values: [false, false, true] },
    ],
    yes: "مشمول",
    no: "غير مشمول",
  },
  cta: {
    eyebrow: "لست متأكدًا من مسار رعايتك؟",
    titleA: "ابدأ",
    titleB: "بمحادثة.",
    body: "تمرّ معك ميرا على مواقف يومية وأسئلة سريعة، ثم تقترح مسار رعاية تناقشه مع مختصك. ميرا برنامج: توجّه ولا تشخّص أبدًا.",
    primary: "تعرّف على ميرا",
    note: "التشخيص لا يقوم به إلا مختص مرخَّص.",
  },
};

export const tracksCopy: Record<Lang, TracksCopy> = { en, ar };
