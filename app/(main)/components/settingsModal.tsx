'use client';

import { useState } from 'react';
import classNames from 'classnames';
import { IoSettings, IoSettingsOutline, IoLockClosed, IoLockClosedOutline, IoNotifications, IoNotificationsOutline } from "react-icons/io5";
import { IoIosClose } from "react-icons/io";
import { FaUser, FaRegUser } from "react-icons/fa6";
import { HiOutlinePaintBrush, HiPaintBrush } from "react-icons/hi2";
import { MdOutlineSdStorage, MdSdStorage } from "react-icons/md";
import ThemeDropDown from './ThemeDropDown';
import TextSizeDropDown from './TextSizeDropDown';

export interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('Appearance');

  const mediaOptions = ["Photos", "Audio", "Video", "Document"];
  const [selected, setSelected] = useState<string[]>([]);

  const toggleOption = (option: string) => {
    setSelected((prev) => 
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xs bg-black/30 text-black font-thin">
      <div className="w-[100%] max-w-3xl h-[700px] bg-white rounded-2xl flex overflow-visible shadow-lg">
        {/* sidebar */}
        <div className="w-2/4 border-r p-6">
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
              onClick={()=> setActiveTab('Personalization')}
              className={classNames(
                'p-2 rounded-lg cursor-pointer flex flex-row w-full justify-start items-center gap-2',
              {
                'bg-gray-100 text-[#222831] font-medium': activeTab === 'Personalization',
                'hover:bg-gray-100 text-[#222831] bg-none': activeTab !== 'Personalization',
              }
              )}
            >
              {activeTab === 'Personalization' ? <HiPaintBrush className='w-6 h-6'/> : <HiOutlinePaintBrush className='w-6 h-6'/>}
              <p className='text-base text-[#222831]'>Personalization</p>
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
            <button
              onClick={()=> setActiveTab('Storage')}
              className={classNames(
                'p-2 rounded-lg cursor-pointer flex flex-row w-full justify-start items-center gap-2',
              {
                'bg-gray-100 text-[#222831] font-medium': activeTab === 'Storage',
                'hover:bg-gray-100 text-[#222831] bg-none': activeTab !== 'Storage',
              }
              )}
            >
              {activeTab === 'Storage' ? <MdSdStorage className='w-6 h-6'/> : <MdOutlineSdStorage className='w-6 h-6'/>}
              <p className='text-base text-[#222831]'>Storage</p>
            </button>
          </ul>
        </div>

        {/* main content */}
        <div className="relative w-3/4 p-6 space-y-6 z-0">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl text-[#979797] font-medium">{activeTab}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-black text-3xl cursor-pointer"
            >
              <IoIosClose className='w-8 h-8 text-black'/>
            </button>
          </div>

          {/* general tab */}
          {activeTab === 'General' && (
            <div className="space-y-4">
              <div>
                {/* <label className="block text-base font-normal">Dark Mode</label> */}
                <div className='block text-lg font-normal mb-4'>Dark Mode</div>
                <div className="flex items-center my-2 w-full" role="separator" aria-label="or">
                  <div className="flex-grow h-px bg-gray-400 opacity-35" />
                  <div className="flex-grow h-px bg-gray-400 opacity-35" />
                </div>
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
            </div>
          )}

          {/* Personalization tab */}

          {activeTab === 'Personalization' && (
            <div className='space-y-4'>
              <div className="flex items-center my-2 w-full" role="separator"   aria-label="or">
                <div className="flex-grow h-px bg-gray-400 opacity-35" />
                <div className="flex-grow h-px bg-gray-400 opacity-35" />
              </div>
              <div>
                <div>
                  <p className='text-lg font-light'>Theme</p>
                  <div className='text-[#7A7A73] font-light mt-1'>App color theme</div>
                  <ThemeDropDown />
                </div>
              {/* dropdown and showing option for text size in chat app */}
                <div className='mt-2'>
                <p className='text-lg font-light'>Text Size</p>
                <TextSizeDropDown />
                <p className='text-[#7A7A73] text-base mt-1'>Use Ctrl +/- to increase or decrease your text size</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Storage' && (
            <div className='space-y-4'>
              <div className="flex items-center my-2 w-full" role="separator"   aria-label="or">
                <div className="flex-grow h-px bg-gray-500 opacity-35" />
                <div className="flex-grow h-px bg-gray-500 opacity-35" />
              </div>
              <div>
                <p className='text-lg font-light'>Automatic Downloads</p>
                <p className='text-[#7A7A73] mt-1'>Choose auto-download preferences for media</p>
                <div className=' gap-2 mt-2'>
                  {mediaOptions.map((option) => (
                  <label
                    key={option}
                    className='flex flex-row items-center gap-4 mb-2'
                  >
                    <input 
                      type='checkbox'
                      checked={selected.includes(option)}
                      onChange={() => toggleOption(option)}
                      className='w-4 h-4 accent-[#0077d4]'
                    />
                    <p>{option}</p>
                </label>
                ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
