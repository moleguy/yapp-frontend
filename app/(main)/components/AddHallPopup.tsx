"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { IoIosClose } from "react-icons/io";
import { FaChevronRight } from "react-icons/fa";
import Image from "next/image";
import Modal from "./Modal";

type Props = {
  initialStep?: "choice" | "create" | "join";
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, imageString?: string) => void;
  onJoin: (link: string) => void;
  joinError?: string | null;
  isJoining?: boolean;
};

export default function AddHallPopup({
  isOpen,
  onClose,
  onCreate,
  onJoin,
  initialStep = "choice",
  joinError = null,
  isJoining = false,
}: Props) {
  const [step, setStep] = useState<"choice" | "create" | "join">(initialStep);
  const [hallName, setHallName] = useState("");
  const [hallImage, setHallImage] = useState<string | undefined>();
  const [inviteLink, setInviteLink] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const createInputRef = useRef<HTMLInputElement | null>(null);
  const joinInputRef = useRef<HTMLInputElement | null>(null);

  const MIN_LENGTH = 3;
  const MAX_LENGTH = 32;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage("File size too big! Please select an image under 5MB.");
        setTimeout(() => setErrorMessage(null), 3000);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setHallImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleHallNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHallName(value);

    const spaceCount = (value.match(/ /g) || []).length;

    if (!value.trim()) {
      setNameError("Hall name is required");
    } else if (spaceCount > 1) {
      setNameError("Hall name can only contain one space");
    } else if (value.length < MIN_LENGTH) {
      setNameError(`Hall name must be at least ${MIN_LENGTH} characters.`);
    } else if (value.length > MAX_LENGTH) {
      setNameError(`Hall name cannot exceed ${MAX_LENGTH} characters.`);
    } else {
      setNameError(null);
    }
  };

  const handleCreateHall = useCallback(() => {
    const spaceCount = (hallName.match(/ /g) || []).length;

    if (!hallName.trim()) {
      setNameError("Hall name is required");
      return;
    }

    if (spaceCount > 1) {
      setNameError("Hall name can only contain one space");
      return;
    }

    if (hallName.length < MIN_LENGTH) {
      setNameError(`Hall name must be at least ${MIN_LENGTH} characters.`);
      return;
    }

    if (hallName.length > MAX_LENGTH) {
      setNameError(`Hall name cannot exceed ${MAX_LENGTH} characters.`);
      return;
    }

    setNameError(null);
    onCreate(hallName, hallImage);
    onClose();
  }, [hallName, hallImage, onCreate, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreateHall();
    }
  };

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStep(initialStep);
    }
  }, [isOpen, initialStep]);

  useEffect(() => {
    if (!isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStep("choice");
      setHallName("");
      setHallImage(undefined);
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
  }, [step, handleCreateHall]);

  useEffect(() => {
    if (!isOpen || step !== "create") return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleCreateHall();
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isOpen, step, handleCreateHall]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} panelClassName="bg-surface-card rounded-xl shadow-lg">
      {step === "choice" && (
        <div className="relative flex flex-col p-6 w-[420px] text-center">
          <label className="text-start text-xl text-popup-heading tracking-wide mb-4">
            Create your hall
          </label>
          <button
            onClick={onClose}
            className="absolute top-3 right-2 text-list-muted hover:text-heading text-3xl cursor-pointer"
          >
            <IoIosClose className="w-8 h-8 text-heading" />
          </button>

          <div className="flex flex-col gap-3 justify-start items-center h-full">
            <div className="flex flex-col w-full">
              <button
                onClick={() => setStep("create")}
                className="py-3 px-4 rounded-lg border bg-surface-muted border-default flex justify-between items-center cursor-pointer tracking-wide"
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
              <div className="flex-grow h-px bg-divider opacity-35" />
            </div>
            <div className="flex flex-col w-full">
              <label className="text-start text-popup-heading text-xl tracking-wide mb-4">
                Already have an invite?
              </label>
              <button
                onClick={() => setStep("join")}
                className="py-3 px-4 rounded-lg border bg-surface-muted border-default flex justify-between items-center cursor-pointer tracking-wide"
              >
                Join a hall
                <FaChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "create" && (
        <div className="relative flex flex-col p-6 w-[450px] h-[400px] text-center">
          <div className={`h-full flex flex-col justify-between`}>
            <div>
              <h2 className="text-xl font-medium tracking-wide">
                Modify Your Hall
              </h2>
              <p className="text-list-muted mb-4">
                Configure your new hall with a name and a hall profile picture.
              </p>

              <div className="relative mt-2 mb-5">
                {hallImage ? (
                  <Image
                    src={hallImage}
                    alt="Hall profile picture preview"
                    width={90}
                    height={90}
                    className="w-20 h-20 rounded-full object-cover mx-auto cursor-pointer"
                    onClick={() => setHallImage(undefined)}
                    title="Click to remove or change hall profile picture"
                  />
                ) : (
                  <label className="w-20 h-20 bg-surface-strong rounded-full flex items-center justify-center cursor-pointer mx-auto">
                    <span className="text-white text-2xl">+</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
                {errorMessage && (
                  <p className="text-red-500 text-sm mt-2 text-center">
                    {errorMessage}
                  </p>
                )}
              </div>
              <p
                className={`text-left text-heading font-light tracking-wide`}
              >
                Hall Name
              </p>
              <input
                ref={createInputRef}
                type="text"
                placeholder="Hall name"
                value={hallName}
                onChange={handleHallNameChange}
                onKeyDown={handleKeyDown}
                maxLength={MAX_LENGTH}
                className={`w-full border-2 rounded-lg py-2 px-3 mt-1 border-default focus:outline-none focus:border-input-focus tracking-wide ${nameError ? "border-red-500" : ""
                  }`}
              />
              {nameError && (
                <p className="text-red-500 text-sm mt-1 text-left">
                  {nameError}
                </p>
              )}
              <p
                className={`font-thin text-sm text-left mt-2 text-list-muted tracking-wide`}
              >
                Craft a unique name for your hall (max one space allowed)
              </p>
            </div>
            <div className="flex gap-2 justify-between">
              <button
                onClick={() => setStep("choice")}
                className="py-2 px-4 rounded-lg text-cancel cursor-pointer hover:underline"
              >
                Back
              </button>
              <button
                onClick={handleCreateHall}
                disabled={!!nameError || !hallName.trim()}
                className={`py-2 px-6 rounded-lg text-white cursor-pointer ${nameError || !hallName.trim()
                  ? "bg-surface-disabled cursor-not-allowed hover:cursor-default"
                  : "bg-primary hover:bg-primary-hover"
                  }`}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "join" && (
        <div className="relative flex flex-col p-6 w-[380px] text-center">
          <label className="text-2xl font-medium tracking-wide">
            Join a hall
          </label>
          <label className={`text-sm text-label mb-4`}>
            Enter an invite code below to join an existing hall
          </label>
          <div
            className={`flex flex-col justify-center items-start gap-2 mb-5`}
          >
            <label className={`text-label`}>Invite code</label>
            <input
              ref={joinInputRef}
              type="text"
              placeholder="Invite Code"
              value={inviteLink}
              onChange={(e) => setInviteLink(e.target.value)}
              disabled={isJoining}
              className="w-full border rounded-lg p-2 mb-3 border-default focus:outline-none disabled:opacity-50"
            />
            {joinError && (
              <p className="text-red-500 text-sm w-full">
                {joinError}
              </p>
            )}
          </div>
          <div className="flex gap-2 justify-between">
            <button
              onClick={() => setStep("choice")}
              disabled={isJoining}
              className="py-2 px-4 rounded-lg text-cancel cursor-pointer hover:underline disabled:opacity-50"
            >
              Back
            </button>
            <button
              onClick={() => {
                if (inviteLink.trim()) {
                  onJoin(inviteLink);
                }
              }}
              disabled={isJoining || !inviteLink.trim()}
              className={`py-2 px-5 rounded-lg text-white cursor-pointer ${isJoining || !inviteLink.trim()
                  ? "bg-surface-disabled cursor-not-allowed"
                  : "bg-primary hover:bg-primary-hover"
                }`}
            >
              {isJoining ? "Joining..." : "Join Hall"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
