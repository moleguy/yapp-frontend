'use client';

import { useState } from "react";
import { FaChevronDown } from "react-icons/fa";
// import { FaPlay } from "react-icons/fa6";
import { IoPlayOutline } from "react-icons/io5";

type NotificationOption = {
    id: string;
    name: string;
    file?: string;
}

const notificationSounds: NotificationOption[] = [
    {id: "Default", name: "Default", file: "/sounds/notification-1-269296.wav"},
    {id: "alert1", name: "Alert 1", file: "/sounds/best-notification-7-286669.wav"},
    {id: "alert2", name: "Alert 2", file: "/sounds/new-notification-09-352705.wav"},
    {id: "alert3", name: "Alert 3", file: "/sounds/new-notification-014-363678.wav"},
    {id: "alert4", name: "Alert 4", file: "/sounds/new-notification-019-363747.wav"},
    {id: "alert5", name: "Alert 5", file: "/sounds/bell-172780.wav"},
    {id: "alert6", name: "Alert 6", file: "/sounds/notification-1-337826.wav"},
    {id: "alert7", name: "Alert 7", file: "/sounds/notification-22-270130.wav"},
    {id: "alert8", name: "Alert 8", file: "/sounds/notification-alert-8-331718.wav"},
    {id: "alert9", name: "Alert 9", file: "/sounds/notification-beep-229154.wav"},
    {id: "alert10", name: "Alert 10", file: "/sounds/smooth-simple-notification-274738.wav"},
];

export function NotificationSettings(){
    const[selected, setSelected] = useState<string>("Default");
    const[audio, setAudio] = useState<HTMLAudioElement | null>(null);
    const[isOpen, setIsOpen] = useState(false);

    const toggleDropdown = () => setIsOpen(!isOpen);
    const handleDropDownSelect = (notificationSounds: string) => {
        setSelected(notificationSounds);
        setIsOpen(false);
    }

    const playPreview = (file?: string) => {
        if(!file) return;
        if(audio){
            audio.pause();
        }
        const newAudio = new Audio(file);
        newAudio.play();
        setAudio(newAudio);
    }

    const rows = [
    { title: "Do Not Disturb" },
    { title: "Messages" },
    { title: "Calls" },
    { title: "Mentions" },
  ];

  const ToggleRow = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-base text-list-emphasis">{title}</p>
        {subtitle && <p className="text-sm text-list-muted">{subtitle}</p>}
      </div>

      <label className="relative inline-block w-[3.4em] h-[1.8em] text-[17px]">
        <input type="checkbox" className="sr-only peer" />
        <span className="absolute inset-0 cursor-pointer rounded-[30px] border border-toggle bg-surface-card transition duration-300 peer-checked:bg-surface-toggle-active peer-checked:border-surface-toggle-active"></span>
        <span className="absolute bottom-[0.30em] left-[0.27em] h-[1.2em] w-[1.2em] rounded-full bg-toggle-inactive transition duration-400 peer-checked:translate-x-[1.6em] peer-checked:bg-surface-card cursor-pointer"></span>
      </label>
    </div>
  );

  return (
    <div className="space-y-6">
        <div className="space-y-4">
        {rows.map((r) => (
            <ToggleRow key={r.title} {...r} />
        ))}
        </div>

        <div className="space-y-2">
            <label className="block text-sm font-semibold text-strong uppercase tracking-wider">
              Notification Tones
            </label>
            <p className="text-sm text-list-muted">
              Select notification tones for messages you receive
            </p>

            <div className="relative flex gap-2">
                <button
                    type="button"
                    onClick={toggleDropdown}
                    className="relative flex flex-1 items-center justify-start px-4 py-2 border border-default rounded-lg bg-surface-elevated text-heading focus:rounded-b-none focus:rounded-t-lg focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer transition-all duration-200 gap-2"
                >
                    <span>
                        {notificationSounds.find((o) => o.id === selected)?.name ?? selected}
                    </span>
                    <FaChevronDown
                        className={`absolute right-2 w-4 h-4 transition-transform ${ isOpen ? "rotate-180" : "rotate-0"}`}
                    />
                </button>

                <button
                    type="button"
                    className="px-3 py-2 text-sm border flex items-center justify-center rounded-lg border-default bg-surface-card hover:bg-surface-muted transition-colors cursor-pointer"
                    onClick={() => {
                      const file = notificationSounds.find((o) => o.id ===selected)?.file;
                      if(file) playPreview(file);
                    }}
                >
                    <IoPlayOutline size={24}/>
                </button>
            </div>

            {isOpen && (
              <ul className="absolute left-0 z-10 w-full bg-surface-elevated border border-default rounded-b-lg shadow-lg">
                {notificationSounds.map((option) => (
                  <li
                    key={option.id}
                    className={`p-2 cursor-pointer text-list-emphasis rounded-md transition-colors ${
                      selected === option.id ? "hover:bg-list-hover text-list-emphasis" : "hover:bg-list-hover text-list-emphasis"
                    }`}
                    onClick={() => handleDropDownSelect(option.id)}
                  >
                    {option.name}
                  </li>
                ))}
              </ul>
            )}
        </div>
    </div>
    
  );
}