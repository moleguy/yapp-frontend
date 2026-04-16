"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelectedHall, useUpdateHall, useRemoveHall } from "@/app/store/useHallStore";
import { updateHall as updateHallApi, deleteHall as deleteHallApi } from "@/lib/api";
import { useUser } from "@/app/store/useUserStore";

export default function HallProfileSettings() {
  const params = useParams();
  const router = useRouter();
  const hallId = params.hallId as string;
  const hall = useSelectedHall();
  const updateHallStore = useUpdateHall();
  const removeHallStore = useRemoveHall();
  const user = useUser();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const isOwner = hall?.owner_id === user?.id;

  useEffect(() => {
    if (hall) {
      setName(hall.name);
      setDescription(hall.description || "");
    }
  }, [hall]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hallId) return;

    setLoading(true);
    setMessage(null);

    try {
      const updatedHall = await updateHallApi(hallId, { name, description });
      if (updatedHall) {
        updateHallStore(hallId, { name, description });
        setMessage({ type: "success", text: "Hall profile updated successfully!" });
      } else {
        setMessage({ type: "error", text: "Failed to update hall profile." });
      }
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "An error occurred." });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!hallId || !window.confirm("Are you sure you want to delete this hall? This action cannot be undone.")) return;

    setLoading(true);
    try {
      const success = await deleteHallApi(hallId);
      if (success) {
        removeHallStore(hallId);
        router.push("/home");
      } else {
        setMessage({ type: "error", text: "Failed to delete hall." });
      }
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "An error occurred." });
    } finally {
      setLoading(false);
    }
  };

  if (!hall) return null;

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1e1e1e] mb-2">Hall Profile</h1>
        <p className="text-[#73726e]">
          Customize your hall's identity.
        </p>
      </div>

      <form onSubmit={handleUpdate} className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Hall Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-[#dcd9d3] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[#f9f9f9]"
            required
            disabled={!isOwner}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-[#dcd9d3] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[#f9f9f9]"
            placeholder="Tell people what this hall is about..."
            disabled={!isOwner}
          />
        </div>

        {message && (
          <div className={`p-4 rounded-lg text-sm ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {message.text}
          </div>
        )}

        {isOwner && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </form>

      {isOwner && (
        <div className="pt-8 border-t border-gray-200">
          <h3 className="text-lg font-bold text-red-600 mb-2">Danger Zone</h3>
          <p className="text-sm text-gray-600 mb-4">
            Deleting a hall is permanent. All rooms, messages, and data will be lost.
          </p>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-6 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            Delete Hall
          </button>
        </div>
      )}

      {!isOwner && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-700">
            Only the hall owner can modify these settings.
          </p>
        </div>
      )}
    </div>
  );
}
