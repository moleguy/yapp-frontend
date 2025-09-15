'use client';

import { useCallback, useEffect, useState } from "react";
import { BiSolidMicrophone, BiSolidMicrophoneOff } from "react-icons/bi";
import { RiUser6Fill } from "react-icons/ri";
import SettingsPopup from "../components/SettingsPopup";
import ServerList from "../components/ServerList";
import { useAuth } from "../../contexts/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";

export default function HomePage() {
    const { user } = useAuth();
    const [showMicrophone, setShowMicrophone] = useState(true);
    const [preview, setPreview] = useState<string | null>(null);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [displayName, setDisplayName] = useState(user?.display_name);
    const [username, setUsername] = useState(user?.username);


    // loading profile from localStorage
    const loadProfile = useCallback(() => {
        const saved = localStorage.getItem("userProfile");
        if (saved) {
            const parsed = JSON.parse(saved);
            setPreview(parsed.preview || null);
        }
        setDisplayName(user?.display_name);
        setUsername(user?.username);
    }, [user?.username, user?.display_name]);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    // useEffect(() => {
    //     console.log("user from context:", user);
    //     loadProfile();
    // }, [loadProfile, user]);

    useEffect(() => {
        if (!settingsOpen) {
            loadProfile();
        }
    }, [settingsOpen, loadProfile]);

    return (
        <ProtectedRoute>
            <div className="flex h-screen bg-white text-black font-MyFont">
                <div className="w-full flex m-4 bg-[#EAE4D5] rounded-lg">
                    <div className="flex flex-col justify-between items-center w-[350px] bg-[#EBEBEB] rounded-l-lg">

                        {/* servers, channels etc... */}
                        <ServerList />

                        {/* call, profile and settings */}
                        <div
                            className="flex w-[320px] m-3 border-3 py-3 px-3 bg-white border-[#D4C9BE] rounded-xl select-none">
                            <div
                                className="flex items-center w-full hover:bg-[#ebebed] p-1 hover:rounded-lg cursor-pointer">
                                <div
                                    className="flex justify-center items-center w-12 h-12 border border-[#B6B09F] rounded-full overflow-hidden">
                                    {preview ? (
                                        <img src={preview} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <RiUser6Fill size={32} />
                                    )}
                                </div>
                                <div className="ml-2 font-MyFont text-[#393E46]">
                                    <p className="text-sm font-medium">{displayName}</p>
                                    <p className="text-sm">@{username}</p>
                                </div>
                            </div>
                            <div className="w-1/2 flex items-center justify-around">
                                <div
                                    className={`cursor-pointer flex justify-center items-center p-2 rounded-lg ${showMicrophone ? "hover:bg-[#dfdfe1]" : "bg-[#ebc8ca] text-[#cb3b40]"
                                        } transition-colors`}
                                    onClick={() => setShowMicrophone(!showMicrophone)}
                                >
                                    <style>
                                        {`slkdb  V
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
                                        <BiSolidMicrophone size={28}
                                            className="sway-hover text-gray-500 hover:text-[#1e1e1e]" />
                                    ) : (
                                        <BiSolidMicrophoneOff size={28} className="sway-hover" />
                                    )}
                                </div>
                                <div className="flex justify-center items-center p-2 rounded-lg hover:bg-[#dfdfe1]">
                                    <SettingsPopup isOpen={settingsOpen} onClose={() => setSettingsOpen(false)}
                                        onOpen={() => setSettingsOpen(true)} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* main section */}
                    <div className="flex flex-2 flex-col">
                        <p>iaubsiub</p>
                        <p>iaubsiub</p>
                    </div>

                    <div className="flex w-[400px] bg-[#F2F2F2] rounded-r-lg"><p>iaubsiub</p></div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
