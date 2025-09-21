"use client";

import React, { useEffect, useState, useRef } from "react";
import { IoIosClose } from "react-icons/io";
import { FaChevronRight } from "react-icons/fa";
import Image from "next/image";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, image?: string) => void;
  onJoin: (link: string) => void;
};

export default function AddServerPopup({
  isOpen,
  onClose,
  onCreate,
  onJoin,
}: Props) {
  const [step, setStep] = useState<"choice" | "create" | "join">("choice");
  const [serverName, setServerName] = useState("");
  const [serverImage, setServerImage] = useState<string | undefined>();
  const [inviteLink, setInviteLink] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const serverRef = useRef<HTMLDivElement | null>(null);
  const createInputRef = useRef<HTMLInputElement | null>(null);
  const joinInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB
        setErrorMessage("File size too big! Please select an image under 5MB.");
        setTimeout(() => setErrorMessage(null), 3000);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setServerImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onCreate(serverName, serverImage);
      onClose();
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (serverRef.current && !serverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setStep("choice");
      setServerName("");
      setServerImage(undefined);
      setInviteLink("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (step === "create" && createInputRef.current) {
      createInputRef.current.focus();
    }
    if (step === "join" && joinInputRef.current) {
      joinInputRef.current.focus();
    }
  }, [step]);

  useEffect(() => {
    if (!isOpen || step !== "create") return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (!serverName.trim()) {
          setErrorMessage("Server name is required.");
          setTimeout(() => setErrorMessage(null), 3000);
          return;
        }
        onCreate(serverName, serverImage);
        onClose();
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isOpen, step, serverName, serverImage, onCreate, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      {/* choosing an option over create and join */}
      {step === "choice" && (
        <div
          ref={serverRef}
          className="relative flex flex-col bg-white rounded-xl p-6 w-[400px] h-[270px] text-center"
        >
          <h2 className="flex text-xl text-[#323339] tracking-wide mb-4">
            Create your server
          </h2>
          <button
            onClick={onClose}
            className="absolute top-3 right-2 text-gray-500 hover:text-black text-3xl cursor-pointer"
          >
            <IoIosClose className="w-8 h-8 text-black" />
          </button>

          <div className="flex flex-col gap-3 justify-start items-center h-full">
            <div className="flex flex-col w-full">
              <button
                onClick={() => setStep("create")}
                className="py-3 px-4 rounded-lg border bg-[#f2f2f3] border-[#dcd9d3] flex justify-between items-center cursor-pointer"
              >
                Create My Own
                <FaChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div
              className="flex items-center my-2 w-full"
              role="separator"
              aria-label="or"
            >
              <div className="flex-grow h-px bg-gray-600 opacity-35" />
            </div>
            <div className="flex flex-col w-full">
              <p className="text-start text-[#323339] text-xl tracking-wide">
                Already have an invite?
              </p>
              <button
                onClick={() => setStep("join")}
                className="py-3 px-4 rounded-lg border bg-[#f2f2f3] border-[#dcd9d3] flex justify-between items-center mt-2 cursor-pointer"
              >
                Join a server
                <FaChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* creating a server */}
      {step === "create" && (
        <div
          ref={serverRef}
          className="relative flex flex-col bg-white rounded-xl p-6 w-[450px] h-[400px] text-center"
        >
          <div className={`h-full flex flex-col justify-between`}>
            <div>
              <h2 className="text-xl font-medium tracking-wide mb-2">
                Modify Your Server
              </h2>
              <p className="text-[#73726e] mb-4">
                Configure your new server with a name and an icon.
              </p>

              <div className="relative mt-2 mb-3">
                {serverImage ? (
                  <Image
                    src={serverImage}
                    alt="Server Preview"
                    className="w-20 h-20 rounded-full object-cover mx-auto cursor-pointer"
                    onClick={() => setServerImage(undefined)}
                    title="Click to remove/change"
                  />
                ) : (
                  <label className="w-20 h-20 bg-gray-500 rounded-full flex items-center justify-center cursor-pointer mx-auto">
                    <span className="text-white text-2xl">+</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
                {/* error message under image */}
                {errorMessage && (
                  <p className="text-red-500 text-sm mt-2 text-center">
                    {errorMessage}
                  </p>
                )}
              </div>
              <p className={`text-left font-light tracking-wide`}>
                Server Name
              </p>
              <input
                ref={createInputRef}
                type="text"
                placeholder="Server Name"
                value={serverName}
                // onKeyDown={handleKeyDown}
                onChange={(e) => setServerName(e.target.value)}
                className="w-full border-2 rounded-lg py-2 px-3 mt-1 border-[#dcd9d3] focus:outline-none focus:border-[#6090eb]"
              />
              <p className={`font-thin text-sm text-left mt-2 text-[#73726e]`}>
                Craft a unique name for your server
              </p>
            </div>
            <div className="flex gap-2 justify-between">
              <button
                onClick={() => setStep("choice")}
                className="py-2 px-4 rounded-lg text-gray-600 cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={() => {
                  if (serverName.trim()) {
                    onCreate(serverName, serverImage);
                    onClose();
                  }
                }}
                className="py-2 px-6 rounded-lg bg-[#6164f2] hover:bg-[#4c52bd] text-white cursor-pointer"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* joining a server */}
      {step === "join" && (
        <div
          ref={serverRef}
          className="relative flex flex-col bg-white rounded-xl p-6 w-[380px] h-[220px] text-center"
        >
          <h2 className="text-lg font-semibold mb-4">Join Server</h2>
          <input
            ref={joinInputRef}
            type="text"
            placeholder="Invite Link"
            value={inviteLink}
            onChange={(e) => setInviteLink(e.target.value)}
            className="w-full border rounded-lg p-2 mb-3 border-[#dcd9d3] focus:outline-none"
          />
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setStep("choice")}
              className="py-2 px-4 rounded-lg bg-gray-300 text-gray-600"
            >
              Back
            </button>
            <button
              onClick={() => {
                if (inviteLink.trim()) {
                  onJoin(inviteLink);
                  onClose();
                }
              }}
              className="py-2 px-4 rounded-lg bg-[#b6b09f] hover:bg-[#a19a87] text-white"
            >
              Join
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
