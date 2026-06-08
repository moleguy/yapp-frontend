"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import classNames from "classnames";
import { LIST_ITEM_IDLE, LIST_ITEM_SELECTED } from "@/lib/listItemClasses";
import {
  HiOutlineQueueList,
  HiOutlineUsers,
  HiOutlineShieldCheck,
  HiOutlineNoSymbol,
  HiOutlineInformationCircle,
  HiOutlineHashtag,
  HiOutlineEnvelope,
  HiOutlineUserPlus,
} from "react-icons/hi2";

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
}

const NavItem = ({ href, label, icon: Icon, active }: NavItemProps) => (
  <Link
    href={href}
    className={classNames(
      "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
      active ? LIST_ITEM_SELECTED + " font-medium" : LIST_ITEM_IDLE
    )}
  >
    <Icon className="w-5 h-5" />
    <span>{label}</span>
  </Link>
);

export default function HallSettingsNav({
  hallId,
  className,
}: {
  hallId: string;
  className?: string;
}) {
  const pathname = usePathname();

  const navItems = [
    {
      href: `/halls/${hallId}/settings`,
      label: "Overview",
      icon: HiOutlineInformationCircle,
      exact: true,
    },
    {
      href: `/halls/${hallId}/settings/profile`,
      label: "Hall Profile",
      icon: HiOutlineQueueList,
    },
    {
      href: `/halls/${hallId}/settings/rooms`,
      label: "Rooms & Floors",
      icon: HiOutlineHashtag,
    },
    {
      href: `/halls/${hallId}/settings/members`,
      label: "Members",
      icon: HiOutlineUsers,
    },
    {
      href: `/halls/${hallId}/settings/requests`,
      label: "Join requests",
      icon: HiOutlineUserPlus,
    },
    {
      href: `/halls/${hallId}/settings/roles`,
      label: "Roles",
      icon: HiOutlineShieldCheck,
    },
    {
      href: `/halls/${hallId}/settings/bans`,
      label: "Bans",
      icon: HiOutlineNoSymbol,
    },
    {
      href: `/halls/${hallId}/settings/invites`,
      label: "Invites",
      icon: HiOutlineEnvelope,
    },
  ];

  return (
    <nav
      className={
        className ??
        "flex h-full w-64 flex-col gap-1 border-r border-default bg-surface-elevated p-4"
      }
    >
      <h3 className="px-3 mb-2 text-xs font-semibold text-list-muted uppercase tracking-wider">
        Hall Settings
      </h3>
      {navItems.map((item) => (
        <NavItem
          key={item.href}
          href={item.href}
          label={item.label}
          icon={item.icon}
          active={item.exact ? pathname === item.href : pathname.startsWith(item.href)}
        />
      ))}
    </nav>
  );
}
