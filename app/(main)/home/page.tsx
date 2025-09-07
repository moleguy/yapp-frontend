'use client';

import { useState } from "react";
import React  from "react";
// import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import { BiSolidMicrophone, BiSolidMicrophoneOff } from "react-icons/bi";
import { RiUser6Fill } from "react-icons/ri";
import SettingsPopup from "../components/SettingsPopup";
import ServerList from "../components/ServerList";

export default function HomePage() {
  const [ showMicrophone, setShowMicrophone ] = useState(true);

  return (
    <div className="flex h-screen bg-white text-black font-MyFont">

      <div className="w-full flex m-4 bg-[#EAE4D5] rounded-lg">
        <div className="flex flex-col justify-between w-[400px] bg-[#B6B09F] rounded-l-lg">

          {/* servers, channels etc... */}
          <ServerList />

          {/* call, profile and settings */}
          <div className="flex m-1 border-3 py-3 px-3 bg-white border-[#D4C9BE] rounded-xl">
            <div className="w-1/2 flex items-center w-full hover:bg-[#ebebed] p-1 hover:rounded-lg cursor-pointer">
              <div className="flex justify-center items-center w-12 h-12 border border-[#B6B09F] rounded-full">
                <RiUser6Fill size={32}/>
              </div>
              <div className="ml-2 font-MyFont text-[#393E46]">
                <p className="text-sm font-medium">Manish</p>
                <p className="text-sm">#moleguy5</p>
              </div>
            </div>
            <div className="w-1/2 flex items-center justify-around">
            <style>
              {`
                @keyframes sway {
                  0%, 100% {transform: rotate(0deg); }
                  25% {transform: rotate(-15deg); }
                  75% {transform: rotate(15deg); }
                }

                .sway-hover:hover{
                  animation: sway 0.4s ease-in-out;
                }

                @keyframes rotate {
                  0%, 100% {transform: rotate(0deg); }
                  25% {transform: rotate(-25deg); }
                  75% {transform: rotate(25deg); }
                }

                .rotate-hover:hover {
                  animation: rotate 0.4s ease-in-out;
                }
              `}
            </style>
              <div className={` cursor-pointer flex justify-center items-center p-2  rounded-lg ${showMicrophone ? 'hover:bg-[#dfdfe1] ': 'bg-[#ebc8ca] text-[#cb3b40]'} transition-colors` }
              onClick={()=> setShowMicrophone(!showMicrophone)}>
                {showMicrophone ? <BiSolidMicrophone size={28} className="sway-hover text-gray-500 hover:text-[#1e1e1e]"/> : <BiSolidMicrophoneOff size={28} className="sway-hover"/>}
              </div>
              <div className={` flex justify-center items-center p-2 rounded-lg hover:bg-[#dfdfe1]`}>
                <SettingsPopup />
              </div>
            </div>
            
          </div>
        </div>

        <div className="flex flex-2 flex-col">
          <p className="flex flex-row">iaubsiub</p>
          <p className="flex flex-row">iaubsiub</p>
        </div>

        <div className="flex w-[400px] bg-[#F2F2F2] rounded-r-lg"><p>iaubsiub</p></div>

      </div>
      
    </div>

// "text-[#cb3b40] bg-[#ebc8ca]"
    // <div>
    //   <SignedIn>
    //     <h1>Hello {user?.firstName}, welcome to Yapp!</h1>
    //   </SignedIn>

    //   <SignedOut>
    //     <h1>Hello, you are not signed in.</h1>
    //   </SignedOut>

    //   {/* CAPTCHA Widget - Clerk will inject the CAPTCHA */}
    //   <div id="clerk-captcha" className="mb-4"></div>
    // </div>
  );
}

// This is a protected page that only signed-in users can access. But it not protection is not enforced yet.
// Protection will be enforced in the future.