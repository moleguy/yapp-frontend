'use client';

import { useState, useEffect } from "react";
import { FaPlus } from "react-icons/fa";
import AddServerPopup from "./AddServerPopup";
// import Image from 'next/image';

type Server = {
    id: number;
    name: string;
    image?: string;
};

export default function ServerList(){
    const[servers, setServers] = useState<Server[]>([]);
    const [showPopup, setShowPopup] = useState(false);

    useEffect(()=> {
        const saved = localStorage.getItem("servers");
        if(saved){
            setServers(JSON.parse(saved));
        }
    }, []);

    useEffect(()=> {
        localStorage.setItem("servers", JSON.stringify(servers));
    }, [servers]);

    const handleServer = () => {
        setShowPopup(true);
    }

    const handleCreateServer = (name: string, image?: string) => {
        if(servers.length < 9) {
            const newServer: Server = {
                id: Date.now(),
                name,
                image
            };
            setServers([...servers, newServer]);
        }
    };

    const handleJoinServer = () => {
        if(servers.length < 9){
            const newServer: Server = {
                id: Date.now(),
                name: 'Joined Server',
            };
            setServers([...servers, newServer]);
        }
    };

    return(
        <div className="flex flex-col justify-center items-center gap-2 p-2">
            <div className="grid grid-cols-3 gap-6 mt-6">
                {servers.map((server) => (
                    <div 
                        key={server.id}
                        className="w-24 h-24 flex flex-col items-center justify-center bg-white rounded-lg border border-[#b6b09f] cursor-pointer hover:bg-[#ebebed]"
                    >
                        {server.image ? (
                            <img 
                                src={server.image}
                                alt={server.name}
                                width={48}
                                height={48}
                                className="rounded-xl object-cover w-48 h-48"
                            />
                        ) : (
                            <div
                                className="w-12 h-12 rounded-full bg-[#b6b09f] flex items-center justify-center text-xl mb-2"
                            >
                                {server.name[0].toUpperCase()}
                            </div>
                        )}
                    </div>
                ))}

                <button
                    onClick={handleServer}
                    className="w-24 h-24 flex items-center justify-center bg-[#d4c9be] rounded-lg border border-[#b6b09f] cursor-pointer hover:bg-[#b3aa9e]"
                >
                    <FaPlus />
                </button>
            </div>
            <AddServerPopup 
                isOpen={showPopup}
                onClose={() => setShowPopup(false)}
                onCreate={handleCreateServer}
                onJoin={handleJoinServer}
            />
        </div>
    )
}