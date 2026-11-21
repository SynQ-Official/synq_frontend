"use client";

import type { ReactNode } from "react";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { HelpNow } from "@/components/help/HelpNow";
import { HeaderShell } from "./HeaderShell";
import { MarketingHeader } from "./MarketingHeader";

/**
 * One header system. Public, support and auth pages all wear the same capsule (it adapts to the
 * visitor and the page); only the orientation chat has its own application chrome.
 */
type SiteHeaderProps =
  /** Full marketing navigation — landing and public content. */
  | { variant: "public" }
  /** Support pages share the public header (Support shows as the current destination). */
  | { variant: "support" }
  /** Application chrome — logo, optional centre content, trailing controls (orientation). */
  | { variant: "app"; center?: ReactNode; actions?: ReactNode; position?: "sticky" | "static" };

export function SiteHeader(props: SiteHeaderProps) {
  switch (props.variant) {
    case "public":
    case "support":
      return <MarketingHeader />;

    case "app":
      return (
        // Application chrome: the same floating capsule as the public header, held in its condensed state
        // and aligned to the chat's width.
        <HeaderShell position={props.position ?? "sticky"} surface="capsule" solid innerClassName="max-w-chat grid grid-cols-[auto_1fr_auto]">
          <BrandLogo size="md" />
          <div className="flex min-w-0 justify-center">{props.center}</div>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <HelpNow label="short" />
            {props.actions}
          </div>
        </HeaderShell>
      );
  }
}
