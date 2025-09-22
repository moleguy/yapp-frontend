"use client";

import React, { useState, useEffect, useRef } from "react";
import PollPopup from "@/app/(main)/components/PollPopup";
import { FiSend } from "react-icons/fi";
import { BiPoll } from "react-icons/bi";
import { FaPlus } from "react-icons/fa6";
import { MdOutlineDriveFolderUpload } from "react-icons/md";
import { useAuth } from "@/app/contexts/AuthContext";

type Message = {
  sender: string;
  text: string;
};

type Server = {
  id: number;
  name: string;
  image?: string;
};

type ChatAreaProps = {
  serverName: string;
  channelName: string;
};

export default function ChatArea({ serverName, channelName }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [showPollPopup, setShowPollPopup] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [activeServer, setActiveServer] = useState<Server | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const uploadRef = useRef<HTMLDivElement | null>(null);

  const { user } = useAuth();

  // scroll to bottom when new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = () => {
    if (!messageInput.trim()) return;
    setMessages([
      ...messages,
      { sender: user?.username || "Unknown", text: messageInput.trim() },
    ]);
    setMessageInput("");
    setShowWelcome(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  // handling poll logic after creation
  const handleCreatePoll = (question: string, options: string[]) => {
    console.log("Poll created:", { question, options });
  };

  useEffect(() => {
    if (!showPopup) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (uploadRef.current && uploadRef.current.contains(e.target as Node)) {
        return;
      }
      setShowPopup(false);
    };
    window.addEventListener("mousedown", handleClickOutside);

    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [showPopup]);

  return (
    <div className="flex flex-col  h-full">
      {/* Messages area */}
      <div className="flex flex-1 flex-col-reverse overflow-y-auto p-2">
        {/*{showWelcome && (*/}
        {/*    <div className="text-center text-gray-600 my-8">*/}
        {/*        <h2 className="text-2xl font-semibold">*/}
        {/*            Welcome to "{serverName}"*/}
        {/*        </h2>*/}
        {/*        <p className="text-gray-500">This is the beginning of #{channelName}</p>*/}
        {/*    </div>*/}
        {/*)}*/}
        {/*{messages.map((msg, idx) => (*/}
        {/*    <div key={idx} className="mb-2">*/}
        {/*        <span className="font-medium text-[#1e1e1e]">{msg.sender}:</span> {msg.text}*/}
        {/*    </div>*/}
        {/*))}*/}
        {/*<div ref={messagesEndRef}></div>*/}
      </div>

      {/* Input */}
      <div className="relative flex items-center p-4">
        <button className="absolute left-6 text-gray-500 hover:text-black cursor-pointer">
          <FaPlus
            onClick={() => setShowPopup(!showPopup)}
            className="p-2 w-10 h-10 hover:bg-[#d3d3d7] rounded-lg"
          />
        </button>
        {showPopup && (
          <div
            ref={uploadRef}
            className={`absolute bottom-14 left-0 bg-[#ffffff] border border-gray-300 rounded-lg shadow-lg w-50 p-2`}
          >
            <button
              className="flex items-center gap-1 text-[#2f3035] w-full text-left px-2 py-2 hover:bg-[#f2f2f3] rounded-lg font-base tracking-wide cursor-pointer"
              onClick={() => {
                setShowPopup(false);
                console.log("Upload File clicked");
              }}
            >
              <MdOutlineDriveFolderUpload
                className={`w-8 h-8 text-[#2f3035]`}
              />{" "}
              Upload File
            </button>
            <button
              className="w-full text-left px-2 py-2 hover:bg-[#f2f2f3] flex items-center gap-1 text-[#2f3035] font-base tracking-wide rounded-lg cursor-pointer"
              onClick={() => {
                setShowPopup(false);
                setShowPollPopup(true);
              }}
            >
              <BiPoll className={`w-8 h-8 text-[#2f3035]`} /> Create Poll
            </button>
          </div>
        )}
        {showPollPopup && (
          <PollPopup
            onClose={() => setShowPollPopup(false)}
            onCreate={handleCreatePoll}
          />
        )}
        {/* input */}
        <input
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message ${activeServer?.name || ""}`}
          className="w-full pl-14 pr-12 py-4 rounded-xl border border-[#dcd9d3] focus:outline-none"
        />
        {/* send button */}
        <button
          onClick={sendMessage}
          className="absolute right-8 text-gray-500 hover:text-black cursor-pointer"
        >
          <FiSend size={22} />
        </button>
      </div>
    </div>
  );
}
