'use client';

import {useState, useRef, useEffect} from "react";
import { MdDarkMode } from "react-icons/md";
import { IoMdSunny } from "react-icons/io";
import { IoColorPaletteOutline } from "react-icons/io5";
import { FaChevronDown } from "react-icons/fa";

const ThemeDropDown: React.FC = () => {
    const [selected, setSelected] = useState("System Default");
    const [isDropDownOpen, setIsDropDownOpen] = useState(false);
    const themeRef = useRef<HTMLDivElement | null>(null);

    const options = [
        { label: "System Default", icon: <IoColorPaletteOutline className="w-5 h-5" /> },
        { label: "Light", icon: <IoMdSunny className="w-5 h-5 text-yellow-500" /> },
        { label: "Dark", icon: <MdDarkMode className="w-5 h-5 text-gray-700" /> },
    ];

    useEffect(() => {
        if(!isDropDownOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            if(
                themeRef.current &&
                !themeRef.current.contains(e.target as Node)
            ){
                setIsDropDownOpen(false);
            }
        }

        window.addEventListener("mousedown", handleClickOutside);

        return () => window.removeEventListener("mousedown", handleClickOutside);
    }, [isDropDownOpen]);

    return (
        <div
            ref={themeRef}
            className='relative w-64 mt-1'
        >
            <button

              onClick={() => setIsDropDownOpen((prev) => !prev)}
              className='relative flex items-center justify-start w-[240px] p-2 border border-[#dcd9d3] rounded-lg focus:rounded-b-none focus:rounded-t-lg focus:outline-none cursor-pointer transition-all duration-200 gap-2'
            >
                <span className='flex items-center gap-2'>
                  {options.find((opt) => opt.label === selected)?.icon}
                  {selected}
                </span>
                <FaChevronDown className={`absolute right-2 w-4 h-4 transition-transform ${
                isDropDownOpen ? 'rotate-[180deg]': 'rotate-0'} transition-all duration-200` }/>
            </button>
        
            {isDropDownOpen && (
              <ul className='absolute left-0 w-[240px] bg-white border rounded-b-lg border-[#dcd9d3] z-10 transition-all duration-200'>
                {options
                .filter((opt) => opt.label !== selected)
                .map((opt) => (
                  <li
                    key={opt.label}
                    onClick={()=> {
                      setSelected(opt.label);
                      setIsDropDownOpen(false);
                    }}
                    className='flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-[#efefef] hover:rounded-b-lg'
                  >
                    {opt.icon}
                    {opt.label}
                  </li>
                ))}
              </ul>
            )}
        </div>
    )
}

export default ThemeDropDown;