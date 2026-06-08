"use client";

import React, { useEffect, useRef } from "react";

/** Context menus use z-[100]; modals sit above them at z-[200]. */
export const MODAL_Z_INDEX = "z-[200]";
export const MODAL_BACKDROP_CLASS = "bg-black/50";

export type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  panelClassName?: string;
  overlayClassName?: string;
  ariaLabelledby?: string;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  lockScroll?: boolean;
};

export default function Modal({
  isOpen,
  onClose,
  children,
  panelClassName = "",
  overlayClassName = "",
  ariaLabelledby,
  closeOnBackdrop = true,
  closeOnEscape = true,
  lockScroll = true,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose, closeOnEscape]);

  useEffect(() => {
    if (!isOpen || !closeOnBackdrop) return;

    const onMouseDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [isOpen, onClose, closeOnBackdrop]);

  useEffect(() => {
    if (!isOpen || !lockScroll) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen, lockScroll]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center ${MODAL_BACKDROP_CLASS} ${MODAL_Z_INDEX} p-4 ${overlayClassName}`}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledby}
        className={panelClassName}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
