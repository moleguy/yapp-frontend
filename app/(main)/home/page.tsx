'use client';

import { useState, useEffect, useCallback } from "react";
import { BiSolidMicrophone, BiSolidMicrophoneOff } from "react-icons/bi";
import { RiUser6Fill } from "react-icons/ri";
import { IoIosSearch, IoIosClose } from "react-icons/io";
import SettingsPopup from "../components/SettingsPopup";
import ServerList from "../components/ServerList";

export default function HomePage() {
  const [showMicrophone, setShowMicrophone] = useState(true);
  const [preview, setPreview] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("Manish");
  const [username, setUsername] = useState("moleguy5");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [query, setQuery] = useState("");
  // const [selectedServer, setSelectedServer] = useState<Server | null>(null);

  // loading profile from localStorage
  const loadProfile = useCallback(() => {
    const saved = localStorage.getItem("userProfile");
    if (saved) {
      const parsed = JSON.parse(saved);
      setPreview(parsed.preview || null);
      setDisplayName(parsed.user?.displayName || "Manish");
      setUsername(parsed.user?.username || "moleguy5");
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if(!settingsOpen) {
      loadProfile();
    }
  }, [settingsOpen, loadProfile]);

  return (
    <div className="flex h-screen bg-black text-black font-MyFont">
      <div className="w-full flex m-4 bg-[#EAE4D5] rounded-lg">
        {/* Server Side*/}
        <div className="flex flex-col justify-between items-center w-[350px] bg-[#EBEBEB] rounded-l-lg">

          {/* servers, channels etc... */}
          <ServerList />

          <div className={`h-full w-full m-6 border rounded-xl border-[#dcd9d3]`}>

          </div>
          {/* call, profile and settings */}
          <div className="flex w-[320px] m-3 border-3 py-2 px-2 bg-white border-[#D4C9BE] rounded-xl select-none">
            <div className="w-1/2 flex items-center w-full hover:bg-[#ebebed] p-1 hover:rounded-lg cursor-pointer">
              <div className="flex justify-center items-center w-12 h-12 border border-[#B6B09F] rounded-full overflow-hidden">
                {preview ? (
                  <img src={preview} alt="Profile" className="w-full h-full object-cover"/>
                ) : (
                  <RiUser6Fill size={32} />
                )}
              </div>
              <div className="ml-2 font-MyFont text-[#393E46]">
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-sm">#{username}</p>
              </div>
            </div>
            <div className="w-1/2 flex items-center justify-around">
              <div
                className={`cursor-pointer flex justify-center items-center p-2 rounded-lg ${
                  showMicrophone ? "hover:bg-[#dfdfe1]" : "bg-[#ebc8ca] text-[#cb3b40]"
                } transition-colors`}
                onClick={() => setShowMicrophone(!showMicrophone)}
              >
                <style>
                  {`
                    @keyframes sway {
                      0%, 100% {transform: rotate(0deg); }
                      25% {transform: rotate(-15deg); }
                      75% {transform: rotate(15deg); }
                    }
                    .sway-hover:hover {
                      animation: rotate 0.4s ease-in-out;
                    }
                  `}
                </style>
                {showMicrophone ? (
                  <BiSolidMicrophone size={28} className="sway-hover text-gray-500 hover:text-[#1e1e1e]" />
                ) : (
                  <BiSolidMicrophoneOff size={28} className="sway-hover" />
                )}
              </div>
              <div className="flex justify-center items-center p-2 rounded-lg hover:bg-[#dfdfe1]">
                <SettingsPopup isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} onOpen={()=> setSettingsOpen(true)}/>
              </div>
            </div>
          </div>
        </div>

        {/* main section */}
        <div className="relative flex flex-2 flex-col justify-between bg-white border-r border-gray-300 ">
          <div></div>
          <p>iaubsiub</p>
          <div className={`flex`}>
            <input
              className={` w-full py-6 px-4 m-4 focus:outline-none rounded-xl bottom-10 border border-[#dcd9d3]`}
            />
          </div>
        </div>

        {/* Search and Server Members Group*/}
        <div className="relative flex flex-col w-[400px] bg-white rounded-r-lg p-4 ">
          <div className={`relative flex justify-center items-center`}>
            <input
                className={`w-full border bg-[#e7e7e7] border-[#dcd9d3] rounded-xl py-2 px-2 focus:outline-none`}
                placeholder={`Search...`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />

            <button
                onClick={() => {
                  if (query) setQuery("");
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
            >
              {query ? (
                  <IoIosClose className="w-7 h-7" />
              ) : (
                  <IoIosSearch className="w-6 h-6" />
              )}
            </button>
          </div>
          <div className="flex items-center my-2 w-full" role="separator" aria-label="or">
            <div className="flex-grow h-px bg-gray-600 opacity-35 mt-2 mb-2" />
          </div>
        </div>
      </div>
    </div>
  );
}
