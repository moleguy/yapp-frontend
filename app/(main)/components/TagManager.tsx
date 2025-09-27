"use client";

import React, {useState, useRef, useEffect} from "react";
import { FaPlus } from "react-icons/fa";

type Tag = {
    id: number;
    text: string;
    color: string;
};

const TagManager = () => {
    const [tags, setTags] = useState<Tag[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [selectedColor, setSelectedColor] = useState("#e5e7eb");
    const [editingTagId, setEditingTagId] = useState<number | null>(null);
    const tagRef = useRef<HTMLDivElement | null>(null);

    const colors = ["#fde68a", "#a7f3d0", "#bfdbfe", "#fbcfe8"];

    useEffect(() => {
        if(!showModal) return;

        const handleClickOutside = (e: MouseEvent) => {
            if(
                tagRef.current &&
                !tagRef.current.contains(e.target as Node)
            ){
                setShowModal(false);
            }
        };
        window.addEventListener("mousedown", handleClickOutside);

        return () => window.removeEventListener("mousedown", handleClickOutside);
    }, [showModal, setShowModal]);

    const openModal = (tag?: Tag) => {
        if (tag) {
            setEditingTagId(tag.id);
            setInputValue(tag.text);
            setSelectedColor(tag.color);
        } else {
            setEditingTagId(null);
            setInputValue("");
            setSelectedColor(colors[0]);
        }
        setShowModal(true);
    };

    const handleSave = () => {
        if (!inputValue.trim()) return;

        if (editingTagId !== null) {
            setTags((prev) =>
                prev.map((t) =>
                    t.id === editingTagId ? { ...t, text: inputValue, color: selectedColor } : t
                )
            );
        } else {
            setTags((prev) => [...prev, { id: Date.now(), text: inputValue, color: selectedColor }]);
        }

        setShowModal(false);
        setInputValue("");
        setSelectedColor(colors[0]);
        setEditingTagId(null);
    };

    const handleDelete = (id: number) => {
        setTags((prev) => prev.filter((t) => t.id !== id));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
        if(e.key === "Enter"){
            e.preventDefault();
            handleSave();
        }
    };

    return (
        <div className="flex items-center gap-2 mt-2 select-none">
            {/* displaying user tag */}
            <div className="flex items-center gap-2 flex-wrap">
                {tags.slice(0, 4).map((tag) => (
                    <span
                        key={tag.id}
                        onDoubleClick={() => openModal(tag)}
                        className="relative group px-3 py-1 rounded-lg text-sm tracking-wide text-[#1e1e1e]"
                        style={{ backgroundColor: tag.color }}
                    >
                        {tag.text}
                        {/* Cross button on hover */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(tag.id);
                            }}
                            className="absolute -top-1 -right-1 hidden group-hover:flex items-center justify-center w-4 h-4 rounded-full bg-white text-xs text-gray-600 hover:text-red-500 shadow cursor-pointer"
                        >
                            ×
                        </button>
                    </span>
                ))}
            </div>

            {/* logic for plus button */}
            {tags.length < 4 && (
                <button
                    onClick={() => openModal()}
                    className={`flex items-center justify-center rounded-md border border-[#dcd9d3] text-sm hover:bg-[#f2f2f3] cursor-pointer
            ${tags.length === 0 ? "px-3 py-1" : "w-7 h-7"}`}
                >
                    {tags.length === 0 ? "Create a tag" : <FaPlus className="w-4 h-4" />}
                </button>
            )}


            {/* Modal */}
            {showModal && (
                <div
                    className="fixed inset-0 flex items-center justify-center bg-black/30 bg-opacity-40 z-50 cursor-auto">
                    <div
                        ref={tagRef}
                        className="bg-white rounded-lg p-5 w-80 shadow-lg">
                        <label className="text-lg font-medium tracking-wide text-[#1e1e1e]">Describe yourself</label>

                        {/* Input */}
                        <input
                            type="text"
                            value={inputValue}
                            onKeyDown={handleKeyDown}
                            onChange={(e) => setInputValue(e.target.value)}
                            className="w-full border border-[#dcd9d3] rounded-md mt-3 p-2 focus:outline-none focus:border-[#6090eb] tracking-wide text-[#1e1e1e] font-base"
                            placeholder="write something about yourself..."
                        />

                        {/* Color Choices */}
                        <div className="flex gap-4 mt-4 mb-4">
                            {colors.map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setSelectedColor(c)}
                                    className={`w-8 h-8 rounded-full border-2 ${
                                        selectedColor === c ? "border-[#a9a6a2] cursor-pointer" : "border-transparent cursor-pointer"
                                    }`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="flex justify-between gap-2">
                            <button onClick={() => setShowModal(false)} className="px-4 py-1 border border-[#dcd9d3] rounded-lg text-sm cursor-pointer">
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-1 bg-[#3A6F43] text-white rounded-lg text-sm cursor-pointer"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TagManager;
