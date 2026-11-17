import type { Lang } from "./config";

/**
 * Copy of /tracks — the one page that describes the three tracks (ADHD, bipolar disorder, psychosis & schizophrenia).
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
    title: "The three tracks: ADHD, bipolar disorder, psychosis",
    description:
      "What ADHD, bipolar disorder and psychosis or schizophrenia are, how each can show up in daily life, and how SynQ adapts your daily space to the track you follow.",
  },
  hero: {
    eyebrow: "The three tracks",
    titleA: "One space,",
    titleB: "shaped to your track.",
    body: "ADHD, bipolar disorder and psychosis ask different things of a day. SynQ keeps the same calm core and changes what it puts first.",
    scroll: "Explore the tracks",
  },
  explorer: {
    eyebrow: "Know the track",
    titleA: "Three ways a mind",
    titleB: "can need support.",
    pick: "Choose a track",
    tracks: {
      adhd: {
        tab: "ADHD",
        kicker: "Attention · Momentum",
        title: "ADHD",
        what: "A difference in how attention, activity and impulses are regulated. It has nothing to do with effort or intelligence: the hard part is usually starting, staying with a task and keeping track of time.",
        signsTitle: "How it can show up",
        signs: [
          "Starting a task is hard, even one that matters",
          "Time, steps and objects slip away",
          "A restless body or a mind that keeps jumping",
          "Long, intense focus on what truly interests you",
        ],
        leansTitle: "What leans in for ADHD",
        leans: [
          { name: "Spark", body: "Write one thing; it comes back as tiny steps to tick off, beside a short focus timer." },
          { name: "Focus and energy", body: "The check-in follows both, so a scattered week is visible early." },
          { name: "Short exercises", body: "Focus sprints and box breathing, a few minutes each." },
        ],
        visual: { caption: "Scattered effort, lined up one step at a time", labels: ["Everything at once", "One step"] },
      },
      bipolar: {
        tab: "Bipolar disorder",
        kicker: "Rhythm · Balance",
        title: "Bipolar disorder",
        what: "Stretches of unusually high energy and stretches of low mood, with calmer periods between them. Sleep and routine are often the first things to move, sometimes days before the mood does.",
        signsTitle: "How it can show up",
        signs: [
          "Little sleep without feeling tired",
          "Racing thoughts, big plans, quick spending",
          "Weeks of low energy and a flat mood",
          "A mood that changes faster than the day does",
        ],
        leansTitle: "What leans in for bipolar disorder",
        leans: [
          { name: "Sleep and rhythm", body: "Hours slept, mood and energy are read against your own baseline, not an average." },
          { name: "Early signals", body: "When a pattern lifts or drops, you get a gentle note to bring to your care team." },
          { name: "Reading library", body: "Calm articles from WHO, NIMH, NICE and the NHS, at your pace." },
        ],
        visual: { caption: "Your baseline, and how far the days move from it", labels: ["Higher", "Baseline", "Lower"] },
      },
      psychosis: {
        tab: "Psychosis & schizophrenia",
        kicker: "Calm · Grounding",
        title: "Psychosis & schizophrenia",
        what: "In psychosis, some of what you see, hear or believe is no longer shared by those around you. Schizophrenia is one condition where it can return. Steady, early support makes a real difference.",
        signsTitle: "How it can show up",
        signs: [
          "Hearing or seeing things others do not",
          "Strong beliefs, or a sense of being watched",
          "Thoughts that feel jumbled or hard to follow",
          "Pulling back, sleeping badly, less energy for daily tasks",
        ],
        leansTitle: "What leans in for psychosis",
        leans: [
          { name: "A quiet space", body: "No drifting motion and no pressure: the screens only fade, and nothing asks for speed." },
          { name: "Grounding", body: "The 5-4-3-2-1 exercise brings attention back to the room you are in." },
          { name: "A private journal", body: "Yours by default. Only what you choose to share reaches your clinician." },
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
    columns: ["ADHD", "Bipolar", "Psychosis"],
    rows: [
      { label: "Spark: one task into small steps", values: [true, false, false] },
      { label: "Focus timer", values: [true, false, false] },
      { label: "Sleep and rhythm read against your baseline", values: [false, true, false] },
      { label: "Reading library", values: [false, true, true] },
      { label: "Grounding exercises", values: [false, false, true] },
      { label: "Motion-free, quiet screens", values: [false, false, true] },
    ],
    yes: "Included",
    no: "Not part of this track",
  },
  cta: {
    eyebrow: "Not sure which one?",
    titleA: "Start with",
    titleB: "a conversation.",
    body: "Mira walks you through five everyday situations and suggests the track to follow. She orients, she never diagnoses.",
    primary: "Meet Mira",
    note: "Only a licensed professional can make a diagnosis.",
  },
};

const ar: TracksCopy = {
  seo: {
    title: "المسارات الثلاثة: فرط الحركة، ثنائي القطب، الذهان",
    description:
      "ما هو اضطراب فرط الحركة وتشتت الانتباه والاضطراب ثنائي القطب والذهان أو الفصام، وكيف يظهر كلٌّ منها في الحياة اليومية، وكيف تتكيّف SynQ مع المسار الذي تتابعه.",
  },
  hero: {
    eyebrow: "المسارات الثلاثة",
    titleA: "مساحة واحدة،",
    titleB: "على مقاس مسارك.",
    body: "فرط الحركة وتشتت الانتباه، والاضطراب ثنائي القطب، والذهان؛ لكلٍّ منها ما يطلبه من اليوم. تُبقي SynQ النواة الهادئة نفسها وتغيّر ما تضعه أولًا.",
    scroll: "استكشف المسارات",
  },
  explorer: {
    eyebrow: "تعرّف على المسار",
    titleA: "ثلاث طرق قد يحتاج",
    titleB: "فيها العقل إلى دعم.",
    pick: "اختر مسارًا",
    tracks: {
      adhd: {
        tab: "فرط الحركة وتشتت الانتباه",
        kicker: "انتباه · زخم",
        title: "فرط الحركة وتشتت الانتباه",
        what: "اختلاف في تنظيم الانتباه والنشاط والاندفاع. لا علاقة له بالجهد أو الذكاء: الصعوبة غالبًا في البدء، والبقاء مع المهمة، وتتبّع الوقت.",
        signsTitle: "كيف قد يظهر",
        signs: [
          "صعوبة في بدء مهمة، حتى المهمة المهمة",
          "يضيع الوقت والخطوات والأغراض",
          "جسد لا يهدأ أو عقل يقفز من فكرة إلى أخرى",
          "تركيز طويل وعميق على ما يثير اهتمامك حقًا",
        ],
        leansTitle: "ما يتكيّف لفرط الحركة",
        leans: [
          { name: "سبارك", body: "اكتب شيئًا واحدًا، فيعود إليك خطواتٍ صغيرة تضع عليها علامة، بجانب مؤقت تركيز قصير." },
          { name: "التركيز والطاقة", body: "يتابعهما الفحص اليومي، فيظهر الأسبوع المشتَّت مبكرًا." },
          { name: "تمارين قصيرة", body: "جولات تركيز وتنفّس مربّع، بضع دقائق لكلٍّ منها." },
        ],
        visual: { caption: "جهد مبعثر، يصطف خطوةً بعد خطوة", labels: ["كل شيء دفعة واحدة", "خطوة واحدة"] },
      },
      bipolar: {
        tab: "الاضطراب ثنائي القطب",
        kicker: "إيقاع · توازن",
        title: "الاضطراب ثنائي القطب",
        what: "فترات من الطاقة المرتفعة على غير المعتاد وفترات من المزاج المنخفض، تتخللها فترات أهدأ. غالبًا ما يتحرك النوم والروتين أولًا، وأحيانًا قبل المزاج بأيام.",
        signsTitle: "كيف قد يظهر",
        signs: [
          "نوم قليل دون شعور بالتعب",
          "أفكار متسارعة وخطط كبيرة وإنفاق سريع",
          "أسابيع من الطاقة المنخفضة والمزاج المسطّح",
          "مزاج يتغيّر أسرع من اليوم نفسه",
        ],
        leansTitle: "ما يتكيّف للاضطراب ثنائي القطب",
        leans: [
          { name: "النوم والإيقاع", body: "تُقرأ ساعات النوم والمزاج والطاقة مقارنةً بخطّك المرجعي أنت، لا بمتوسط عام." },
          { name: "إشارات مبكرة", body: "حين يرتفع نمط أو ينخفض، تصلك ملاحظة لطيفة تحملها إلى فريق رعايتك." },
          { name: "مكتبة القراءة", body: "مقالات هادئة من منظمة الصحة العالمية وNIMH وNICE وNHS، بوتيرتك." },
        ],
        visual: { caption: "خطّك المرجعي، ومدى ابتعاد الأيام عنه", labels: ["أعلى", "المرجع", "أدنى"] },
      },
      psychosis: {
        tab: "الذهان والفصام",
        kicker: "هدوء · ثبات",
        title: "الذهان والفصام",
        what: "في الذهان يصبح بعض ما تراه أو تسمعه أو تعتقده غير مشترك مع من حولك. الفصام إحدى الحالات التي قد يعود فيها. والدعم المبكر المنتظم يصنع فرقًا حقيقيًا.",
        signsTitle: "كيف قد يظهر",
        signs: [
          "سماع أو رؤية ما لا يراه الآخرون",
          "قناعات قوية، أو شعور بأنك مراقَب",
          "أفكار مشوّشة يصعب تتبّعها",
          "انسحاب ونوم سيّئ وطاقة أقل للمهام اليومية",
        ],
        leansTitle: "ما يتكيّف للذهان",
        leans: [
          { name: "مساحة هادئة", body: "بلا حركة منجرفة ولا ضغط: الشاشات تظهر وتتلاشى فقط، ولا شيء يطلب منك السرعة." },
          { name: "التثبيت", body: "تمرين 5-4-3-2-1 يعيد انتباهك إلى الغرفة التي أنت فيها." },
          { name: "مفكرة خاصة", body: "هي لك افتراضيًا. لا يصل إلى مختصك إلا ما تختار مشاركته." },
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
    columns: ["فرط الحركة", "ثنائي القطب", "الذهان"],
    rows: [
      { label: "سبارك: مهمة واحدة إلى خطوات صغيرة", values: [true, false, false] },
      { label: "مؤقت التركيز", values: [true, false, false] },
      { label: "النوم والإيقاع مقارنةً بخطّك المرجعي", values: [false, true, false] },
      { label: "مكتبة القراءة", values: [false, true, true] },
      { label: "تمارين التثبيت", values: [false, false, true] },
      { label: "شاشات هادئة بلا حركة", values: [false, false, true] },
    ],
    yes: "مشمول",
    no: "ليس ضمن هذا المسار",
  },
  cta: {
    eyebrow: "لست متأكدًا من مسارك؟",
    titleA: "ابدأ",
    titleB: "بمحادثة.",
    body: "تمرّ معك ميرا على خمسة مواقف يومية وتقترح المسار الذي تتابعه. هي توجّه ولا تشخّص أبدًا.",
    primary: "تعرّف على ميرا",
    note: "التشخيص لا يقوم به إلا مختص مرخَّص.",
  },
};

export const tracksCopy: Record<Lang, TracksCopy> = { en, ar };
