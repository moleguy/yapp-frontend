"use client";

import React from "react";
import { AppLink } from "@/lib/api";

interface SocialLinksDisplayProps {
  appLinks?: AppLink[];
  className?: string;
}

const PROVIDER_LABELS: Record<string, string> = {
  spotify: "Spotify",
  reddit: "Reddit",
  twitter: "Twitter",
  steam: "Steam",
};

export default function SocialLinksDisplay({
  appLinks = [],
  className = "",
}: SocialLinksDisplayProps) {
  const visible = appLinks.filter((l) => l.show_on_profile !== false && l.url);

  if (visible.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {visible.map((link) => (
        <a
          key={link.provider}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-400 hover:text-blue-300 underline"
        >
          {PROVIDER_LABELS[link.provider] || link.provider}
        </a>
      ))}
    </div>
  );
}
