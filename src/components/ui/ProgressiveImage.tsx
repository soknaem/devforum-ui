"use client";

import { useState } from "react";

type Props = {
  src: string;
  alt: string;
  className?: string;
  loading?: "eager" | "lazy";
  sizes?: string;
};

export function ProgressiveImage({
  src,
  alt,
  className = "",
  loading = "lazy",
  sizes = "(max-width: 768px) 100vw, 720px",
}: Props) {
  const [loaded, setLoaded] = useState(false);

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      fetchPriority={loading === "eager" ? "high" : "auto"}
      sizes={sizes}
      onLoad={(event) => {
        const image = event.currentTarget;
        if (image.decode) {
          void image.decode().catch(() => undefined).finally(() => setLoaded(true));
        } else {
          setLoaded(true);
        }
      }}
      onError={() => setLoaded(true)}
      className={`bg-slate-200 transition-opacity duration-500 ease-out dark:bg-slate-800 ${loaded ? "opacity-100" : "opacity-0"} ${className}`}
    />
  );
}
