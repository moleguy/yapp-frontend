"use client";

import React from "react";

export const SETTINGS_LABEL_CLASS =
  "block text-sm font-semibold text-strong uppercase tracking-wider";

export const SETTINGS_INPUT_CLASS =
  "w-full px-4 py-2 border border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-surface-elevated";

/** Matches hall settings page shell (`max-w-2xl space-y-8`). */
export function SettingsSection({ children }: { children: React.ReactNode }) {
  return <div className="w-full max-w-2xl space-y-8">{children}</div>;
}

/** Matches hall settings form spacing (`space-y-6`). */
export function SettingsForm({ children }: { children: React.ReactNode }) {
  return <div className="space-y-6">{children}</div>;
}

/** Matches hall settings field group (`space-y-2` + label). */
export function SettingsField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className={SETTINGS_LABEL_CLASS}>{label}</label>
      {hint ? <p className="text-sm text-list-muted">{hint}</p> : null}
      {children}
    </div>
  );
}

/** Standalone informational copy in a settings panel (centered block + text). */
export function SettingsNotice({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex w-full justify-center ${className}`}>
      <p className="max-w-md text-center text-sm text-list-muted">{children}</p>
    </div>
  );
}
