// components/SettingsPopup.tsx
'use client';

import { FiSettings } from 'react-icons/fi';
import { useState } from 'react';
import SettingsModal from './settingsModal';

const SettingsPopup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleModal = () => setIsOpen((prev) => !prev);

  return (
    <>
      <button
        onClick={toggleModal}
        className="bottom-6 right-6 text-white"
      >
        <FiSettings className="text-2xl text-gray-600 cursor-pointer hover:text-gray-800" />
      </button>

      <SettingsModal isOpen={isOpen} onClose={toggleModal} />
    </>
  );
};

export default SettingsPopup;
