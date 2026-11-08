"use client";

import { type ReactNode, useEffect, useRef } from "react";

/**
 * Fades and lifts its content into place when it enters the viewport (the
 * vertical worlds' counterpart to the corridor's depth of field).
 *
 * Progressive: the hidden start state only applies once this has mounted
 * (`reveal--armed`), so without JavaScript, or for crawlers, the content is
 * simply visible. Content already in view on mount reveals immediately.
 */
export function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.add("reveal--armed");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal--in");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    observer.observe(el);
    // A jump past the section (anchor, End key) never makes it intersect:
    // reveal anything that is already above the viewport.
    const onScroll = () => {
      if (el.getBoundingClientRect().bottom < 0) {
        el.classList.add("reveal--in");
        window.removeEventListener("scroll", onScroll);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  );
}
