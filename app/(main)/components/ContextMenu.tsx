"use client";

import React, { forwardRef } from "react";

export type ContextMenuItem = {
  label: string;
  danger?: boolean;
  onClick: () => void;
  disabled?: boolean;
};

export const contextMenuPanelClass = (position: "fixed" | "absolute" = "fixed") =>
  `flex flex-col items-center gap-1 py-2 px-2 ${position} z-[100] border rounded-xl border-default shadow-lg bg-surface-card text-heading text-sm tracking-wide`;

export const contextMenuItemClass = (danger?: boolean) =>
  `text-left w-full py-2 px-2 rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
    danger ? "text-destructive hover:bg-destructive-muted" : "hover:bg-surface-muted"
  }`;

export function ContextMenuList({ items }: { items: ContextMenuItem[] }) {
  return (
    <>
      {items.map((item, idx, arr) => (
        <React.Fragment key={item.label}>
          <button
            type="button"
            disabled={item.disabled}
            onClick={item.onClick}
            className={contextMenuItemClass(item.danger)}
          >
            {item.label}
          </button>
          {idx < arr.length - 1 && <div className="h-px bg-surface-control w-full my-1" />}
        </React.Fragment>
      ))}
    </>
  );
}

type ContextMenuProps = {
  x: number;
  y: number;
  items: ContextMenuItem[];
  className?: string;
  widthClass?: string;
  position?: "fixed" | "absolute";
};

export const ContextMenu = forwardRef<HTMLDivElement, ContextMenuProps>(
  function ContextMenu(
    { x, y, items, className = "", widthClass = "w-48", position = "fixed" },
    ref
  ) {
    return (
      <div
        ref={ref}
        className={`${contextMenuPanelClass(position)} ${widthClass} ${className}`}
        style={{ top: y, left: x }}
      >
        <ContextMenuList items={items} />
      </div>
    );
  }
);
