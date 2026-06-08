"use client";



import React, { useState, useEffect, useCallback } from "react";

import classNames from "classnames";

import {

  IoSettings,

  IoSettingsOutline,

  IoLockClosed,

  IoLockClosedOutline,

  IoNotifications,

  IoNotificationsOutline,

} from "react-icons/io5";

import { HiOutlineUser, HiUser } from "react-icons/hi2";

import SettingsPanelHeader from "./SettingsPanelHeader";

import { HiOutlinePaintBrush, HiPaintBrush } from "react-icons/hi2";

import { MdOutlineSdStorage, MdSdStorage } from "react-icons/md";

import ThemeDropDown from "./ThemeDropDown";

import TextSizeDropDown from "./TextSizeDropDown";

import { NotificationSettings } from "./NotificationSettings";

import ProfileSettings from "./ProfileSettings";

import {
  SettingsSection,
  SettingsForm,
  SettingsField,
  SettingsNotice,
} from "./UserSettingsContent";

import Modal from "./Modal";

import { LIST_ITEM_IDLE, LIST_ITEM_SELECTED } from "@/lib/listItemClasses";
import {
  SETTINGS_PANEL_BODY_CLASS,
  SETTINGS_PANEL_MAIN_CLASS,
  SETTINGS_PANEL_NAV_CLASS,
  SETTINGS_PANEL_SHELL_CLASS,
} from "@/lib/settingsPanelLayout";



interface Props {

  isOpen: boolean;

  onClose: () => void;

  initialTab?: string;

}



const TAB_SUBTITLES: Record<string, string> = {

  General: "Basic app preferences.",

  Profile: "Manage your profile and account details.",

  Personalization: "Theme, text size, and appearance.",

  Security: "Password and account security.",

  Notification: "Alerts, sounds, and do-not-disturb.",

  Storage: "Downloads and media storage.",

};



const NAV_ITEMS = [

  { id: "General", label: "General", Icon: IoSettingsOutline, IconActive: IoSettings },

  { id: "Profile", label: "Profile", Icon: HiOutlineUser, IconActive: HiUser },

  { id: "Personalization", label: "Personalization", Icon: HiOutlinePaintBrush, IconActive: HiPaintBrush },

  { id: "Security", label: "Security", Icon: IoLockClosedOutline, IconActive: IoLockClosed },

  { id: "Notification", label: "Notifications", Icon: IoNotificationsOutline, IconActive: IoNotifications },

  { id: "Storage", label: "Storage", Icon: MdOutlineSdStorage, IconActive: MdSdStorage },

] as const;



export default function SettingsModal({

  isOpen,

  onClose,

  initialTab = "General",

}: Props) {

  const mediaOptions = ["Photos", "Audio", "Video", "Document"];

  const [activeTab, setActiveTab] = useState(initialTab);

  const [selected, setSelected] = useState<string[]>([]);



  const handleClose = useCallback(() => {

    if (typeof onClose === "function") {

      onClose();

    }

  }, [onClose]);



  useEffect(() => {

    if (isOpen) {

      setActiveTab(initialTab);

    }

  }, [isOpen, initialTab]);



  const toggleOption = (option: string) => {

    setSelected((prev) =>

      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option],

    );

  };



  if (!isOpen) return null;



  const activeNavItem = NAV_ITEMS.find((item) => item.id === activeTab);



  return (

    <Modal

      isOpen={isOpen}

      onClose={handleClose}

      panelClassName={SETTINGS_PANEL_SHELL_CLASS}

    >

      <nav className={SETTINGS_PANEL_NAV_CLASS}>

        <h3 className="px-3 mb-2 text-xs font-semibold text-list-muted uppercase tracking-wider">

          User Settings

        </h3>

        {NAV_ITEMS.map(({ id, label, Icon, IconActive }) => {

          const active = activeTab === id;

          const TabIcon = active ? IconActive : Icon;

          return (

            <button

              key={id}

              type="button"

              onClick={() => setActiveTab(id)}

              className={classNames(

                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors w-full text-left",

                active ? `${LIST_ITEM_SELECTED} font-medium` : LIST_ITEM_IDLE,

              )}

            >

              <TabIcon className="w-5 h-5 flex-shrink-0" />

              <span>{label}</span>

            </button>

          );

        })}

      </nav>



      <div className={SETTINGS_PANEL_MAIN_CLASS}>

        <SettingsPanelHeader

          title={activeNavItem?.label ?? activeTab}

          subtitle={TAB_SUBTITLES[activeTab]}

          onClose={handleClose}

        />

        <div className={SETTINGS_PANEL_BODY_CLASS}>

          <SettingsSection>

            {activeTab === "General" && (
              <SettingsNotice>More general options coming soon.</SettingsNotice>
            )}



            {activeTab === "Personalization" && (

              <SettingsForm>

                <SettingsField label="Theme" hint="App color theme">

                  <ThemeDropDown />

                </SettingsField>



                <SettingsField

                  label="Text Size"

                  hint="Use Ctrl +/- to increase or decrease your text size"

                >

                  <TextSizeDropDown />

                </SettingsField>

              </SettingsForm>

            )}



            {activeTab === "Storage" && (

              <SettingsForm>

                <SettingsField

                  label="Automatic Downloads"

                  hint="Choose auto-download preferences for media"

                >

                  <div className="space-y-3">

                    {mediaOptions.map((option) => (

                      <label

                        key={option}

                        className="flex items-center gap-3 cursor-pointer text-list-emphasis"

                      >

                        <input

                          type="checkbox"

                          checked={selected.includes(option)}

                          onChange={() => toggleOption(option)}

                          className="w-4 h-4 accent-[var(--primary)] rounded border-default"

                        />

                        <span>{option}</span>

                      </label>

                    ))}

                  </div>

                </SettingsField>

              </SettingsForm>

            )}



            {activeTab === "Profile" && <ProfileSettings />}



            {activeTab === "Notification" && <NotificationSettings />}



            {activeTab === "Security" && (
              <SettingsNotice>Security settings coming soon.</SettingsNotice>
            )}

          </SettingsSection>

        </div>

      </div>

    </Modal>

  );

}


