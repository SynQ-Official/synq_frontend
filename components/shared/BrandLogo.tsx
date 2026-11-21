import Image from "next/image";
import { LocaleLink as Link } from "@/components/shared/LocaleLink";
import { BRAND } from "@/lib/config/brand";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: { mark: "size-10", wordmark: "text-sm" },
  md: { mark: "size-10 sm:size-16", wordmark: "text-base sm:text-lg" },
  lg: { mark: "size-12 sm:size-14", wordmark: "text-2xl sm:text-3xl" },
  xl: { mark: "size-24 sm:size-28", wordmark: "text-5xl sm:text-6xl" },
} as const;

type BrandLogoProps = {
  size?: keyof typeof SIZES;
  /** Render as a home link (default) or as a plain image. */
  href?: string | null;
  className?: string;
  priority?: boolean;
};

/**
 * The single SynQ logo used across every header, loader and footer.
 * Pair the existing brand mark with a text wordmark so the product name stays current.
 */
export function BrandLogo({ size = "md", href = "/", className, priority = true }: BrandLogoProps) {
  const content = (
    <>
      <Image
        src="/assets/logo.svg"
        // The home link carries its own aria-label; the alt still names the logo for crawlers and image search.
        alt={`${BRAND.name} logo`}
        aria-hidden={href ? true : undefined}
        width={512}
        height={512}
        priority={priority}
        className={cn("shrink-0 select-none object-contain", SIZES[size].mark)}
      />
    </>
  );

  if (!href) return <span className={cn("inline-flex shrink-0 items-center gap-2", className)}>{content}</span>;

  return (
    <Link
      href={href}
      aria-label={`${BRAND.name} — home`}
      className={cn(
        "inline-flex shrink-0 items-center rounded-xl transition-opacity duration-200 hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-500",
        className,
      )}
    >
      {content}
    </Link>
  );
}
