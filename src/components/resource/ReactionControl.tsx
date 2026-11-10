"use client";

import { useRef, useState } from "react";

export const REACTIONS = [
  { type: "LIKE", emoji: "👍", label: "Like" },
  { type: "LOVE", emoji: "❤️", label: "Love" },
  { type: "HAHA", emoji: "😂", label: "Haha" },
  { type: "WOW", emoji: "😮", label: "Wow" },
  { type: "SAD", emoji: "😢", label: "Sad" },
  { type: "ANGRY", emoji: "😡", label: "Angry" },
] as const;

export function reactionInfo(type?: string | null) {
  return REACTIONS.find((reaction) => reaction.type === type) || REACTIONS[0];
}

export function ReactionControl({
  selected,
  onReact,
  compact = false,
}: {
  selected?: string | null;
  onReact: (type: string) => Promise<void> | void;
  compact?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressClick = useRef(false);
  const current = reactionInfo(selected);

  function cancelClose() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function scheduleClose() {
    cancelClose();
    closeTimer.current = setTimeout(() => setExpanded(false), 550);
  }

  function cancelLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  function pointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    if (event.pointerType !== "touch") return;
    suppressClick.current = false;
    cancelLongPress();
    longPressTimer.current = setTimeout(() => {
      suppressClick.current = true;
      cancelClose();
      setExpanded(true);
    }, 450);
  }

  function pointerUp() {
    cancelLongPress();
  }

  async function select(type: string) {
    cancelClose();
    setExpanded(false);
    await onReact(type);
  }

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => {
        cancelClose();
        setExpanded(true);
      }}
      onMouseLeave={scheduleClose}
      onFocus={() => {
        cancelClose();
        setExpanded(true);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          scheduleClose();
        }
      }}
    >
      <div
        className={`absolute bottom-full left-0 z-50 mb-1.5 rounded-full border border-slate-200 bg-white p-1.5 shadow-xl transition-opacity duration-150 ${
          expanded ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
      >
        <div className="flex items-center gap-0.5">
          {REACTIONS.map((reaction) => (
            <button
              key={reaction.type}
              type="button"
              title={reaction.label}
              aria-label={reaction.label}
              onClick={() => select(reaction.type)}
              className={`grid h-9 w-9 place-items-center rounded-full text-xl transition-transform hover:scale-125 ${
                selected === reaction.type ? "bg-blue-50 ring-2 ring-blue-200" : ""
              }`}
            >
              {reaction.emoji}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onPointerDown={pointerDown}
        onPointerUp={pointerUp}
        onPointerCancel={pointerUp}
        onClick={async () => {
          if (suppressClick.current) {
            suppressClick.current = false;
            return;
          }
          await onReact(current.type);
        }}
        className={`action-button select-none ${selected ? "bg-blue-50 text-blue-600 ring-1 ring-blue-200 shadow-sm" : ""} ${
          compact ? "px-2.5" : ""
        }`}
        aria-label={`${current.label}. Hover or press and hold for more reactions.`}
      >
        <span className="text-base leading-none">{current.emoji}</span>
        {!compact && <span>{current.label}</span>}
      </button>
    </div>
  );
}
