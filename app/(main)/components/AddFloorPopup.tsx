"use client";

import React, { useState, useRef, useEffect } from "react";

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
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!name.trim()) return;
    onAddFloor(name.trim(), isPrivate);
    setName("");
    setIsPrivate(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div ref={modalRef} className="bg-white rounded-lg p-6 w-120 shadow-lg">
        <h2 className="text-2xl font-medium mb-4 text-[#323339]">Create Floor</h2>

        <div className="mb-6">
          <label className="block text-lg font-base mb-2 text-[#222831]">Floor Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="general-floors"
            className="w-full border border-gray-300 rounded-lg p-2 outline-none"
          />
        </div>

        <div className="mb-6 flex items-center justify-between">
          <div>
            <span className="text-lg text-[#222831]">Private Floor</span>
            <p className="text-sm text-gray-500">Only selected members can access rooms in this floor.</p>
          </div>
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            className="w-5 h-5"
          />
        </div>

        <div className="flex justify-between gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300">
            Cancel
          </button>
          <button onClick={handleSubmit} className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600">
            Create Floor
          </button>
        </div>
      </div>
    </div>
  );
}
