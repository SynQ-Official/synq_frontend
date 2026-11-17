"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { healthcareCopy } from "@/lib/i18n/healthcare";
import { homeStoryCopy } from "@/lib/i18n/homeStory";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

/**
 * A quiet index along the reading edge: where you are, and a way to jump. It inverts against whatever
 * is behind it, so the same dots read on the light sheets and on the deep teal.
 */
export function SectionRail() {
    const { dictionary, language } = useLanguage();
    const copy = dictionary.homeLanding;
    const story = homeStoryCopy[language];
    const [active, setActive] = useState("home");

    const items = [
        { id: "home", label: copy.nav.home },
        { id: "what", label: story.what.rail },
        { id: "healthcare", label: healthcareCopy[language].rail },
        { id: "cta", label: copy.nav.getStarted },
    ];

    useEffect(() => {
        const targets = items.map((item) => document.getElementById(item.id)).filter((node): node is HTMLElement => node !== null);
        const observer = new IntersectionObserver(
            (entries) => entries.forEach((entry) => entry.isIntersecting && setActive(entry.target.id)),
            { rootMargin: "-45% 0px -50% 0px" },
        );
        targets.forEach((node) => observer.observe(node));
        return () => observer.disconnect();
        // The ids are constant; only the labels change with the language.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <nav aria-label={copy.nav.home} className="pointer-events-none fixed end-5 top-1/2 z-40 hidden -translate-y-1/2 xl:block">
            <ul className="flex flex-col items-end gap-1 mix-blend-difference">
                {items.map((item) => {
                    const current = active === item.id;
                    return (
                        <li key={item.id}>
                            <a
                                href={`#${item.id}`}
                                aria-current={current ? "location" : undefined}
                                className="group pointer-events-auto flex items-center gap-3 rounded-full py-2 ps-3 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                            >
                                <span
                                    className={cn(
                                        "text-[0.75rem] font-medium opacity-0 transition-[opacity,transform] duration-300 ease-out-soft group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100",
                                        "translate-x-2 rtl:-translate-x-2",
                                    )}
                                >
                                    {item.label}
                                </span>
                                <span
                                    aria-hidden
                                    className={cn("block rounded-full bg-white transition-[height,opacity] duration-500 ease-out-soft", current ? "h-7 w-[3px] opacity-100" : "h-1.5 w-1.5 opacity-60 group-hover:opacity-100")}
                                />
                            </a>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
