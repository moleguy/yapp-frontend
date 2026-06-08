"use client";

import React, { useState } from "react";
import { FaHashtag } from "react-icons/fa";
import { HiSpeakerWave } from "react-icons/hi2";
import { RoomType } from "@/lib/api";
import Modal from "./Modal";

export interface AddRoomPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRoom: (
    name: string,
    type: RoomType,
    isPrivate: boolean
  ) => void;
  floorName?: string;
}

export default function AddRoomPopup({
  isOpen,
  onClose,
  onAddRoom,
  floorName,
}: AddRoomPopupProps) {
  const [type, setType] = useState<RoomType>("text");
  const [name, setName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onAddRoom(name.trim(), type, isPrivate);
    setName("");
    setType("text");
    setIsPrivate(false);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      panelClassName="bg-surface-card rounded-lg p-6 w-120 shadow-lg"
    >
      <h2 className="text-2xl font-medium mb-4 text-popup-heading tracking-wide">
        Create Room {floorName ? `in ${floorName}` : ""}
      </h2>

      <div className="mb-6">
        <label className="block text-lg font-base mb-2 text-list-emphasis tracking-wide">
          Room Type
        </label>
        <div className="flex flex-col gap-3">
          <div
            onClick={() => setType("text")}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition text-list-emphasis tracking-wide
              ${type === "text" ? "border-primary bg-primary-muted" : "border-neutral hover:bg-surface-inset"}`}
          >
            <div
              className={`w-4 h-4 rounded-full border flex items-center justify-center text-list-emphasis tracking-wide
                ${type === "text" ? "border-primary" : "border-neutral"}`}
            >
              {type === "text" && (
                <div className="w-2 h-2 rounded-full bg-primary"></div>
              )}
            </div>
            <FaHashtag className="text-icon-muted w-6 h-6" />
            <div>
              <div className="font-base text-lg text-icon-muted">Text</div>
              <div className="text-sm text-list-muted">
                Send messages, images, GIFs, and more
              </div>
            </div>
          </div>

          <div
            onClick={() => setType("audio")}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition
              ${type === "audio" ? "border-primary bg-primary-muted" : "border-neutral hover:bg-surface-inset"}`}
          >
            <div
              className={`w-4 h-4 rounded-full border flex items-center justify-center
                ${type === "audio" ? "border-primary" : "border-neutral hover:bg-list-hover"}`}
            >
              {type === "audio" && (
                <div className="w-2 h-2 rounded-full bg-primary"></div>
              )}
            </div>
            <HiSpeakerWave className="text-icon-muted w-6 h-6" />
            <div>
              <div className="text-lg font-base text-icon-muted">Audio</div>
              <div className="text-sm text-icon-muted">
                Hang out with voice, video, and screen share
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-lg font-base mb-2 text-list-emphasis tracking-wide">
          Room Name
        </label>
        <div className="flex items-center border border-neutral rounded-lg py-1 px-2">
          {type === "text" ? (
            <FaHashtag className="text-icon w-5 h-5" />
          ) : (
            <HiSpeakerWave className="text-icon w-5 h-5" />
          )}
          <input
            type="text"
            value={name}
            onKeyDown={handleKeyDown}
            onChange={(e) => setName(e.target.value)}
            placeholder="new-room"
            className="w-full p-2 outline-none text"
          />
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-lg font-base text-list-emphasis tracking-wide">Private Room</span>
          <span className="text-sm text-list-muted">Only selected members and roles will be able to view this room.</span>
        </div>
        <input
          type="checkbox"
          checked={isPrivate}
          onChange={(e) => setIsPrivate(e.target.checked)}
          className="w-5 h-5"
        />
      </div>

      <div className="flex justify-between gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg bg-surface-control hover:bg-surface-neutral cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover cursor-pointer"
        >
          Create Room
        </button>
      </div>
    </Modal>
  );
}
