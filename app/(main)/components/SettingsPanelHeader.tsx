"use client";

import React from "react";
import { IoIosClose } from "react-icons/io";

type Props = {
  title: string;
  subtitle?: string;
  onClose: () => void;
  closeLabel?: string;
};

export default function SettingsPanelHeader({
  title,
  subtitle,
  onClose,
  closeLabel = "Close settings",
}: Props) {
  return (
    <div className="relative z-10 flex flex-shrink-0 items-start justify-between gap-4 rounded-tr-2xl border-b border-default bg-surface-card px-4 py-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-heading">{title}</h1>
        {subtitle ? <p className="text-list-muted mt-1">{subtitle}</p> : null}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="flex-shrink-0 text-list-muted hover:text-heading transition-colors"
        title={closeLabel}
        aria-label={closeLabel}
      >
        <IoIosClose size={32} />
      </button>
    </div>
  );
}
