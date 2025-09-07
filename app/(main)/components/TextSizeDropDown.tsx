'use client'

import { useState } from "react";
import { FaChevronDown } from "react-icons/fa";

const sizes = [80, 90, 100, 110, 120, 130, 140, 150];

const TextSizeDropDown: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedSize, setSelectedSize] = useState(100); // default
  
    const toggleDropdown = () => setIsOpen(!isOpen);
    const handleSelect = (size: number) => {
        setSelectedSize(size);
        setIsOpen(false);
    };

    return (
        <div className='relative w-64 mt-1'>
            <button
              onClick={toggleDropdown}
              className='relative flex items-center justify-start w-[240px] p-2 border border-[#dcd9d3] rounded-lg focus:rounded-b-none focus:rounded-t-lg focus:outline-none cursor-pointer transition-all duration-200 gap-2'
            >
                <span>{selectedSize}%</span>
                <FaChevronDown className={`absolute right-2 w-4 h-4 transition-transform ${
                isOpen ? 'rotate-[180deg]': 'rotate-0'} transition-all duration-200` }/>
            </button>

            {isOpen && (
                <ul className="absolute z-10 w-[240px] bg-white border border-[#dcd9d3] rounded-b-lg shadow-lg">
                    {sizes.map((size) => (
                        <li
                            key={size}
                            onClick={() => handleSelect(size)}
                            className={`px-3 py-2 cursor-pointer ${
                            size === selectedSize ? "bg-[#efefef] font-base hover:bg-[#efefef]" : "hover:bg-[#efefef]"
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