"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

export function ShareSiteButton() {
  const [copied, setCopied] = useState(false);

  async function shareSite() {
    const url = window.location.origin;
    const data = {
      title: "DevForum — Build. Share. Learn.",
      text: "A developer community for useful resources, ideas and conversations.",
      url,
    };

    if (navigator.share) {
      try {
        await navigator.share(data);
        return;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement("textarea");
      input.value = url;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  }

  return (
    <button type="button" onClick={shareSite} className="button-secondary shrink-0 gap-2">
      {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
      {copied ? "Copied" : "Share site"}
    </button>
  );
}

