'use client'

import { useState, useRef, useEffect } from "react";
import { FaChevronDown } from "react-icons/fa";

const sizes = [80, 90, 100, 110, 120, 130, 140, 150];

const TextSizeDropDown: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedSize, setSelectedSize] = useState(100);
    const textSizeRef = useRef<HTMLDivElement | null>(null);
  
    const toggleDropdown = () => setIsOpen(!isOpen);
    const handleSelect = (size: number) => {
        setSelectedSize(size);
        setIsOpen(false);
    };

    useEffect(() => {
        if(!isOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            if(
                textSizeRef.current &&
                !textSizeRef.current.contains(e.target as Node)
            ){
                setIsOpen(false);
            }
        }

        window.addEventListener("mousedown", handleClickOutside);

        return ()=> window.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    return (
        <div
            ref={textSizeRef}
            className="relative w-full"
        >
            <button
              type="button"
              onClick={toggleDropdown}
              className="relative flex w-full items-center justify-start px-4 py-2 border border-default rounded-lg focus:rounded-b-none focus:rounded-t-lg focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer transition-all duration-200 gap-2 bg-surface-elevated text-heading"
            >
                <span>{selectedSize}%</span>
                <FaChevronDown className={`absolute right-2 w-4 h-4 transition-transform ${
                isOpen ? 'rotate-[180deg]': 'rotate-0'} transition-all duration-200` }/>
            </button>

            {isOpen && (
                <ul className="absolute left-0 z-10 w-full bg-surface-elevated border border-default rounded-b-lg shadow-lg">
                    {sizes.map((size) => (
                        <li
                            key={size}
                            onClick={() => handleSelect(size)}
                            className={`px-3 py-2 cursor-pointer ${
                            size === selectedSize ? "bg-list-selected font-base hover:bg-list-selected rounded-md" : "hover:bg-list-hover"
                            }`}
                        >
                            {size}%
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

export default TextSizeDropDown;