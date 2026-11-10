"use client";

import { useEffect } from "react";

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable;
}

/**
 * Keyboard shortcuts:
 *   /   jump to the search box (like GitHub, YouTube, Slack)
 *   Esc leave the search box
 */
export function Shortcuts() {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey && !isTyping(event.target)) {
        event.preventDefault();

        const focusInput = () => {
          const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('input[aria-label*="Search"]'));
          const visible = inputs.find((input) => input.offsetParent !== null);
          visible?.focus();
          return Boolean(visible);
        };

        if (!focusInput()) {
          // Mobile: the search box only exists after tapping the search icon.
          document.querySelector<HTMLButtonElement>('button[aria-label="Search"]')?.click();
          window.setTimeout(focusInput, 60);
        }
      } else if (event.key === "Escape" && isTyping(event.target)) {
        (event.target as HTMLElement).blur();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return null;
}
