"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { FaPen } from "react-icons/fa";
import { IoIosClose } from "react-icons/io";
import { useSelectedHall, useUpdateHall, useRemoveHall, useSelectHall } from "@/app/store/useHallStore";
import { LoadingState } from "@/app/(main)/components/FeedbackStates";
import { patchHallProfile, deleteHall as deleteHallApi } from "@/lib/api";
import { useUser } from "@/app/store/useUserStore";
import { useDialog } from "@/app/contexts/DialogContext";
import Modal from "@/app/(main)/components/Modal";
import { ContextMenuList, contextMenuPanelClass } from "@/app/(main)/components/ContextMenu";

const HALL_ICON_CHANGE_UNAVAILABLE =
  "Hall profile picture change is not available yet.";

export default function HallProfileSettings() {
  const params = useParams();
  const router = useRouter();
  const hallId = params.hallId as string;
  const selectHall = useSelectHall();
  const hall = useSelectedHall();
  const updateHallStore = useUpdateHall();
  const removeHallStore = useRemoveHall();
  const user = useUser();
  const { confirm, alert: showAlert } = useDialog();
  const optionsRef = useRef<HTMLDivElement | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showIconOptions, setShowIconOptions] = useState(false);
  const [showIconViewer, setShowIconViewer] = useState(false);

  const isOwner = hall?.owner_id === user?.id;
  const hasIcon = !!(hall?.icon_url || hall?.icon_thumbnail_url);
  const iconThumbnailUrl = hall?.icon_thumbnail_url || hall?.icon_url || "";
  const iconViewUrl = hall?.icon_url || hall?.icon_thumbnail_url || "";

  useEffect(() => {
    if (hallId) {
      void selectHall(hallId);
    }
  }, [hallId, selectHall]);

  useEffect(() => {
    if (hall) {
      setName(hall.name);
      setDescription(hall.description || "");
    }
  }, [hall]);

  useEffect(() => {
    if (!showIconOptions) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(e.target as Node)) {
        setShowIconOptions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showIconOptions]);

  const notifyIconChangeUnavailable = async () => {
    await showAlert({
      title: "Not available",
      message: HALL_ICON_CHANGE_UNAVAILABLE,
    });
  };

  const handleIconClick = () => {
    if (!isOwner) return;
    if (hasIcon) {
      setShowIconOptions((prev) => !prev);
      return;
    }
    void notifyIconChangeUnavailable();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hallId) return;

    setLoading(true);
    setMessage(null);

    try {
      const updatedHall = await patchHallProfile(hallId, { name, description });
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
    if (!hallId || !(await confirm({
      title: "Delete Hall",
      message: "Are you sure you want to delete this hall? This action cannot be undone.",
      destructive: true,
    }))) return;

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

  if (!hall) {
    return <LoadingState message="Loading hall profile…" />;
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex flex-col items-center">
        <div
          className={`relative h-32 w-32 overflow-hidden rounded-2xl group ${
            isOwner ? "cursor-pointer" : ""
          }`}
          onClick={handleIconClick}
        >
          {hasIcon ? (
            <Image
              key={iconThumbnailUrl}
              src={iconThumbnailUrl}
              alt={`${hall.name} hall profile picture`}
              fill
              sizes="128px"
              unoptimized
              style={{ objectFit: "cover" }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-surface-placeholder text-3xl font-semibold text-heading">
              {hall.name[0]}
            </div>
          )}

          {isOwner && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 transition group-hover:opacity-75">
              <FaPen className="text-lg text-white" />
            </div>
          )}
        </div>

        {isOwner && hasIcon && showIconOptions && (
          <div ref={optionsRef} className={`${contextMenuPanelClass("absolute")} mt-36 w-52`}>
            <ContextMenuList
              items={[
                {
                  label: "View hall profile picture",
                  onClick: () => {
                    setShowIconOptions(false);
                    setShowIconViewer(true);
                  },
                },
                {
                  label: "Change",
                  onClick: () => {
                    setShowIconOptions(false);
                    void notifyIconChangeUnavailable();
                  },
                },
                {
                  label: "Remove",
                  danger: true,
                  onClick: () => {
                    setShowIconOptions(false);
                    void notifyIconChangeUnavailable();
                  },
                },
              ]}
            />
          </div>
        )}

        <Modal
          isOpen={showIconViewer}
          onClose={() => setShowIconViewer(false)}
          panelClassName="relative flex max-h-[92vh] max-w-[min(92vw,40rem)] flex-col items-center"
          overlayClassName="bg-black/80"
        >
          <button
            type="button"
            onClick={() => setShowIconViewer(false)}
            className="absolute -top-10 right-0 text-white/80 transition hover:text-white"
            aria-label="Close hall profile picture viewer"
          >
            <IoIosClose size={32} />
          </button>
          {iconViewUrl ? (
            <Image
              key={iconViewUrl}
              src={iconViewUrl}
              alt={`${hall.name} hall profile picture`}
              width={640}
              height={640}
              unoptimized
              className="max-h-[85vh] w-auto max-w-full rounded-2xl object-contain"
            />
          ) : null}
        </Modal>
      </div>

      <form onSubmit={handleUpdate} className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-strong uppercase tracking-wider">
            Hall Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-surface-elevated"
            required
            disabled={!isOwner}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-strong uppercase tracking-wider">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-surface-elevated"
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
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </form>

      {isOwner && (
        <div className="pt-8 border-t border-subtle">
          <h3 className="text-lg font-bold text-destructive mb-2">Danger Zone</h3>
          <p className="text-sm text-secondary mb-4">
            Deleting a hall is permanent. All rooms, messages, and data will be lost.
          </p>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="px-6 py-2 border border-destructive text-destructive rounded-lg hover:bg-destructive-muted transition-colors disabled:opacity-50"
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
