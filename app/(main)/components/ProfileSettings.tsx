'use client';

import { useState, ChangeEvent, useEffect, useRef } from "react";
import { FaPen, FaTrash, FaPlus } from "react-icons/fa";
import { HiOutlineUser } from "react-icons/hi2";

interface UserProfile {
  displayName: string;
  username: string;
  email: string;
  phone?: string;
  socials: string[];
}

const initialUser: UserProfile = {
  displayName: "Manish Lama",
  username: "moleguy5",
  email: "tamangmanish446@gmail.com",
  phone: "",
  socials: ["https://www.instagram.com/lamadoesart/"]
};

export default function ProfileSettings() {
  const [preview, setPreview] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [user, setUser] = useState<UserProfile>(initialUser);
  const optionsRef = useRef<HTMLDivElement | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);

  // profile pic handling when clicked outside the options is removed
  useEffect(() => {
    if(!showOptions) return;

    const handleClickOutside = (e: MouseEvent) => {
      if(
        optionsRef.current &&
        !optionsRef.current.contains(e.target as Node)
      ) {
        setShowOptions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showOptions]);

  // loading profile on mount
  useEffect(() => {
    const saved = localStorage.getItem("userProfile");
    if (saved) {
      const parsed = JSON.parse(saved);
      setUser(parsed.user || initialUser);
      setPreview(parsed.preview || null);
    }
  }, []);

  const saveProfile = (newUser = user, newPreview = preview) => {
    localStorage.setItem("userProfile", JSON.stringify({user: newUser, preview: newPreview}));
  }

  // handling profile picture
  const handlePicChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        saveProfile(user, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    setShowOptions(false);
  };

  // removing profile picture
  const handleRemovePic = () => {
    setPreview(null);
    saveProfile(user, null);
    setShowOptions(false);
  };

  // handling text fields
  const handleFieldChange = (field: keyof UserProfile, value: string) => {
    const newUser = { ...user, [field]: value };
    setUser(newUser);
    saveProfile(newUser, preview);
  };

  const handleBlur = () => {
    setEditingField(null);
  };

  // handline social medias
  const handleSocialChange = (index: number, value: string) => {
    const newSocials = [...user.socials];
    newSocials[index] = value;
    const newUser = { ...user, socials: newSocials };
    setUser(newUser);
    saveProfile(newUser, preview);
  };

  // adding a link in social fields
  const addSocial = () => {
    const newUser = { ...user, socials: [...user.socials, ""] };
    setUser(newUser);
    saveProfile(newUser, preview);
  };

  // deleting social link from the field
  const removeSocial = (index: number) => {
    const newUser = { ...user, socials: user.socials.filter((_, i) => i !== index) };
    setUser(newUser);
    saveProfile(newUser, preview);
  };

  return (
    <div className="bg-white mt-4">
      {/* Profile Image */}
      <div className="flex flex-col items-center mb-6">
        <div
          className="w-24 h-24 overflow-hidden rounded-full cursor-pointer group relative"
          onClick={() => {
            if (preview) setShowOptions(!showOptions);
            else document.getElementById("fileUpload")?.click();
          }}
        >
          {preview ? (
            <img
              src={preview}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-gray-200">
              <HiOutlineUser size={40} className="text-gray-500" />
            </div>
          )}
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-75 transition">
            <FaPen className="text-white text-lg" />
          </div>
        </div>

        {preview && showOptions && (
          <div 
            ref={optionsRef}
            className="absolute mt-28 bg-white border border-[#dcd9d3] shadow-lg rounded-lg w-32 text-sm z-50"
          >
            <label
              htmlFor="fileUpload"
              className="block px-4 py-2 cursor-pointer hover:bg-gray-100 rounded-md"
            >
              Change
            </label>
            <button
              onClick={handleRemovePic}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-md"
            >
              Remove
            </button>
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          id="fileUpload"
          onChange={handlePicChange}
          className="hidden"
        />
      </div>

      {/* Editable Fields */}
      <div className="space-y-4">
        {["display name", "username", "email", "phone number"].map((field) => (
          <div key={field}>
            <label className="block text-sm text-gray-500 capitalize">
              {field === "username" ? "@username" : field}
            </label>
            {editingField === field ? (
              <input
                autoFocus
                type="text"
                value={user[field as keyof UserProfile] || ""}
                onChange={(e) =>
                  handleFieldChange(field as keyof UserProfile, e.target.value)
                }
                onBlur={handleBlur}
                onKeyDown={(e) => e.key === "Enter" && handleBlur()}
                className="w-full border-b border-blue-500 focus:outline-none"
              />
            ) : (
              <div
                className="flex justify-between items-center cursor-pointer group"
                onClick={() => setEditingField(field)}
              >
                <p className="text-gray-800">
                  {user[field as keyof UserProfile] || "Not set"}
                </p>
                <FaPen className="text-black opacity-0 group-hover:opacity-100" />
              </div>
            )}
          </div>
        ))}

        {/* Social Links */}
        <div>
          <label className="block text-sm text-gray-500">Social Links</label>
          {user.socials.map((link, index) => (
            <div key={index} className="flex items-center gap-2 mb-2">
              <input
                type="url"
                value={link}
                onChange={(e) => handleSocialChange(index, e.target.value)}
                onBlur={handleBlur}
                placeholder="Your social link here ..."
                className="flex-1 border-b border-gray-300 focus:border-blue-500 focus:outline-none mb-3"
              />
              <button
                onClick={() => removeSocial(index)}
                className="text-red-500 hover:text-red-700"
              >
                <FaTrash />
              </button>
            </div>
          ))}
          <button
            onClick={addSocial}
            className="flex items-center gap-1 text-blue-600 mt-2"
          >
            <FaPlus /> Add Social Link
          </button>
        </div>
      </div>

      {/* Sign Out logic here */}
      <div className="mt-6">
        <button
          onClick={() => {
            console.log("Sign out clicked");
          }}
          className="flex items-center gap-2 text-red-600 font-base border py-1 px-4 border-[#dcd9d3] rounded-md cursor-pointer"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
