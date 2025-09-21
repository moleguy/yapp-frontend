'use client';

import React, {useState, useEffect, useRef, ChangeEvent} from "react";
import {useRouter} from 'next/navigation';
import Image from 'next/image';
import {FaPen, FaPlus, FaCopy} from "react-icons/fa";
import {HiOutlineUser} from "react-icons/hi2";

import {useEdgeStore} from "@/lib/edgestore";
import {useUserStore, useUpdateUser, useSetUser} from "@/app/store/useUserStore";
import {authSignOut, updateUserMe, UpdateUserProfileReq, UserMeRes} from "@/lib/api";

export default function ProfileSettings() {
    const router = useRouter();
    const optionsRef = useRef<HTMLDivElement | null>(null);

    const user = useUserStore((state) => state.user);
    const setUser = useSetUser();
    const updateUser = useUpdateUser();
    const {edgestore} = useEdgeStore();

    const [showOptions, setShowOptions] = useState(false);
    const [editingField, setEditingField] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [fields, setFields] = useState({
        "display name": user?.display_name || "",
        username: user?.username || "",
        email: user?.email || "",
    });
    const [hasChanges, setHasChanges] = useState(false);

    // Close profile pic options when clicking outside
    useEffect(() => {
        if (!showOptions) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (optionsRef.current && !optionsRef.current.contains(e.target as Node)) {
                setShowOptions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showOptions]);

    // Keep fields in sync with user
    useEffect(() => {
        setFields({
            "display name": user?.display_name || "",
            username: user?.username || "",
            email: user?.email || "",
        });
        setHasChanges(false);
    }, [user]);

    // Handle profile picture upload
    const handlePicChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setErrorMessage("File size too big! Please select an image under 5MB.");
            setTimeout(() => setErrorMessage(null), 3000);
            return;
        }

        try {
            if (user?.avatar_url) {
                try {
                    await edgestore.publicImages.delete({url: user.avatar_url});
                    console.log("Old avatar deleted:", user.avatar_url); // REMOVE IN PRODUCTION
                } catch (err) {
                    console.warn("Failed to delete old avatar (ignored):", err);
                }
            }

            const res = await edgestore.publicImages.upload({
                file,
                onProgressChange: (progress: number) => console.log("Upload progress:", progress)
            });

            // Update Zustand store
            updateUser({avatar_url: res.url});

            // Update backend
            if (user) {
                const updatedUser: UpdateUserProfileReq = {
                    display_name: user.display_name,
                    avatar_url: res.url,
                };
                await updateUserMe(updatedUser);
            }

        } catch (err) {
            console.error("Image upload failed.", err);
        }

        setShowOptions(false);
    };

    const handleRemovePic = async () => {
        try {
            if (!user?.avatar_url) {
                console.warn("No avatar to delete");
                return;
            }

            console.log("Trying to delete:", user.avatar_url);

            await edgestore.publicImages.delete({url: user.avatar_url});

            // Update backend profile
            const updatedUser: UpdateUserProfileReq = {
                display_name: user.display_name,
                avatar_url: null,
            };
            await updateUserMe(updatedUser);

            console.log("Deleted file at:", user.avatar_url);
        } catch (err: any) {
            console.error("EdgeStore delete failed:", err.message ?? err);
        } finally {
            updateUser({avatar_url: null});
            setShowOptions(false);
        }
    };

    // Handle input change
    const handleFieldChange = (field: keyof typeof fields, value: string) => {
        setFields((prev) => ({...prev, [field]: value}));
        setHasChanges(true);
    };

    // Save changes handler
    const handleSave = async () => {
        if (!user) return;
        try {
            const updatedUser: UpdateUserProfileReq = {
                display_name: fields["display name"],
                avatar_url: user.avatar_url ?? null,
            };

            await updateUserMe(updatedUser);
            updateUser(updatedUser);
            setHasChanges(false);
            setEditingField(null);
        } catch (err: any) {
            setErrorMessage("Failed to save changes." + err.message);
            setTimeout(() => setErrorMessage(null), 3000);
        }
    };

    const handleBlur = () => setEditingField(null);

    const handleSignOut = async () => {
        try {
            await authSignOut();
            localStorage.removeItem("userProfile");
            setUser({} as UserMeRes);

            if (document.cookie.split('; ').find(row => row.startsWith('remember_me='))) {
                document.cookie = `remember_me=false; max-age=0; path=/; samesite=lax`;
            }

            router.push('/signin');
        } catch (err: any) {
            console.error(err?.message || "Sign out failed");
        }
    };

    return (
        <div className="flex flex-col justify-between gap-8 bg-white mt-4">
            {/* Profile Image */}
            <div className="flex flex-col items-center mb-6">
                <div
                    className="w-24 h-24 overflow-hidden rounded-full cursor-pointer group relative"
                    onClick={() => {
                        if (user?.avatar_url) setShowOptions(!showOptions);
                        else document.getElementById("fileUpload")?.click();
                    }}
                >
                    {user?.avatar_url ? (
                        <Image
                            src={user.avatar_url}
                            alt="Profile"
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            style={{objectFit: "cover"}}
                        />
                    ) : (
                        <div className="flex items-center justify-center w-full h-full bg-gray-200">
                            <HiOutlineUser size={40} className="text-gray-500"/>
                        </div>
                    )}

                    <div
                        className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-75 transition">
                        <FaPen className="text-white text-lg"/>
                    </div>
                </div>

                {user?.avatar_url && showOptions && (
                    <div
                        ref={optionsRef}
                        className="absolute mt-28 bg-white border border-[#dcd9d3] shadow-lg rounded-lg w-32 text-sm z-50"
                    >
                        <label
                            htmlFor="fileUpload"
                            className="block px-4 py-2 cursor-pointer hover:bg-gray-100 rounded-t-lg"
                        >
                            Change
                        </label>
                        <div className="flex-grow h-px bg-gray-600 opacity-35"/>
                        <button
                            onClick={handleRemovePic}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-b-lg"
                        >
                            Remove
                        </button>
                    </div>
                )}

                <input
                    type="file"
                    accept="image/*"
                    id="fileUpload"
                    className="hidden"
                    onChange={handlePicChange}
                />

                {errorMessage && (
                    <div className="mt-3 text-red-500 text-sm bg-red-100 px-3 py-1 rounded-md animate-fadeIn">
                        {errorMessage}
                    </div>
                )}
            </div>

            {/* Editable Fields */}
            <div className="space-y-4">
                {(["display name", "username", "email"] as (keyof typeof fields)[]).map((field) => (
                    <div key={field}>
                        <label className="block text-sm text-gray-500 capitalize">
                            {field === "username" ? "username" : field}
                        </label>
                        <div
                            className={`flex justify-between items-center group relative ${field === "display name" ? "cursor-pointer" : ""}`}
                            onClick={() => {
                                if (field === "display name") setEditingField(field);
                            }}
                        >
                            {editingField === field && field === "display name" ? (
                                <input
                                    type="text"
                                    value={fields[field]}
                                    onChange={(e) => handleFieldChange(field, e.target.value)}
                                    onBlur={handleBlur}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleSave();
                                    }}
                                    autoFocus
                                    className="border-b border-gray-300 focus:outline-none px-1"
                                />
                            ) : (
                                <p className="text-gray-800 select-none">
                                    {field === "username" ? `@${fields[field]}` : fields[field]}
                                </p>
                            )}
                            {/* Display copy icon on hover */}
                            <FaCopy
                                className="ml-2 text-gray-400 opacity-0 group-hover:opacity-100 cursor-pointer transition"
                                onClick={(e) => {
                                    e.stopPropagation(); // prevent triggering edit
                                    navigator.clipboard.writeText(fields[field]);
                                }}
                                title="Copy to clipboard"
                            />
                            {field === "display name" && (
                                <FaPen className="text-black opacity-0 group-hover:opacity-100 ml-2"/>
                            )}
                        </div>
                    </div>
                ))}

                {/* Social Links */}
                <div className="gap-5">
                    <label className="block text-sm text-gray-500">Social Links</label>
                    <button className="flex items-center gap-1 text-blue-600 mt-2">
                        <FaPlus/> Add Social Link
                    </button>
                </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-between items-center">
                <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-[#cb3b40] font-base border py-1 px-4 border-[#dcd9d3] hover:bg-[#ebc8ca] hover:border-none rounded-lg cursor-pointer"
                >
                    Sign Out
                </button>
                <button
                    className="flex justify-end items-center border mr-4 py-1 px-4 rounded-lg border-[#dcd9d3] text-[#222831] hover:bg-[#78C841] hover:text-[#F0F0F0] hover:border-none cursor-pointer disabled:opacity-50"
                    onClick={handleSave}
                    disabled={!hasChanges}
                >
                    Save Changes
                </button>
            </div>
        </div>
    );
}
