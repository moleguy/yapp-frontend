// components/SettingsPopup.tsx
"use client";

import React from "react";
import { IoMdSettings } from "react-icons/io";
import SettingsModal from "./SettingsModal";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  initialTab?: string;
};

const SettingsPopup: React.FC<Props> = ({ isOpen, onClose, onOpen, initialTab }) => {
  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        aria-label="Open settings"
        className="flex justify-center items-center p-1.5 rounded-lg text-list-muted hover:bg-surface-control-hover cursor-pointer transition-colors"
      >
        <IoMdSettings size={20} />
      </button>

      <SettingsModal isOpen={isOpen} onClose={onClose} initialTab={initialTab} />
    </>
  );
};

export default SettingsPopup;
