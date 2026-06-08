"use client";

import React, { useState } from "react";
import Modal from "./Modal";

export interface AddFloorPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFloor: (name: string, isPrivate: boolean) => void;
}

export default function AddFloorPopup({
  isOpen,
  onClose,
  onAddFloor,
}: AddFloorPopupProps) {
  const [name, setName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onAddFloor(name.trim(), isPrivate);
    setName("");
    setIsPrivate(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      panelClassName="bg-surface-card rounded-lg p-6 w-120 shadow-lg"
    >
      <h2 className="text-2xl font-medium mb-4 text-popup-heading">Create Floor</h2>

      <div className="mb-6">
        <label className="block text-lg font-base mb-2 text-list-emphasis">Floor Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="general-floors"
          className="w-full border border-neutral rounded-lg p-2 outline-none"
        />
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <span className="text-lg text-list-emphasis">Private Floor</span>
          <p className="text-sm text-list-muted">Only selected members can access rooms in this floor.</p>
        </div>
        <input
          type="checkbox"
          checked={isPrivate}
          onChange={(e) => setIsPrivate(e.target.checked)}
          className="w-5 h-5"
        />
      </div>

      <div className="flex justify-between gap-2">
        <button onClick={onClose} className="px-4 py-2 rounded-lg bg-surface-control hover:bg-surface-neutral">
          Cancel
        </button>
        <button onClick={handleSubmit} className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover">
          Create Floor
        </button>
      </div>
    </Modal>
  );
}
