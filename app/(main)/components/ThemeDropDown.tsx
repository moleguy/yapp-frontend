'use client';

import React, { useState, useRef, useEffect } from "react";
import { MdDarkMode } from "react-icons/md";
import { IoMdSunny } from "react-icons/io";
import { IoColorPaletteOutline } from "react-icons/io5";
import { FaChevronDown } from "react-icons/fa";
import {
  useTheme,
  themeLabelToSetting,
  themeSettingToLabel,
  type ThemeSetting,
} from "@/app/contexts/ThemeContext";

const OPTIONS: { label: string; setting: ThemeSetting; icon: React.ReactNode }[] = [
  { label: "System Default", setting: "system", icon: <IoColorPaletteOutline className="w-5 h-5" /> },
  { label: "Light", setting: "light", icon: <IoMdSunny className="w-5 h-5 text-yellow-500" /> },
  { label: "Dark", setting: "dark", icon: <MdDarkMode className="w-5 h-5 text-list-emphasis" /> },
];

const ThemeDropDown: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [isDropDownOpen, setIsDropDownOpen] = useState(false);
  const themeRef = useRef<HTMLDivElement | null>(null);
  const selected = themeSettingToLabel(theme);

  useEffect(() => {
    if (!isDropDownOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setIsDropDownOpen(false);
      }
    }

    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [isDropDownOpen]);

  return (
    <div ref={themeRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsDropDownOpen((prev) => !prev)}
        className="relative flex w-full items-center justify-start px-4 py-2 border border-default rounded-lg focus:rounded-b-none focus:rounded-t-lg focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer transition-all duration-200 gap-2 bg-surface-elevated text-heading"
      >
        <span className="flex items-center gap-2">
          {OPTIONS.find((opt) => opt.setting === theme)?.icon}
          {selected}
        </span>
        <FaChevronDown
          className={`absolute right-2 w-4 h-4 transition-transform ${
            isDropDownOpen ? "rotate-[180deg]" : "rotate-0"
          } transition-all duration-200`}
        />
      </button>

      {isDropDownOpen && (
        <ul className="absolute left-0 w-full bg-surface-elevated border rounded-b-lg border-default z-10 transition-all duration-200 text-heading">
          {OPTIONS.filter((opt) => opt.setting !== theme).map((opt) => (
            <li
              key={opt.label}
              onClick={() => {
                setTheme(themeLabelToSetting(opt.label));
                setIsDropDownOpen(false);
              }}
              className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-list-hover hover:rounded-b-lg"
            >
              {opt.icon}
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ThemeDropDown;
