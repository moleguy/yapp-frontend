"use client";

import React, { useState, useRef, useEffect } from "react";
import { FaHashtag } from "react-icons/fa";
import { HiSpeakerWave } from "react-icons/hi2";

export interface AddChannelPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onAddChannel: (
    category: "text" | "voice",
    type: "text" | "voice",
    name: string,
  ) => void;
  category: "text" | "voice";
}

export default function AddChannelPopup({
  isOpen,
  onClose,
  onAddChannel,
  category,
}: AddChannelPopupProps) {
  const [type, setType] = useState<"text" | "voice">("text");
  const [name, setName] = useState("");

  const modalRef = useRef<HTMLDivElement>(null);

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!name.trim()) return;
    onAddChannel(category, type, name.trim());
    setName("");
    setType("text");
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div ref={modalRef} className="bg-white rounded-lg p-6 w-120 shadow-lg">
        <h2 className="text-2xl font-medium mb-4 text-[#323339] tracking-wide">
          Create Channel
        </h2>

        {/* Channel Type Section */}
        <div className="mb-6">
          <label className="block text-lg font-base mb-2 text-[#222831] tracking-wide">
            Channel Type
          </label>
          <div className="flex flex-col gap-3">
            {/* Text Channel */}
            <div
              onClick={() => setType("text")}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition text-[#222831] tracking-wide
                                ${type === "text" ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:bg-gray-100"}`}
            >
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center text-[#222831] tracking-wide
                                    ${type === "text" ? "border-blue-500" : "border-gray-400"}`}
              >
                {type === "text" && (
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                )}
              </div>
              <FaHashtag className="text-[#7d7e82] w-6 h-6" />
              <div>
                <div className="font-base text-lg text-[#7d7e82]">Text</div>
                <div className="text-sm text-gray-500">
                  Send messages, images, GIFs, and more
                </div>
              </div>
            </div>

            {/* Voice Channel */}
            <div
              onClick={() => setType("voice")}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition
                                ${type === "voice" ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:bg-gray-100"}`}
            >
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center
                                    ${type === "voice" ? "border-blue-500" : "border-gray-400 hover:bg-[#efefef]"}`}
              >
                {type === "voice" && (
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                )}
              </div>
              <HiSpeakerWave className="text-[#7d7e82] w-6 h-6" />
              <div>
                <div className="text-lg font-base text-[#7d7e82]">Voice</div>
                <div className="text-sm text-[#7d7e82]">
                  Hang out with voice, video, and screen share
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Channel Name Input */}
        <div className="mb-6">
          <label className="block text-lg font-base mb-2 text-[#222831] tracking-wide">
            Channel Name
          </label>
          <div className="flex items-center border border-gray-300 rounded-lg py-1 px-2">
            {type === "text" ? (
              <FaHashtag className="text-[#2f3035] w-5 h-5" />
            ) : (
              <HiSpeakerWave className="text-[#2f3035] w-5 h-5" />
            )}
            <input
              type="text"
              value={name}
              onKeyDown={handleKeyDown}
              onChange={(e) => setName(e.target.value)}
              placeholder="new-channel"
              className="w-full p-2 outline-none text"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-between gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 cursor-pointer"
          >
            Create Channel
          </button>
        </div>
      </div>
    </div>
  );
}
