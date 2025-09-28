"use client";

import React, { useEffect, useState, useRef } from "react";
import { IoIosClose } from "react-icons/io";
import { FaChevronRight } from "react-icons/fa";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, imageString?: string) => void;
  onJoin: (link: string) => void;
  initialStep?: "choice" | "create" | "join";
};

export default function AddServerPopup({
                                         isOpen,
                                         onClose,
                                         onCreate,
                                         onJoin,
                                         initialStep = "choice",
                                       }: Props) {
  const [step, setStep] = useState<"choice" | "create" | "join">(initialStep);
  const [serverName, setServerName] = useState("");
  const [serverImage, setServerImage] = useState<string | undefined>();
  const [inviteLink, setInviteLink] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
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

  const handleServerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setServerName(value);

    // counting spaces in the input
    const spaceCount = (value.match(/ /g) || []).length;

    if (spaceCount > 1) {
      setNameError("Server name can only contain one space");
    } else {
      setNameError(null);
    }
  };

  const handleCreateServer = () => {
    // validation before creating a hall with only one space
    const spaceCount = (serverName.match(/ /g) || []).length;

    if (spaceCount > 1) {
      setNameError("Server name can only contain one space");
      return;
    }

    if (!serverName.trim()) {
      setNameError("Server name is required");
      return;
    }

    onCreate(serverName, serverImage);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreateServer();
    }
  };

  useEffect(() => {
    if (isOpen) {
      setStep(initialStep);
    }
  }, [isOpen, initialStep]);

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
      setNameError(null);
      setErrorMessage(null);
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
        handleCreateServer();
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isOpen, step, serverName, serverImage]);

  if (!isOpen) return null;

  return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
        {/* choosing an option over create and join */}
        {step === "choice" && (
            <div
                ref={serverRef}
                className="relative flex flex-col bg-white rounded-xl p-6 w-[420px] text-center"
            >
              <label className="text-start text-xl text-[#323339] tracking-wide mb-4">
                Create your server
              </label>
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
                      className="py-3 px-4 rounded-lg border bg-[#f2f2f3] border-[#dcd9d3] flex justify-between items-center cursor-pointer tracking-wide"
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
                  <label className="text-start text-[#323339] text-xl tracking-wide mb-4">
                    Already have an invite?
                  </label>
                  <button
                      onClick={() => setStep("join")}
                      className="py-3 px-4 rounded-lg border bg-[#f2f2f3] border-[#dcd9d3] flex justify-between items-center cursor-pointer tracking-wide"
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
                  <h2 className="text-xl font-medium tracking-wide">
                    Modify Your Server
                  </h2>
                  <p className="text-[#73726e] mb-4">
                    Configure your new server with a name and an icon.
                  </p>

                  <div className="relative mt-2 mb-5">
                    {serverImage ? (
                        <img
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
                  <p
                      className={`text-left text-[#1e1e1e] font-light tracking-wide`}
                  >
                    Server Name
                  </p>
                  <input
                      ref={createInputRef}
                      type="text"
                      placeholder="Server Name"
                      value={serverName}
                      onChange={handleServerNameChange}
                      onKeyDown={handleKeyDown}
                      className={`w-full border-2 rounded-lg py-2 px-3 mt-1 border-[#dcd9d3] focus:outline-none focus:border-[#6090eb] tracking-wide ${
                          nameError ? "border-red-500" : ""
                      }`}
                  />
                  {nameError && (
                      <p className="text-red-500 text-sm mt-1 text-left">
                        {nameError}
                      </p>
                  )}
                  <p
                      className={`font-thin text-sm text-left mt-2 text-[#73726e] tracking-wide`}
                  >
                    Craft a unique name for your server (max one space allowed)
                  </p>
                </div>
                <div className="flex gap-2 justify-between">
                  <button
                      onClick={() => setStep("choice")}
                      className="py-2 px-4 rounded-lg text-[#7e7f83] cursor-pointer hover:underline"
                  >
                    Back
                  </button>
                  <button
                      onClick={handleCreateServer}
                      disabled={!!nameError || !serverName.trim()}
                      className={`py-2 px-6 rounded-lg text-white cursor-pointer ${
                          nameError || !serverName.trim()
                              ? "bg-gray-400 cursor-not-allowed hover:cursor-default"
                              : "bg-[#6164f2] hover:bg-[#4c52bd]"
                      }`}
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
                className="relative flex flex-col bg-white rounded-xl p-6 w-[380px] text-center"
            >
              <label className="text-2xl font-medium tracking-wide">
                Join a server
              </label>
              <label className={`text-sm text-[#525358] mb-4`}>
                Enter a link below to join an existing server
              </label>
              <div
                  className={`flex flex-col justify-center items-start gap-2 mb-5`}
              >
                <label className={`text-[#525358]`}>Invite link</label>
                <input
                    ref={joinInputRef}
                    type="text"
                    placeholder="Invite Link"
                    value={inviteLink}
                    onChange={(e) => setInviteLink(e.target.value)}
                    className="w-full border rounded-lg p-2 mb-3 border-[#dcd9d3] focus:outline-none"
                />
              </div>
              <div className="flex gap-2 justify-between">
                <button
                    onClick={() => setStep("choice")}
                    className="py-2 px-4 rounded-lg text-[#7e7f83] cursor-pointer hover:underline"
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
                    className="py-2 px-5 rounded-lg bg-[#6164f2] hover:bg-[#4c52bd] text-white cursor-pointer"
                >
                  Join Server
                </button>
              </div>
            </div>
        )}
      </div>
  );
}