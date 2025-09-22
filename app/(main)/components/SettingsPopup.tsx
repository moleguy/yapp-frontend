// components/SettingsPopup.tsx
'use client';

import React from 'react';
// import { FiSettings } from 'react-icons/fi';
// import { IoIosSettings } from "react-icons/io";
import { IoMdSettings } from "react-icons/io";
// import { useState } from 'react';
// import SettingsModal from './SettingsModal';
import SettingsModal from "./SettingsModal";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
};

const SettingsPopup: React.FC<Props> = ({isOpen, onClose, onOpen}) => {

  return (
    <>
      <button
        onClick={onOpen}
        className=" text-white hover:text-black cursor-pointer"
      >
        <IoMdSettings size={24} className="flex justify-center items-center text-2xl text-gray-500 cursor-pointer" />
      </button>

      <SettingsModal isOpen={isOpen} onClose={onClose} />
    </>
  );
};

export default SettingsPopup;
