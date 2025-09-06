// components/SettingsPopup.tsx
'use client';

// import { FiSettings } from 'react-icons/fi';
// import { IoIosSettings } from "react-icons/io";
import { IoMdSettings } from "react-icons/io";
import { useState } from 'react';
import SettingsModal from './settingsModal';

export interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsPopup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleModal = () => setIsOpen((prev) => !prev);

  return (
    <>
      <style>
        {`
          @keyframes rotate {
            0%, 100% {transform: rotate(0deg); }
            25% {transform: rotate(-25deg); }
            75% {transform: rotate(25deg); }
        
          .rotate-hover:hover {
            animation: rotate 0.4s ease-in-out;
          }
        `}
      </style>
      <button
        onClick={toggleModal}
        className=" text-white "
      >
        <IoMdSettings size={28} className="flex justify-center items-center text-2xl text-gray-500 cursor-pointer hover:text-[#1e1e1e] rotate-hover" />
      </button>

      <SettingsModal isOpen={isOpen} onClose={toggleModal} />
    </>
  );
};

export default SettingsPopup;
