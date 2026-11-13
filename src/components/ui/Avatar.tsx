"use client";

import { useState } from "react";

export function Avatar({ name, src, size = "md" }: { name?: string; src?: string; size?: "sm" | "md" | "lg" }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const classes = size === "sm" ? "size-9 text-xs" : size === "lg" ? "size-24 text-3xl" : "size-11 text-sm";
  const label = name ? `${name} avatar` : "User avatar";

  if (src && failedSrc !== src) {
    return (
      <img
        src={src}
        alt={label}
        loading="lazy"
        decoding="async"
        onError={() => setFailedSrc(src)}
        className={`${classes} rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700`}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={label}
      className={`${classes} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 font-black text-white`}
    >
      {(name || "?").slice(0, 1).toUpperCase()}
    </div>
  );
}
