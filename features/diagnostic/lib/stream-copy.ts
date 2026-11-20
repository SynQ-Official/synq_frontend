import type { Lang } from "@/lib/i18n/config";

/** Mira's strings for streamed replies, the unfinished-reply note and the support card. */
export type MiraStreamCopy = {
  stop: string;
  stopped: string;
  interrupted: string;
  tryAgain: string;
  /** The visitor's message, while it is on its way / once it could not be delivered. */
  sending: string;
  notDelivered: string;
  slow: string;
  offline: string;
  rateLimited: string;
  /** 503: the engine shed the turn under load; nothing ran, so sending again is safe. */
  busy: string;
  support: {
    title: string;
    body: string;
    bodyShort: string;
    call: string;
    copy: string;
    copied: string;
    hide: string;
    hideConfirm: string;
    region: string;
  };
};

export const MIRA_STREAM_COPY: Record<Lang, MiraStreamCopy> = {
  en: {
    stop: "Stop",
    stopped: "You stopped this reply.",
    interrupted: "The connection dropped before Mira finished.",
    tryAgain: "Try again",
    sending: "Sending…",
    notDelivered: "Not delivered",
    slow: "This is taking a little longer than usual. Your message is safe.",
    offline: "You're offline. Your message is kept — send it again once you're back.",
    rateLimited: "Lots of messages at once. Let's pause a moment, then try again.",
    busy: "Mira is busy right now. Your message is kept — send it again in a moment.",
    support: {
      title: "You're not alone — support is right here",
      body: "If you might be in danger, please reach out to someone now. These people are ready to listen:",
      bodyShort: "If you might be in danger, please contact your local emergency services now. You deserve support.",
      call: "Call {resource}",
      copy: "Copy",
      copied: "Copied",
      hide: "I have what I need",
      hideConfirm: "Tap again to hide this",
      region: "Support resources",
    },
  },
  ar: {
    stop: "إيقاف",
    stopped: "أوقفتَ هذا الرد.",
    interrupted: "انقطع الاتصال قبل أن تُنهي ميرا ردّها.",
    tryAgain: "حاول مرة أخرى",
    sending: "جارٍ الإرسال…",
    notDelivered: "لم تُرسَل",
    slow: "الأمر يستغرق وقتًا أطول قليلًا من المعتاد. رسالتك بأمان.",
    offline: "أنت غير متصل. رسالتك محفوظة — أعد إرسالها عند عودة الاتصال.",
    rateLimited: "رسائل كثيرة دفعة واحدة. لنتوقف لحظة ثم نحاول مجددًا.",
    busy: "ميرا مشغولة الآن. رسالتك محفوظة — أعد إرسالها بعد لحظة.",
    support: {
      title: "لستَ وحدك — الدعم هنا",
      body: "إذا كنتَ قد تكون في خطر فتواصل مع أحدهم الآن. هؤلاء مستعدون للإصغاء إليك:",
      bodyShort: "إذا كنتَ قد تكون في خطر فتواصل مع خدمات الطوارئ المحلية الآن. أنت تستحق الدعم.",
      call: "اتصل بـ {resource}",
      copy: "نسخ",
      copied: "تم النسخ",
      hide: "لديّ ما أحتاجه",
      hideConfirm: "اضغط مرة أخرى للإخفاء",
      region: "جهات الدعم",
    },
  },
};
