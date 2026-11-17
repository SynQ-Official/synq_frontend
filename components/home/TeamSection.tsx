"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { teamCopy } from "@/lib/i18n/team";
import { REVEAL_VIEWPORT, fadeUp, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Image from "next/image";
import { HomeSection } from "./HomeSection";
import { SectionHeader } from "./SectionHeader";
import { DISPLAY_S, LABEL } from "./typography";

/**
 * One photo per member, in the order of `copy.members`. `crop` frames the face; `blend` lets a studio-white
 * background melt into the card's tint instead of showing as a white box.
 */
const PHOTOS = [
  { src: "/media/teams/chedi.jpg", crop: "scale-[1.2] origin-bottom", blend: true },
  { src: "/media/teams/roua.jpeg", crop: "", blend: false },
] as const;

/** The founders: tall editorial portraits on a soft tint, the second set lower so the pair reads as a spread. */
export const TeamSection = () => {
  const { language } = useLanguage();
  const copy = teamCopy[language];

  return (
    <HomeSection id="team" labelledBy="team-title">
      <SectionHeader variant="editorial" id="team-title" layout="split" eyebrow={copy.eyebrow} titleA={copy.titleA} titleB={copy.titleB} intro={copy.intro} />

      <div className="relative mt-12 md:mt-16">
        <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 -z-10 size-[min(90vw,44rem)] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(201_175_111/0.16),transparent)]" />

        <motion.ul variants={stagger(0.14, 0.1)} initial="hidden" whileInView="show" viewport={REVEAL_VIEWPORT} className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2 lg:gap-10">
          {copy.members.map((member, index) => {
            const photo = PHOTOS[index];
            return (
              <motion.li key={member.name} variants={fadeUp(0, 28)} className={cn(index % 2 === 1 && "sm:mt-20")}>
                <figure className="group relative aspect-[4/5] overflow-hidden rounded-panel bg-gradient-to-b from-teal-50 via-canvas to-white shadow-[0_32px_64px_-36px_rgb(17_76_97/0.45)]">
                  <div className={cn("absolute inset-0 transition-transform duration-700 ease-out-soft group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100", photo.blend && "mix-blend-multiply")}>
                    <div className={cn("absolute inset-0", photo.crop)}>
                      <Image src={photo.src} alt={member.name} fill sizes="(min-width: 1024px) 26rem, (min-width: 640px) 45vw, 100vw" className="object-cover" />
                    </div>
                  </div>

                  <div aria-hidden className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-teal-950/90 via-teal-950/40 to-transparent" />
                  {/* Inner hairline that warms to gold on hover: a frame, not a border. */}
                  <span aria-hidden className="pointer-events-none absolute inset-3 rounded-[calc(var(--radius-panel)-0.75rem)] border border-white/15 transition-colors duration-500 group-hover:border-gold-300/60 motion-reduce:transition-none" />

                  <figcaption className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                    <span dir="ltr" className="font-mono text-[0.8125rem] font-medium tabular-nums text-gold-300">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className={cn(DISPLAY_S, "mt-2 block text-white")}>{member.name}</span>
                    <span className="mt-3 flex items-center gap-3">
                      <span aria-hidden className="h-px w-6 shrink-0 bg-gold-300 transition-[width] duration-500 ease-out-soft group-hover:w-10 motion-reduce:transition-none" />
                      <span className={cn(LABEL, "text-teal-100")}>{member.role}</span>
                    </span>
                  </figcaption>
                </figure>
              </motion.li>
            );
          })}
        </motion.ul>
      </div>
    </HomeSection>
  );
};
