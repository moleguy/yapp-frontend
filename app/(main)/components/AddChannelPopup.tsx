'use client';

import React, { useState } from "react";

export interface AddChannelPopupProps {
    isOpen: boolean;
    onClose: () => void;
    onAddChannel: (category: "text" | "voice", type: "text" | "voice", name: string) => void;
    category: "text" | "voice";
}

export default function AddChannelPopup({
                                            isOpen,
                                            onClose,
                                            onAddChannel,
                                            category,
                                        }: AddChannelPopupProps) {
    const [type, setType] = useState<"text" | "voice">("text");
    const [name, setName] = useState("");

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!name.trim()) return;
        onAddChannel(category, type, name.trim());
        setName("");
        setType("text");
        onClose();
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 bg-opacity-50 z-50">
            <div className="bg-white rounded-lg p-6 w-80 shadow-lg">
                <h2 className="text-xl font-semibold mb-4">Create a channel</h2>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Channel Type</label>
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value as "text" | "voice")}
                        className="w-full border border-gray-300 rounded p-2"
                    >
                        <option value="text">Text Channel</option>
                        <option value="voice">Voice Channel</option>
                    </select>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Channel Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter channel name"
                        className="w-full border border-gray-300 rounded p-2"
                    />
                </div>

                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
                    >
                        Add
                    </button>
                </div>
            </div>
        </div>
    );
}
