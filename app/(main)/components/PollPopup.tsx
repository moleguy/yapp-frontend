'use client';

import React, {useState, useRef, useEffect} from "react";
import { FaTrash } from "react-icons/fa";

type PollPopupProps = {
    onClose: () => void;
    onCreate: (question: string, options: string[]) => void;
};

export default function PollPopup({onClose, onCreate}: PollPopupProps){

    const [question, setQuestion] = useState("");
    const [options, setOptions] = useState<string[]>(["", ""]);
    const pollPopupRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if(
                pollPopupRef.current &&
                !pollPopupRef.current?.contains(e.target as Node)
            ){
                onClose();
            }
        }

        window.addEventListener("mousedown", handleClickOutside);

        return () => window.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    const handleOptionChange = (index: number, value: string) =>{
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    }

    const handleAddOption = () => {
        if(options.length < 5){
            setOptions([...options, ""]);
        }
    };

    const handleCreate = () => {
        const validOptions = options.filter((opt) => opt.trim() !== "");
        if(question.trim() && validOptions.length > 2) {
            onCreate(question, validOptions);
            onClose();
        }
    };

    const handleDeleteOption = (index: number) => {
        if(options.length>1){
            setOptions(options.filter((_, i) => i !== index));
        }
    };

    return(
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
            <div
                ref={pollPopupRef}
                className="w-116 bg-white rounded-xl p-6">
                <h2 className="text-xl font-medium mb-3 text-[#1e1e1e] tracking-wide">Create a Poll</h2>

                {/* Question input */}
                <div className={`flex flex-col gap-2 mb-4`}>
                    <label className={`text-[#525358] text-lg tracking-wide font-medium`}>Question</label>
                    <input
                        type="text"
                        placeholder="Ask a question..."
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        className="w-full text-[#696a74] border border-[#dcd9d3] rounded-lg px-3 py-3 mb-3 focus:outline-none bg-[#f2f2f3] tracking-wide focus:border-[#6090eb]"
                    />
                </div>


                {/* Options */}
                <div className={`flex flex-col gap-2`}>
                    <label className={`text-[#525358] text-lg tracking-wide font-medium`}>Answers</label>
                    {options.map((opt, idx) => (
                        <div key={idx} className="relative flex items-center gap-2 mb-2">
                            <input
                                type="text"
                                placeholder={`Option ${idx + 1}`}
                                value={opt}
                                onChange={(e) => handleOptionChange(idx, e.target.value)}
                                className="flex-1 text-[#696a74] border border-[#dcd9d3] rounded-lg px-3 py-3 focus:outline-none bg-[#f2f2f3] tracking-wider focus:border-[#6090eb]"
                            />
                            {options.length > 1 && (
                                <button
                                    onClick={() => handleDeleteOption(idx)}
                                    className="absolute right-2 hover:text-red-700 px-2 py-1"
                                >
                                    <FaTrash className={`w-5 h-5`}/>
                                </button>
                            )}
                        </div>
                    ))}

                </div>


                {/* Add option button */}
                <div className={`flex justify-end`}>
                    {options.length < 5 && (
                        <button
                            onClick={handleAddOption}
                            className="flex justify-center px-4 text-base font-base bg-[#eeeef0] border border-[#dcd9d3] focus:outline-none text-[#2f3035] rounded-lg py-2 mb-3 cursor-pointer tracking-wide"
                        >
                            + Add another option
                        </button>
                    )}
                </div>

                {/* Action buttons */}
                <div className="flex justify-between gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-base font-base text-[#1e1e1e] cursor-pointer tracking-wide focus:outline-none"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        className="text-base font-base px-5 py-2 rounded-lg bg-blue-600 text-[#ffffff] hover:bg-blue-700 cursor-pointer tracking-wide focus:outline-none"
                    >
                        Create Poll
                    </button>
                </div>
            </div>
        </div>
    );

}