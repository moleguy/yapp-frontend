"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import classNames from "classnames";
import {
  IoSettings,
  IoSettingsOutline,
  IoLockClosed,
  IoLockClosedOutline,
  IoNotifications,
  IoNotificationsOutline,
} from "react-icons/io5";
import { IoIosClose } from "react-icons/io";
import { HiOutlineUser, HiUser } from "react-icons/hi2";
import { HiOutlinePaintBrush, HiPaintBrush } from "react-icons/hi2";
import { MdOutlineSdStorage, MdSdStorage } from "react-icons/md";
import ThemeDropDown from "./ThemeDropDown";
import TextSizeDropDown from "./TextSizeDropDown";
import { NotificationSettings } from "./NotificationSettings";
import ProfileSettings from "./ProfileSettings";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const mediaOptions = ["Photos", "Audio", "Video", "Document"];
  const [activeTab, setActiveTab] = useState("General");
  const [selected, setSelected] = useState<string[]>([]);
  const settingsRef = useRef<HTMLDivElement | null>(null);

  const handleClose = useCallback(() => {
    if (typeof onClose === "function") {
      onClose();
    } else {
      console.warn("onClose is not a function");
    }
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(e.target as Node)
      ) {
        handleClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, handleClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, handleClose]);

  const toggleOption = (option: string) => {
    setSelected((prev) =>
      prev.includes(option)
        ? prev.filter((o) => o !== option)
        : [...prev, option],
    );
  };

  if (!isOpen) return null;

  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-none bg-black/30 text-black font-thin cursor-default"
    >
      <div
        ref={settingsRef}
        className="relative w-[100%] max-w-3xl h-[700px] bg-white rounded-2xl flex overflow-visible"
      >
        <div className="w-1/4 border-r rounded-l-xl p-4 bg-[#f9f9f9]">
          <button
            onClick={handleCloseClick}
            className="text-gray-500 hover:text-black text-3xl cursor-pointer"
          >
            <IoIosClose className="w-8 h-8 text-black" />
          </button>
          <ul className="space-y-1">
            <button
              onClick={() => setActiveTab("General")}
              className={classNames(
                "flex justify-start items-center gap-2 p-2 rounded-lg w-full cursor-pointer relative pl-3",
                {
                  'bg-[#efefef] text-[#222831] before:content-[""] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-1/2 before:border-l-4 before:border-blue-600 before:rounded-lg':
                    activeTab === "General",
                  "hover:bg-[#efefef] text-[#222831] bg-none":
                    activeTab !== "General",
                },
              )}
            >
              {activeTab === "General" ? (
                <IoSettings className="w-6 h-6" />
              ) : (
                <IoSettingsOutline className="w-6 h-6" />
              )}
              <p className="text-base text-[#222831]">General</p>
            </button>

            <button
              onClick={() => setActiveTab("Profile")}
              className={classNames(
                "p-2 rounded-lg cursor-pointer flex flex-row w-full justify-start items-center gap-2 relative pl-3",
                {
                  'bg-[#efefef] text-[#222831] before:content-[""] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-1/2 before:border-l-4 before:border-blue-600 before:rounded-lg':
                    activeTab === "Profile",
                  "hover:bg-[#efefef] text-[#222831] bg-none":
                    activeTab !== "Profile",
                },
              )}
            >
              {activeTab === "Profile" ? (
                <HiUser className="w-6 h-6" />
              ) : (
                <HiOutlineUser className="w-6 h-6" />
              )}
              <p className="text-base text-[#222831]">Profile</p>
            </button>

            <button
              onClick={() => setActiveTab("Personalization")}
              className={classNames(
                "relative p-2 rounded-lg cursor-pointer flex flex-row w-full justify-start items-center gap-2 pl-3",
                {
                  'bg-[#efefef] text-[#222831] before:content-[""] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-1/2 before:border-l-4 before:border-blue-600 before:rounded-lg':
                    activeTab === "Personalization",
                  "hover:bg-[#efefef] text-[#222831] bg-none transition-all  duration-200":
                    activeTab !== "Personalization",
                },
              )}
            >
              {activeTab === "Personalization" ? (
                <HiPaintBrush className="w-6 h-6" />
              ) : (
                <HiOutlinePaintBrush className="w-6 h-6" />
              )}
              <p className="text-base text-[#222831]">Personalization</p>
            </button>

            <button
              onClick={() => setActiveTab("Security")}
              className={classNames(
                "p-2 rounded-lg cursor-pointer flex flex-row w-full justify-start items-center gap-2 relative pl-3",
                {
                  'bg-[#efefef] text-[#222831] before:content-[""] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-1/2 before:border-l-4 before:border-blue-600 before:rounded-lg':
                    activeTab === "Security",
                  "hover:bg-[#efefef] text-[#222831] bg-none":
                    activeTab !== "Security",
                },
              )}
            >
              {activeTab === "Security" ? (
                <IoLockClosed className="w-6 h-6" />
              ) : (
                <IoLockClosedOutline className="w-6 h-6" />
              )}
              <p className="text-base text-[#222831]">Security</p>
            </button>

            <button
              onClick={() => setActiveTab("Notification")}
              className={classNames(
                "p-2 rounded-lg cursor-pointer flex flex-row w-full justify-start items-center gap-2 relative pl-3",
                {
                  'bg-[#efefef] text-[#222831] before:content-[""] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-1/2 before:border-l-4 before:border-blue-600 before:rounded-lg':
                    activeTab === "Notification",
                  "hover:bg-[#efefef] text-[#222831] bg-none":
                    activeTab !== "Notification",
                },
              )}
            >
              {activeTab === "Notification" ? (
                <IoNotifications className="w-6 h-6" />
              ) : (
                <IoNotificationsOutline className="w-6 h-6" />
              )}
              <p className="text-base text-[#222831]">Notification</p>
            </button>

            <button
              onClick={() => setActiveTab("Storage")}
              className={classNames(
                "p-2 rounded-lg cursor-pointer flex flex-row w-full justify-start items-center gap-2 relative pl-3",
                {
                  'bg-[#efefef] text-[#222831] before:content-[""] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-1/2 before:border-l-4 before:border-blue-600 before:rounded-lg':
                    activeTab === "Storage",
                  "hover:bg-[#efefef] text-[#222831] bg-none":
                    activeTab !== "Storage",
                },
              )}
            >
              {activeTab === "Storage" ? (
                <MdSdStorage className="w-6 h-6" />
              ) : (
                <MdOutlineSdStorage className="w-6 h-6" />
              )}
              <p className="text-base text-[#222831]">Storage</p>
            </button>
          </ul>
        </div>

        <div className="relative w-3/4 p-6 space-y-6 z-0">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl text-[#1e1e1e] font-medium">{activeTab}</h2>
          </div>

          {activeTab === "General" && (
            <div className="space-y-4">

              {/* NEED TO ADD SOMETHING IN THE GENERAL TAB */}

              {/*<div>*/}
              {/*  <div className="block text-lg font-normal mb-4">Dark Mode</div>*/}
              {/*  <div*/}
              {/*    className="flex items-center my-2 w-full"*/}
              {/*    role="separator"*/}
              {/*    aria-label="or"*/}
              {/*  >*/}
              {/*    <div className="flex-grow h-px bg-gray-400 opacity-35" />*/}
              {/*    <div className="flex-grow h-px bg-gray-400 opacity-35" />*/}
              {/*  </div>*/}
              {/*  <div className="flex flex-1 justify-between mb-6 items-center">*/}
              {/*    <label>Off</label>*/}
              {/*    <input*/}
              {/*      className="flex justify-center items-center accent-[#000000] w-5 h-5"*/}
              {/*      type="radio"*/}
              {/*      name="darkmode"*/}
              {/*    />*/}
              {/*  </div>*/}
              {/*  <div className="flex flex-1 justify-between items-center mb-6">*/}
              {/*    <label>On</label>*/}
              {/*    <input*/}
              {/*      type="radio"*/}
              {/*      name="darkmode"*/}
              {/*      className="flex justify-center items-center accent-[#5f94ff] w-5 h-5"*/}
              {/*    />*/}
              {/*  </div>*/}
              {/*  <div className="flex flex-1 justify-between items-center">*/}
              {/*    <div className="flex flex-col">*/}
              {/*      <label>Automatic</label>*/}
              {/*      <p className="text-sm text-[#737373]">*/}
              {/*        We&apos;ll automatically adjust the display based on your*/}
              {/*        device&apos;s system preferences.*/}
              {/*      </p>*/}
              {/*    </div>*/}
              {/*    <input*/}
              {/*      type="radio"*/}
              {/*      name="darkmode"*/}
              {/*      className="flex justify-center items-center accent-[#5f94ff] w-5 h-5"*/}
              {/*    />*/}
              {/*  </div>*/}
              {/*</div>*/}
            </div>
          )}

          {activeTab === "Personalization" && (
            <div className="space-y-4">
              <div
                className="flex items-center my-2 w-full"
                role="separator"
                aria-label="or"
              >
                <div className="flex-grow h-px bg-gray-600 opacity-35" />
                <div className="flex-grow h-px bg-gray-600 opacity-35" />
              </div>
              <div>
                <div>
                  <p className="text-lg font-light">Theme</p>
                  <div className="text-[#7A7A73] font-light mt-1">
                    App color theme
                  </div>
                  <ThemeDropDown />
                </div>
                <div
                  className="flex items-center my-2 mt-3 w-full"
                  role="separator"
                  aria-label="or"
                >
                  <div className="flex-grow h-px bg-gray-300 opacity-35" />
                </div>
                <div className="mt-2">
                  <p className="text-lg font-light">Text Size</p>
                  <TextSizeDropDown />
                  <p className="text-[#7A7A73] text-base mt-1">
                    Use Ctrl +/- to increase or decrease your text size
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Storage" && (
            <div className="space-y-4">
              <div
                className="flex items-center my-2 w-full"
                role="separator"
                aria-label="or"
              >
                <div className="flex-grow h-px bg-gray-500 opacity-35" />
                <div className="flex-grow h-px bg-gray-500 opacity-35" />
              </div>
              <div>
                <p className="text-lg">Automatic Downloads</p>
                <p className="text-[#7A7A73] mt-1">
                  Choose auto-download preferences for media
                </p>
                <div className="gap-2 mt-2">
                  {mediaOptions.map((option) => (
                    <div
                      key={option}
                      className="flex flex-row items-center gap-2 mb-2"
                    >
                      <input
                        type="checkbox"
                        checked={selected.includes(option)}
                        onChange={() => toggleOption(option)}
                        className="w-4 h-4 accent-[#0077d4]"
                      />
                      <p>{option}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "Profile" && (
            <>
              <div
                className="flex items-center my-2 w-full"
                role="separator"
                aria-label="or"
              >
                <div className="flex-grow h-px bg-gray-600 opacity-35" />
              </div>
              <ProfileSettings />
            </>
          )}

          {activeTab === "Notification" && (
            <div className="space-y-2">
              <div
                className="flex items-center my-2 w-full"
                role="separator"
                aria-label="or"
              >
                <div className="flex-grow h-px bg-gray-600 opacity-35" />
              </div>

              <NotificationSettings />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
