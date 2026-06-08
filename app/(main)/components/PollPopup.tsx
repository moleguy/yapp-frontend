'use client';

import React, { useState } from "react";
import { FaTrash } from "react-icons/fa";
import Modal from "./Modal";

type PollPopupProps = {
    onClose: () => void;
    onCreate: (question: string, options: string[]) => void;
};

export default function PollPopup({ onClose, onCreate }: PollPopupProps) {
    const [question, setQuestion] = useState("");
    const [options, setOptions] = useState<string[]>(["", ""]);

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const handleAddOption = () => {
        if (options.length < 5) {
            setOptions([...options, ""]);
        }
    };

    const handleCreate = () => {
        const validOptions = options.filter((opt) => opt.trim() !== "");
        if (question.trim() && validOptions.length > 2) {
            onCreate(question, validOptions);
            onClose();
        }
    };

    const handleDeleteOption = (index: number) => {
        if (options.length > 1) {
            setOptions(options.filter((_, i) => i !== index));
        }
    };

    return (
        <Modal isOpen onClose={onClose} panelClassName="w-116 bg-surface-card rounded-xl p-6">
            <h2 className="text-xl font-medium mb-3 text-heading tracking-wide">Create a Poll</h2>

            <div className="flex flex-col gap-2 mb-4">
                <label className="text-label text-lg tracking-wide font-medium">Question</label>
                <input
                    type="text"
                    placeholder="Ask a question..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="w-full text-input border border-default rounded-lg px-3 py-3 mb-3 focus:outline-none bg-surface-muted tracking-wide focus:border-primary"
                />
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-label text-lg tracking-wide font-medium">Answers</label>
                {options.map((opt, idx) => (
                    <div key={idx} className="relative flex items-center gap-2 mb-2">
                        <input
                            type="text"
                            placeholder={`Option ${idx + 1}`}
                            value={opt}
                            onChange={(e) => handleOptionChange(idx, e.target.value)}
                            className="flex-1 text-input border border-default rounded-lg px-3 py-3 focus:outline-none bg-surface-muted tracking-wider focus:border-primary"
                        />
                        {options.length > 1 && (
                            <button
                                onClick={() => handleDeleteOption(idx)}
                                className="absolute right-2 text-destructive hover:opacity-80 px-2 py-1"
                            >
                                <FaTrash className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex justify-end">
                {options.length < 5 && (
                    <button
                        onClick={handleAddOption}
                        className="flex justify-center px-4 text-base font-base bg-surface-input-action border border-default focus:outline-none text-icon rounded-lg py-2 mb-3 cursor-pointer tracking-wide"
                    >
                        + Add another option
                    </button>
                )}
            </div>

            <div className="flex justify-between gap-2">
                <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg bg-surface-control hover:bg-surface-neutral text-base font-base text-heading cursor-pointer tracking-wide focus:outline-none"
                >
                    Cancel
                </button>
                <button
                    onClick={handleCreate}
                    className="text-base font-base px-5 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-hover cursor-pointer tracking-wide focus:outline-none"
                >
                    Create Poll
                </button>
            </div>
        </Modal>
    );
}
