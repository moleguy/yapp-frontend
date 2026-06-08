"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { GoDotFill } from "react-icons/go";
import type { HallMember, PresenceStatus, Role } from "@/lib/api";
import {
  PRESENCE_LABELS,
  presenceBgClass,
  presenceTextClass,
} from "@/lib/presenceUtils";
import { roleBadgeClassName, roleDotColor } from "@/lib/roleUtils";

const POPOVER_WIDTH = 300;

export type MemberProfileTarget = {
  member: HallMember;
  status: PresenceStatus;
  anchorRect: DOMRect;
};

type Props = {
  target: MemberProfileTarget | null;
  roles: Role[];
  onClose: () => void;
};

function memberDisplayName(member: HallMember): string {
  return (
    member.nickname ||
    member.user?.display_name ||
    member.user?.username ||
    `User ${member.user_id.slice(0, 8)}`
  );
}

function formatJoinedDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function MemberProfilePopover({ target, roles, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    if (!target) {
      setPosition(null);
      return;
    }

    const margin = 8;
    const rect = target.anchorRect;
    const panelHeight = panelRef.current?.offsetHeight ?? 280;

    let left = rect.left - POPOVER_WIDTH - margin;
    let top = rect.top - 8;

    if (left < margin) {
      left = Math.max(margin, rect.right + margin);
    }
    top = Math.max(margin, Math.min(top, window.innerHeight - panelHeight - margin));

    setPosition({ left, top });
  }, [target]);

  useEffect(() => {
    if (!target) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [target, onClose]);

  if (!target || typeof document === "undefined") return null;

  const { member, status } = target;
  const name = memberDisplayName(member);
  const avatarUrl = member.user?.avatar_thumbnail_url || member.user?.avatar_url;
  const role = roles.find((r) => r.id === member.role_id);
  const hasNickname = Boolean(member.nickname);
  const displayName = member.user?.display_name;
  const description = member.user?.description?.trim();

  return createPortal(
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 cursor-default bg-transparent"
        aria-label="Close profile"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-label={`${name} profile`}
        className="fixed z-50 w-[300px] overflow-hidden rounded-xl border border-default bg-surface-card shadow-xl"
        style={{
          left: position?.left ?? target.anchorRect.left - POPOVER_WIDTH - 8,
          top: position?.top ?? target.anchorRect.top,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center px-4 py-5 text-center">
          <div className="relative mb-3">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={`${name}'s user profile picture`}
                width={80}
                height={80}
                unoptimized
                className="h-20 w-20 rounded-full object-cover bg-surface-placeholder"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface-strong text-2xl font-semibold text-white">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full border-[3px] border-surface-card bg-surface-card">
              <GoDotFill className={`h-5 w-5 ${presenceTextClass(status)}`} />
            </span>
          </div>

          <h3 className="text-lg font-semibold text-heading leading-tight">{name}</h3>
          {member.user?.username && (
            <p className="text-sm text-list-muted">@{member.user.username}</p>
          )}
          {hasNickname && displayName && displayName !== member.nickname && (
            <p className="mt-0.5 text-xs text-list-muted">
              Also known as {displayName}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${presenceBgClass(status)} text-white`}
            >
              {PRESENCE_LABELS[status]}
            </span>
            {role && (
              <span className={roleBadgeClassName(role)}>
                <span
                  className="h-2 w-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: roleDotColor(role) }}
                />
                {role.name}
              </span>
            )}
          </div>

          <p className="mt-3 text-xs text-list-muted">
            Member since {formatJoinedDate(member.joined_at)}
          </p>

          {description && (
            <div className="mt-3 w-full rounded-lg border border-default bg-surface-app px-3 py-2">
              <p className="text-xs font-medium text-list-muted mb-1">About Me</p>
              <p className="text-sm text-heading whitespace-pre-wrap break-words">{description}</p>
            </div>
          )}

          {member.user?.mutual_friend_count != null && member.user.mutual_friend_count > 0 && (
            <p className="mt-3 text-xs text-list-muted">
              {member.user.mutual_friend_count} mutual friend
              {member.user.mutual_friend_count === 1 ? "" : "s"}
            </p>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}
