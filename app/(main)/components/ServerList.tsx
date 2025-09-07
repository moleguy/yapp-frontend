'use client';

import { useState } from "react";
import { FaPlus } from "react-icons/fa";
import AddServerPopup from "./AddServerPopup";

type Server = {
    id: number;
    name: string;
};

export default function ServerList(){
    const[servers, setServers] = useState<Server[]>([]);
    const [showPopup, setShowPopup] = useState(false);

    const handleServer = () => {
        setShowPopup(true);
    }

    const handleCreateServer = () => {
        if(servers.length < 9) {
            const newServer: Server = {
                id: Date.now(),
                name: `Server ${servers.length + 1}`,
            };
            setServers([...servers, newServer]);
        }
    };

    const handleJoinServer = () => {
        if(servers.length < 9){
            const newServer: Server = {
                id: Date.now(),
                name: `Sever ${servers.length + 1}`,
            };
            setServers([...servers, newServer]);
        }
    }

    return(
        <div className="flex flex-col justify-center items-center gap-2 p-2">
            <div className="grid grid-cols-3 gap-6 mt-6">
                {servers.map((server) => (
                    <div
                        key={server.id}
                        className="w-24 h-24 flex items-center jutify-center bg-white rounded-lg border border-[#b6b09f] cursor-pointer hover:bg-[#ebebed]"
                    >
                        {server.name[0]}
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