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
        <p className="font-base text-[#222831]">{title}</p>
        {subtitle && <p className="text-sm text-[#7A7A73]">{subtitle}</p>}
      </div>

      <label className="relative inline-block w-[3.4em] h-[1.8em] text-[17px]">
        <input type="checkbox" className="sr-only peer" />
        <span className="absolute inset-0 cursor-pointer rounded-[30px] border border-[#adb5bd] bg-white transition duration-300 peer-checked:bg-[#007bff] peer-checked:border-[#007bff]"></span>
        <span className="absolute bottom-[0.30em] left-[0.27em] h-[1.2em] w-[1.2em] rounded-full bg-[#adb5bd] transition duration-400 peer-checked:translate-x-[1.6em] peer-checked:bg-white cursor-pointer"></span>
      </label>
    </div>
  );

  return (
    <div className="space-y-2">
        {rows.map((r, i) => (
            <div key={i}>
              {i > 0 && (
                <div className="flex-grow h-px mb-2 bg-gray-300 opacity-35" />
              )}
              <ToggleRow {...r} />
            </div>
        ))}

        <div className="flex items-center w-full" role="separator">
            <div className="flex-grow h-px my-2 bg-gray-300 opacity-35" />
        </div>

        <div className="relative">
            <h2 className="text-lg mb-2">Notification Tones</h2>
            <p className="mt-1 text-[#7A7A73]">Select your notification tones for the messages you recieve</p>

            <div className="flex gap-2">
    
                <button
                    onClick={toggleDropdown}
                    className="relative flex items-center justify-start w-[240px] p-2 border border-[#dcd9d3] rounded-lg focus:rounded-b-none focus:rounded-t-lg focus:outline-none cursor-pointer transition-all duration-200 gap-2"
                >
                    <span>
                        {notificationSounds.find((o) => o.id === selected)?.name ?? selected}
                    </span>
                    <FaChevronDown
                        className={`absolute right-2 w-4 h-4 transition-transform ${ isOpen ? "rotate-180" : "rotate-0"}`}
                    />
                </button>

                <button
                    className="px-3 py-2 text-sm border flex items-center justify-center rounded-lg border-[#dcd9d3] cursor-pointer"
                    onClick={() => {
                      const file = notificationSounds.find((o) => o.id ===selected)?.file;
                      if(file) playPreview(file);
                    }}
                >
                    <IoPlayOutline size={24}/>
                </button>
            </div>

            {isOpen && (
              <ul className="absolute z-10 w-[240px] bg-white border border-[#dcd9d3] rounded-b-lg shadow-lg">
                {notificationSounds.map((option) => (
                  <li
                    key={option.id}
                    className={`p-2 cursor-pointer text-[#222831] rounded-md transition-colors ${
                      selected === option.id ? "hover:bg-[#efefef] text-[#222831]" : "hover:bg-[#efefef] text-[#222831]"
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