import { ROUTES } from "@/lib/config/routes";

export type AgentId = "mira" | "lumina" | "psy";

/**
 * Presentation of each agent (home section cards, agent pages); copy lives in `dictionary.header.agents.items`.
 * Mira is teal and aqua, Lumina champagne and gold — the two sides of the logo — and Psy, the clinician's own workspace, sage.
 */
export const AGENTS: ReadonlyArray<{
  id: AgentId;
  href: string;
  /** `live` pulses (open to everyone now); `member` is a calm steady dot. */
  status: "live" | "member";
  tone: {
    ring: string;
    tint: string;
    text: string;
    dot: string;
    /** Soft gradient surface of the feature box. */
    surface: string;
    border: string;
    /** The wash that fades in on hover: the neighbour's colour. */
    wash: string;
    /** The thin line along the top edge. */
    edge: string;
    arrow: string;
    /** Row background on hover/focus in the header menu. */
    hover: string;
  };
}> = [
  {
    id: "mira",
    href: ROUTES.mira,
    status: "live",
    tone: {
      ring: "group-hover:ring-teal-200",
      tint: "bg-teal-50/80",
      text: "text-teal-700",
      dot: "bg-teal-500",
      surface: "bg-[linear-gradient(150deg,var(--color-teal-100),#ffffff_74%)]",
      border: "border-teal-200 hover:border-teal-400",
      wash: "bg-[linear-gradient(150deg,rgb(134_186_188/0.35),transparent_70%)]",
      edge: "from-teal-300 via-teal-500 to-teal-200",
      arrow: "bg-teal-600 text-white group-hover:bg-teal-800",
      hover: "hover:bg-teal-50/80 focus-visible:bg-teal-50/80",
    },
  },
  {
    id: "lumina",
    href: ROUTES.lumina,
    status: "member",
    tone: {
      ring: "group-hover:ring-gold-100",
      tint: "bg-gold-50",
      text: "text-gold-700",
      dot: "bg-gold",
      surface: "bg-[linear-gradient(150deg,var(--color-gold-50),#f3e8c6_86%)]",
      border: "border-gold-100 hover:border-gold",
      wash: "bg-[linear-gradient(150deg,rgb(230_213_170/0.6),transparent_70%)]",
      edge: "from-gold-100 via-gold to-gold-100",
      arrow: "bg-gold text-teal-900 group-hover:bg-gold-600 group-hover:text-white",
      hover: "hover:bg-gold-50 focus-visible:bg-gold-50",
    },
  },
  {
    id: "psy",
    href: ROUTES.psy,
    status: "member",
    tone: {
      ring: "group-hover:ring-sage-100",
      tint: "bg-sage-50",
      text: "text-sage-700",
      dot: "bg-sage",
      surface: "bg-[linear-gradient(150deg,var(--color-sage-50),#ffffff_78%)]",
      border: "border-sage-100 hover:border-sage",
      wash: "bg-[linear-gradient(150deg,rgb(127_176_174/0.3),transparent_70%)]",
      edge: "from-sage-100 via-sage to-sage-100",
      arrow: "bg-sage-700 text-white group-hover:bg-teal-800",
      hover: "hover:bg-sage-50 focus-visible:bg-sage-50",
    },
  },
];

/** Top-level destinations (no in-page home anchors). `product` opens the Mira / Lumina / Psy list; the others are plain links. */
export const PRIMARY_LINKS = [
  { id: "product", href: null },
  { id: "tracks", href: ROUTES.tracks },
  { id: "trust", href: ROUTES.privacy },
  { id: "support", href: ROUTES.support },
] as const;

export type PrimaryLinkId = (typeof PRIMARY_LINKS)[number]["id"];

export function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** The primary destination the path belongs to: a plain link, or "product" on any agent page (the orientation chat is Mira's own space). */
export function activeLinkId(pathname: string): PrimaryLinkId | null {
  if (isActivePath(pathname, ROUTES.orientation) || AGENTS.some((agent) => isActivePath(pathname, agent.href))) return "product";
  return PRIMARY_LINKS.find((link) => link.href && isActivePath(pathname, link.href))?.id ?? null;
}
