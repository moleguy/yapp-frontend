"use client";

import React from "react";
import { IoIosClose } from "react-icons/io";
import Image from "next/image";
import { Hall } from "@/lib/api";
import Modal from "./Modal";
import { EmptyState } from "./FeedbackStates";
import { LayoutGrid } from "lucide-react";

export interface ManageHallsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  halls: Hall[];
  activeHallId: string | null;
  onSelectHall: (hall: Hall) => void;
}

export default function ManageHallsPopup({
  isOpen,
  onClose,
  halls,
  activeHallId,
  onSelectHall,
}: ManageHallsPopupProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      ariaLabelledby="manage-halls-title"
      panelClassName="bg-surface-card rounded-xl border border-default shadow-lg w-full max-w-sm p-6 max-h-[min(80vh,520px)] flex flex-col"
    >
      <div className="flex items-start justify-between gap-3 mb-4 flex-shrink-0">
        <div>
          <h2 id="manage-halls-title" className="text-xl font-medium text-list-emphasis tracking-wide">
            Manage Halls
          </h2>
          <p className="text-sm text-list-muted mt-1">
            Switch between your halls or find ones not shown in the sidebar.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-list-muted hover:bg-list-hover hover:text-list-emphasis transition-colors"
          aria-label="Close"
        >
          <IoIosClose className="w-7 h-7" />
        </button>
      </div>

      {halls.length === 0 ? (
        <EmptyState
          title="No halls yet"
          description="Create or join a hall to get started."
          icon={<LayoutGrid className="w-7 h-7" />}
          fullHeight={false}
        />
      ) : (
        <ul className="space-y-1 overflow-y-auto scrollbar-subtle -mx-1 px-1">
          {halls.map((hall) => {
            const isActive = hall.id === activeHallId;
            return (
              <li key={hall.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelectHall(hall);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors ${
                    isActive
                      ? "bg-list-selected text-list-emphasis"
                      : "text-list-muted hover:bg-list-hover hover:text-list-emphasis"
                  }`}
                >
                  {hall.icon_thumbnail_url ? (
                    <Image
                      src={hall.icon_thumbnail_url}
                      alt={`${hall.name} hall profile picture`}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-surface-placeholder flex items-center justify-center text-list-emphasis font-medium flex-shrink-0">
                      {hall.name.trim().charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="font-medium truncate">{hall.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
