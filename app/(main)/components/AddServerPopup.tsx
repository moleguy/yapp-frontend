'use client';

import { useEffect, useState } from "react";
// import Image from 'next/image';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string, image?: string) => void;
    onJoin: (link: string) => void;
}

export default function AddServerPopup({
    isOpen,
    onClose,
    onCreate,
    onJoin
}: Props) {

    const[step, setStep] = useState<"choice" | "create" | "join">("choice");
    const [serverName, setServerName] = useState("");
    const [serverImage, setServerImage] = useState<string | undefined>();
    const [inviteLink, setInviteLink] = useState("");

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) =>{
        const file = e.target.files?.[0];
        if(file){
            const reader = new FileReader();
            reader.onloadend = () => setServerImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    useEffect(()=> {
        if(!isOpen){
            setStep("choice");
            setServerName("");
            setServerImage(undefined);
            setInviteLink("");
        }
    }, [isOpen]);

    if(!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white rounded-xl p-6 w-[400px] h-[400px] text-center">
                {step === "choice" && (
                    <>
                        <h2 className="text-lg font-semibold mb-4">Add a server</h2>
                        <div className="flex flex-col gap-3">   
                            <button 
                                onClick={() => {    
                                    setStep("create")   
                                }}  
                                className="py-2 px-4 rounded-lg bg-[#b6b09f]"   
                            >   
                                Create a server 
                            </button>   
                            <button 
                                onClick={() => setStep("join") }  
                                className="py-2 px-4 rounded-lg bg-[#b6b09f]"   
                            >   
                                Join a server   
                            </button>   
                            <button 
                                onClick={onClose}   
                                className=""    
                            >   
                                Cancel  
                            </button>   
                        </div>
                    </>  
                )}
                {step === "create" && (
                    <div className="flex flex-col flex-1 justify-center items-center">
                        <h2 className="text-lg font-semibold mb-4">Create Server</h2>
                        <p className="mt-2 mb-2 ">Configure your new server with a name and an icon. You can always update it later.</p>
                        <div className="relative mt-3 mb-3">
                            {serverImage ? (
                                <img
                                    src={serverImage}
                                    alt="Server Preview"
                                    className="w-20 h-20 rounded-full object-cover mx-auto cursor-pointer"
                                    onClick={() => setServerImage(undefined)} // allow user to remove/change image
                                    title="Click to remove/change"
                                />
                            ) : (
                                <label className="w-20 h-20 bg-gray-500 rounded-full flex items-center justify-center cursor-pointer mx-auto">
                                    <span className="text-white text-2xl">+</span>
                                    <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    />
                                </label>
                            )}
                        </div>
                        <input
                          type="text"
                          placeholder="Server Name"
                          value={serverName}
                          onChange={(e) => setServerName(e.target.value)}
                          className="w-full border rounded-lg p-3 mt-3"
                        />
                        <div className="flex gap-2  mt-3">
                            <button
                                onClick={() => {
                                    setStep("choice")
                                }}
                                className="py-2 px-4 rounded-lg bg-gray-300 text-gray-600"
                            >
                                Back
                            </button>
                            <button
                                onClick={() => {
                                    if(serverName.trim()){
                                        onCreate(serverName, serverImage);
                                        onClose();
                                    }
                                }}
                                className="py-2 px-4 rounded-lg bg-[#b6b09f] hover:bg-[#a19a87] text-white"
                            >
                                Create
                            </button>
                            
                        </div>
                    </div>
                )}    
                {step === "join" && (
                    <>
                        <h2 className="text-lg font-semibold mb-4">Join Server</h2>
                        <input 
                            type="text"
                            placeholder="Invite Link"
                            value={inviteLink}
                            onChange={(e) => setInviteLink(e.target.value)}
                            className="w-full border rounded-lg p-2 mb-3"
                        />
                        <div className="flex gap-2 justify-center">
                            <button 
                                onClick={() => {
                                    if(inviteLink.trim()){
                                        onJoin(inviteLink);
                                        onClose();
                                    }
                                }}
                                className="py-2 px-4 rounded-lg bg-[#b6b09f] hover:bg-[#a19a87] text-white"
                            >
                                Join
                            </button>
                            <button
                                onClick={() => setStep("choice")}
                                className="py-2 px-4 rounded-lg bg-gray-300 text-gray-600"
                            >
                                Back
                            </button>
                        </div>
                    </>
                )}    
            </div>
        </div>
    );
}