"use client";

import React from "react";
import { Loader2, AlertCircle } from "lucide-react";

type LayoutProps = {
  className?: string;
  fullHeight?: boolean;
};

export function LoadingState({
  message = "Loading…",
  className = "",
  fullHeight = true,
}: LayoutProps & { message?: string }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 text-list-muted ${
        fullHeight ? "flex-1 min-h-[12rem]" : "py-12"
      } ${className}`}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="w-8 h-8 text-primary animate-spin" aria-hidden />
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon,
  className = "",
  fullHeight = true,
}: LayoutProps & {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center px-6 ${
        fullHeight ? "flex-1 min-h-[12rem]" : "py-12"
      } ${className}`}
    >
      {icon ? (
        <div className="w-14 h-14 bg-primary-muted rounded-full flex items-center justify-center mb-4 text-primary">
          {icon}
        </div>
      ) : null}
      <p className="text-base font-medium text-list-emphasis">{title}</p>
      {description ? (
        <p className="text-sm text-list-muted mt-1 max-w-xs">{description}</p>
      ) : null}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  message,
  action,
  className = "",
  fullHeight = true,
}: LayoutProps & {
  title?: string;
  message: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center gap-3 px-6 ${
        fullHeight ? "flex-1 min-h-[12rem]" : "py-12"
      } ${className}`}
      role="alert"
    >
      <div className="w-14 h-14 bg-destructive-muted rounded-full flex items-center justify-center">
        <AlertCircle className="w-7 h-7 text-destructive" aria-hidden />
      </div>
      <div>
        <p className="text-base font-medium text-list-emphasis">{title}</p>
        <p className="text-sm text-list-muted mt-1 max-w-sm">{message}</p>
      </div>
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors text-sm"
        >
          {action.label}
        </button>
      ) : null}
    </div>
  );
}

export function InlineError({
  message,
  className = "",
}: {
  message: string;
  className?: string;
}) {
  return (
    <p className={`text-sm text-destructive ${className}`} role="alert">
      {message}
    </p>
  );
}
