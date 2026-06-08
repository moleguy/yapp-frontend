"use client";

import React, { useEffect, useRef, useState } from "react";
import { FaChevronDown } from "react-icons/fa";
import type { PresenceStatus } from "@/lib/api";

const OPTIONS: {
  value: PresenceStatus;
  label: string;
  dotClass: string;
}[] = [
  { value: "online", label: "Online", dotClass: "bg-status-online" },
  { value: "away", label: "Away", dotClass: "bg-yellow-500" },
  { value: "busy", label: "Busy", dotClass: "bg-destructive" },
  { value: "offline", label: "Offline", dotClass: "bg-status-offline" },
];

type Props = {
  value: PresenceStatus;
  onChange: (status: PresenceStatus) => void | Promise<void>;
};

export default function PresenceSelect({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = OPTIONS.find((opt) => opt.value === value) ?? OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="relative flex-shrink-0"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 rounded-md border border-default bg-surface-elevated px-2 py-0.5 text-xs text-list-emphasis transition-colors hover:bg-list-hover focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Set your presence"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`h-2 w-2 rounded-full ${selected.dotClass}`} aria-hidden />
        <span>{selected.label}</span>
        <FaChevronDown
          className={`h-2.5 w-2.5 text-list-muted transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Presence status"
          className="absolute bottom-full left-0 z-[100] mb-1 min-w-[7.5rem] overflow-hidden rounded-lg border border-default bg-surface-card py-1 text-xs shadow-lg"
        >
          {OPTIONS.map((opt) => {
            const active = opt.value === value;
            return (
              <li key={opt.value} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    void onChange(opt.value);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors ${
                    active
                      ? "bg-list-selected text-list-emphasis font-medium"
                      : "text-list-muted hover:bg-list-hover hover:text-list-emphasis"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${opt.dotClass}`} aria-hidden />
                  {opt.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
