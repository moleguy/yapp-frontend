'use client';

import { ChangeEvent, useState, useEffect, useRef } from 'react';
import classNames from 'classnames';
import { IoSettings, IoSettingsOutline, IoLockClosed, IoLockClosedOutline, IoNotifications, IoNotificationsOutline } from "react-icons/io5";
import { IoIosClose } from "react-icons/io";
import { FaUser, FaRegUser } from "react-icons/fa6";
import { HiOutlinePaintBrush, HiPaintBrush } from "react-icons/hi2";
import { MdOutlineSdStorage, MdSdStorage } from "react-icons/md";
import { FaPen } from "react-icons/fa";
import ThemeDropDown from './ThemeDropDown';
import TextSizeDropDown from './TextSizeDropDown';
import Image from 'next/image';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const mediaOptions = ["Photos", "Audio", "Video", "Document"];

  const [preview, setPreview] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [activeTab, setActiveTab] = useState('Appearance');
  const [selected, setSelected] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowOptions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handlePicChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(file){
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    setShowOptions(false);
  }

  const handleRemovePic = () => {
    setPreview(null);
    setShowOptions(false);
  }

  const toggleOption = (option: string) => {
    setSelected((prev) => 
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
    );
  }

  const handleBlur = () => {
    setEditing(false);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-none bg-black/30 text-black font-thin">
      <div className="relative w-[100%] max-w-4xl h-[700px] bg-white rounded-2xl flex overflow-visible shadow-lg">
        {/* Sidebar Contents */}
        <div className="w-1/4 border-r rounded-l-xl p-4 bg-[#f9f9f9]">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black text-3xl cursor-pointer"
          >
            <IoIosClose className='w-8 h-8 text-black'/>
          </button>
          <ul className="space-y-1">

            {/* General Button */}
            <button
              onClick={()=> setActiveTab('General')}
              className={classNames(
                'flex justify-start items-center gap-2 p-2 rounded-lg w-full cursor-pointer relative pl-3',
                {
                  'bg-[#efefef] text-[#222831] before:content-[""] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-1/2 before:border-l-4 before:border-blue-600 before:rounded-lg': activeTab === 'General',
                  'hover:bg-[#efefef] text-[#222831] bg-none': activeTab !== 'General',
                }
              )}
            >
              {activeTab === 'General' ? <IoSettings className='w-6 h-6'/> : <IoSettingsOutline className='w-6 h-6'/>}
              <p className='text-base text-[#222831]'>General</p>
            </button>

            {/* Profile Button */}
            <button
              onClick={()=> setActiveTab('Profile')}
              className={classNames(
                'p-2 rounded-lg cursor-pointer flex flex-row w-full justify-start items-center gap-2 relative pl-3',
              {
                'bg-[#efefef] text-[#222831] before:content-[""] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-1/2 before:border-l-4 before:border-blue-600 before:rounded-lg': activeTab === 'Profile',
                'hover:bg-[#efefef] text-[#222831] bg-none': activeTab !== 'Profile',
              }
              )}
            >
              {activeTab === 'Profile' ? <FaUser className='w-6 h-6'/> : <FaRegUser className='w-6 h-6'/>}
              <p className='text-base text-[#222831]'>Profile</p>
            </button>

            {/* Personalization Button */}
            <button
              onClick={()=> setActiveTab('Personalization')}
              className={classNames(
                'relative p-2 rounded-lg cursor-pointer flex flex-row w-full justify-start items-center gap-2 pl-3',
              {
                'bg-[#efefef] text-[#222831] before:content-[""] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-1/2 before:border-l-4 before:border-blue-600 before:rounded-lg': activeTab === 'Personalization',
                'hover:bg-[#efefef] text-[#222831] bg-none transition-all  duration-200': activeTab !== 'Personalization',
              }
              )}
            >
              {activeTab === 'Personalization' ? <HiPaintBrush className='w-6 h-6'/> : <HiOutlinePaintBrush className='w-6 h-6'/>}
              <p className='text-base text-[#222831]'>Personalization</p>
            </button>

            {/* Security Button */}
            <button
              onClick={()=> setActiveTab('Security')}
              className={classNames(
                'p-2 rounded-lg cursor-pointer flex flex-row w-full justify-start items-center gap-2 relative pl-3',
              {
                'bg-[#efefef] text-[#222831] before:content-[""] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-1/2 before:border-l-4 before:border-blue-600 before:rounded-lg': activeTab === 'Security',
                'hover:bg-[#efefef] text-[#222831] bg-none': activeTab !== 'Security',
              }
              )}
            >
              {activeTab === 'Security' ? <IoLockClosed className='w-6 h-6'/> : <IoLockClosedOutline className='w-6 h-6'/>}
              <p className='text-base text-[#222831]'>Security</p>
            </button>

            {/* Notification Button */}
            <button
              onClick={()=> setActiveTab('Notification')}
              className={classNames(
                'p-2 rounded-lg cursor-pointer flex flex-row w-full justify-start items-center gap-2 relative pl-3',
              {
                'bg-[#efefef] text-[#222831] before:content-[""] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-1/2 before:border-l-4 before:border-blue-600 before:rounded-lg': activeTab === 'Notification',
                'hover:bg-[#efefef] text-[#222831] bg-none': activeTab !== 'Notification',
              }
              )}
            >
              {activeTab === 'Notification' ? <IoNotifications className='w-6 h-6'/> : <IoNotificationsOutline className='w-6 h-6'/>}
              <p className='text-base text-[#222831]'>Notification</p>
            </button>

            {/* Storage Button */}
            <button
              onClick={()=> setActiveTab('Storage')}
              className={classNames(
                'p-2 rounded-lg cursor-pointer flex flex-row w-full justify-start items-center gap-2 relative pl-3',
              {
                'bg-[#efefef] text-[#222831] before:content-[""] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-1/2 before:border-l-4 before:border-blue-600 before:rounded-lg': activeTab === 'Storage',
                'hover:bg-[#efefef] text-[#222831] bg-none': activeTab !== 'Storage',
              }
              )}
            >
              {activeTab === 'Storage' ? <MdSdStorage className='w-6 h-6'/> : <MdOutlineSdStorage className='w-6 h-6'/>}
              <p className='text-base text-[#222831]'>Storage</p>
            </button>
          </ul>
        </div>

        {/* Content Area */}
        <div className="relative w-3/4 p-6 space-y-6 z-0">
        
          {/* close button */}
          <div className="flex justify-between items-center">
            <h2 className="text-2xl text-[#1e1e1e] font-medium">{activeTab}</h2>
          </div>

          {/* General Tab */}
          {activeTab === 'General' && (
            <div className="space-y-4">
              <div>
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

          {/* Personalization Tab */}
          {activeTab === 'Personalization' && (
            <div className='space-y-4'>
              <div className="flex items-center my-2 w-full" role="separator"   aria-label="or">
                <div className="flex-grow h-px bg-gray-600 opacity-35" />
                <div className="flex-grow h-px bg-gray-600 opacity-35" />
              </div>
              <div>
                <div>
                  <p className='text-lg font-light'>Theme</p>
                  <div className='text-[#7A7A73] font-light mt-1'>App color theme</div>
                  <ThemeDropDown />
                </div>
                <div 
                  className="flex items-center my-2 mt-3 w-full"  role="separator" aria-label="or"
                >
                <div className="flex-grow h-px bg-gray-300 opacity-35" />
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

          {/* Storage Tab */}
          {activeTab === 'Storage' && (
            <div className='space-y-4'>
              <div className="flex items-center my-2 w-full" role="separator" aria-label="or">
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

          {/* Profile Tab */}
          {activeTab === 'Profile' && (
            <div className='space-y-4'>
              <div className="flex items-center my-2 w-full" role="separator" aria-label="or">
                <div className="flex-grow h-[2px] bg-gray-500 opacity-35" />
                <div className="flex-grow h-[2px] bg-gray-500 opacity-35" />
              </div>

              {/* file handing for user profile selection */}
              <div className="mt-2 relative" ref={dropdownRef}>
                <div
                  className="mt-4 w-24 h-24 border overflow-hidden rounded-full cursor-pointer group relative"
                  onClick={() => {
                    if(preview){
                      setShowOptions(!showOptions)
                    } else {
                      document.getElementById('fileUpload')?.click();
                    }
                  }}
                >
                  {preview ? (
                    <Image
                      src={preview}
                      alt="Profile"
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full bg-gray-200">
                      No Image
                    </div>
                  )}

                {/* Hover pen overlay */}
                  <div className="absolute inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <FaPen className="text-white text-lg" />
                  </div>
                </div>

                {/* Dropdown Menu */}
                {preview && showOptions && (
                  <div className="absolute top-12 bg-white border border-[#dcd9d3] shadow-lg rounded-lg w-32 text-sm z-50">
                    <label
                      htmlFor="fileUpload"
                      className="block px-4 py-2 cursor-pointer hover:bg-gray-100"
                    >
                      Change
                    </label>
                    <button
                      onClick={handleRemovePic}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {/* Hidden file input */}
                <input
                  type="file"
                  accept="image/*"
                  id="fileUpload"
                  onChange={handlePicChange}
                  className="hidden"
                />
              </div>

              <div className='flex items-center'>
                {editing ? (
                  <input 
                    type='text'
                    value={name}
                    autoFocus
                    onChange={(e) => setName(e.target.value)}
                    onBlur={handleBlur}
                    className='bg-transparent outline-none text-2xl font-base'
                  />
                ): (
                  <span className='text-2xl font-base'>{name}</span>
                )}
                <button
                  onClick={() => setEditing(true)}
                  className='absolute right-10 p-1 rounded-full hover:bg-gray-100'
                >
                  <FaPen size={16}/>
                </button>
              </div>
            </div>
          )}

          {/* Notification Tab */}
          {activeTab === 'Notification' && (
            <div className='space-y-4'>
              <div className="flex items-center my-2 w-full" role="separator"   aria-label="or">
                <div className="flex-grow h-px bg-gray-600 opacity-35" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
