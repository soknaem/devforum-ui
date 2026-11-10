"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

/** Appears after scrolling down a long feed; one tap returns to the top. */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 900);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label="Back to top"
      title="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-20 right-4 z-40 grid h-11 w-11 place-items-center rounded-full bg-blue-600 text-white shadow-lg transition hover:bg-blue-700 md:bottom-6 md:right-6"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
