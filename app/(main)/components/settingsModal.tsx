'use client';

import { useState } from 'react';
import classNames from 'classnames';
import { IoSettings, IoSettingsOutline } from "react-icons/io5";
import { IoIosClose } from "react-icons/io";
import { FaUser, FaRegUser } from "react-icons/fa6";
import { IoLockClosed, IoLockClosedOutline } from "react-icons/io5";
import { IoNotifications, IoNotificationsOutline } from "react-icons/io5";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

// const tabs = [
//   { label: 'General', icon: <FaCog /> },
//   { label: 'Profile', icon: <FaUser /> },
//   { label: 'Security', icon: <FaLock /> },
//   { label: 'Notifications', icon: <FaBell /> },
// ];

const SettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('Appearance');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xs bg-black/30 text-black font-thin">
      <div className="w-[100%] max-w-3xl bg-white rounded-2xl flex overflow-hidden shadow-lg">
        {/* sidebar */}
        <div className="w-1/4 border-r p-6">
          <ul className="space-y-2">
            <button
              onClick={()=> setActiveTab('General')}
              className={classNames(
                'flex justify-start items-center gap-2 p-2 rounded-lg w-full cursor-pointer',
                {
                  'bg-gray-100 text-[#222831] font-medium': activeTab === 'General',
                  'hover:bg-gray-100 text-[#222831] bg-none': activeTab !== 'General',
                }
              )}
            >
              {activeTab === 'General' ? <IoSettings className='w-6 h-6'/> : <IoSettingsOutline className='w-6 h-6'/>}
              <p className='text-base text-[#222831]'>General</p>
            </button>
            <button
              onClick={()=> setActiveTab('Profile')}
              className={classNames(
                'p-2 rounded-lg cursor-pointer flex flex-row w-full justify-start items-center gap-2',
              {
                'bg-gray-100 text-[#222831] font-medium': activeTab === 'Profile',
                'hover:bg-gray-100 text-[#222831] bg-none': activeTab !== 'Profile',
              }
              )}
            >
              {activeTab === 'Profile' ? <FaUser className='w-6 h-6'/> : <FaRegUser className='w-6 h-6'/>}
              <p className='text-base text-[#222831]'>Profile</p>
            </button>
            <button
              onClick={()=> setActiveTab('Security')}
              className={classNames(
                'p-2 rounded-lg cursor-pointer flex flex-row w-full justify-start items-center gap-2',
              {
                'bg-gray-100 text-[#222831] font-medium': activeTab === 'Security',
                'hover:bg-gray-100 text-[#222831] bg-none': activeTab !== 'Security',
              }
              )}
            >
              {activeTab === 'Security' ? <IoLockClosed className='w-6 h-6'/> : <IoLockClosedOutline className='w-6 h-6'/>}
              <p className='text-base text-[#222831]'>Security</p>
            </button>
            <button
              onClick={()=> setActiveTab('Notification')}
              className={classNames(
                'p-2 rounded-lg cursor-pointer flex flex-row w-full justify-start items-center gap-2',
              {
                'bg-gray-100 text-[#222831] font-medium': activeTab === 'Notification',
                'hover:bg-gray-100 text-[#222831] bg-none': activeTab !== 'Notification',
              }
              )}
            >
              {activeTab === 'Notification' ? <IoNotifications className='w-6 h-6'/> : <IoNotificationsOutline className='w-6 h-6'/>}
              <p className='text-base text-[#222831]'>Notification</p>
            </button>
          </ul>
        </div>

        {/* main content */}
        <div className="w-3/4 p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-base text-[#979797] font-normal">{activeTab}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-black text-3xl "
            >
              <IoIosClose className='w-8 h-8 text-black'/>
            </button>
          </div>

          {/* showing selected tab */}
          {activeTab === 'General' && (
            <div className="space-y-4">
              <div>
                {/* <label className="block text-base font-normal">Dark Mode</label> */}
                <p className='block text-base font-normal mb-4'>Dark Mode</p>
                <div className='flex flex-1 justify-between mb-6 items-center'>
                  <label>Off</label>
                  <input className='flex justify-center items-center accent-[#000000] w-5 h-5' type="radio" name='darkmode'/>
                </div>
                <div className='flex flex-1 justify-between items-center mb-6'>
                  <label>On</label>
                  <input type="radio" name='darkmode' className='flex justify-center items-center accent-[#5f94ff] w-5 h-5'/>
                </div>
                <div className='flex flex-1 justify-between items-center'>
                  <div className='flex flex-col'>
                    <label>Automatic</label>
                    <p className='text-sm text-[#737373]'>We&apos;ll automatically adjust the display based on your device&apos;s system preferences.</p>
                  </div>
                  <input type="radio" name='darkmode' className='flex justify-center items-center accent-[#5f94ff] w-5 h-5'/>
                </div>
                
              </div>

              {/* <div>
                <label className="block text-sm font-medium">Email</label>
                <input
                  type="email"
                  className="w-full mt-1 p-2 border rounded-lg bg-gray-100"
                />
              </div> */}

            </div>
          )}

          {/* Aru tab add garni */}

          {activeTab === 'Profile' && (
            <div>
              <div></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
