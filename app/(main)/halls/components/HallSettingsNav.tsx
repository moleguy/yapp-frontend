"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import classNames from "classnames";
import {
  HiOutlineQueueList,
  HiOutlineUsers,
  HiOutlineShieldCheck,
  HiOutlineNoSymbol,
  HiOutlineInformationCircle,
  HiOutlineHashtag,
  HiOutlineEnvelope
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
      {
        "bg-[#efefef] text-[#222831] font-medium": active,
        "text-[#73726e] hover:bg-[#efefef] hover:text-[#222831]": !active,
      }
    )}
  >
    <Icon className="w-5 h-5" />
    <span>{label}</span>
  </Link>
);

export default function HallSettingsNav({ hallId }: { hallId: string }) {
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
    <nav className="flex flex-col gap-1 w-64 p-4 border-r border-[#dcd9d3] bg-[#f9f9f9] h-full">
      <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
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
