"use client";



import React, { useState, useEffect, useRef, ChangeEvent } from "react";

import { useRouter } from "next/navigation";

import Image from "next/image";

import { FaPen, FaPlus, FaCopy } from "react-icons/fa";

import { HiOutlineUser } from "react-icons/hi2";

import { Loader2 } from "lucide-react";
import { IoIosClose } from "react-icons/io";

import TagManager from "@/app/(main)/components/TagManager";
import Modal from "@/app/(main)/components/Modal";
import {
  SettingsForm,
  SettingsField,
  SETTINGS_INPUT_CLASS,
} from "@/app/(main)/components/UserSettingsContent";

import { ContextMenuList, contextMenuPanelClass } from "@/app/(main)/components/ContextMenu";

import { copyTextToClipboard } from "@/lib/clipboard";
import { preloadImage } from "@/lib/preloadImage";



import { useEdgeStore } from "@/lib/edgestore";

import {

  useUserStore,

  useUpdateUser,

  useSetUser,

  useAvatar,

  useSetAvatarPreviewUrl,

  useClearAvatarPreviewUrl,

} from "@/app/store/useUserStore";

import {

  authSignOut,

  updateUserMe,

  UpdateUserMeReq,

  UserMeRes,

} from "@/lib/api";



type ProfileField = "display name" | "username" | "email";



const FIELD_LABELS: Record<ProfileField, string> = {

  "display name": "Display Name",

  username: "Username",

  email: "Email",

};

const DISPLAY_NAME_MAX_LENGTH = 32;

const DISPLAY_NAME_MIN_LENGTH = 3;

function validateDisplayName(name: string): string | null {

  const trimmed = name.trim().replace(/\s+/g, " ");

  const length = [...trimmed].length;

  if (!trimmed) return "Display name cannot be empty.";

  if (length < DISPLAY_NAME_MIN_LENGTH) {

    return `Display name must be at least ${DISPLAY_NAME_MIN_LENGTH} characters.`;

  }

  if (length > DISPLAY_NAME_MAX_LENGTH) {

    return `Display name must be ${DISPLAY_NAME_MAX_LENGTH} characters or fewer.`;

  }

  return null;

}

function formatSaveError(message: string): string {

  if (

    message === "Invalid Data" ||

    message.includes("Invalid Display Name")

  ) {

    return `Display name must be ${DISPLAY_NAME_MIN_LENGTH}–${DISPLAY_NAME_MAX_LENGTH} characters.`;

  }

  return message.startsWith("Failed to save")

    ? message

    : `Failed to save changes. ${message}`;

}



export default function ProfileSettings() {

  const router = useRouter();

  const optionsRef = useRef<HTMLDivElement | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);



  const user = useUserStore((state) => state.user);

  const setUser = useSetUser();

  const updateUser = useUpdateUser();

  const setAvatarPreviewUrl = useSetAvatarPreviewUrl();

  const clearAvatarPreviewUrl = useClearAvatarPreviewUrl();

  const { edgestore } = useEdgeStore();

  const previewRef = useRef<string | null>(null);



  const [showOptions, setShowOptions] = useState(false);
  const [showAvatarViewer, setShowAvatarViewer] = useState(false);

  const [editingField, setEditingField] = useState<ProfileField | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [copiedField, setCopiedField] = useState<ProfileField | null>(null);

  const [avatarStatus, setAvatarStatus] = useState<"idle" | "uploading" | "removing">("idle");

  const [uploadProgress, setUploadProgress] = useState(0);

  const [fields, setFields] = useState({

    "display name": user?.display_name || "",

    username: user?.username || "",

    email: user?.email || "",

  });

  const [hasChanges, setHasChanges] = useState(false);



  const avatarPreviewUrl = useUserStore((state) => state.avatarPreviewUrl);
  const { avatarUrl, avatarThumbnailUrl, hasAvatar } = useAvatar();
  const profilePictureViewUrl =
    avatarPreviewUrl || avatarUrl || avatarThumbnailUrl;

  const avatarBusy = avatarStatus !== "idle";



  useEffect(() => {

    if (!showOptions) return;

    const handleClickOutside = (e: MouseEvent) => {

      if (

        optionsRef.current &&

        !optionsRef.current.contains(e.target as Node)

      ) {

        setShowOptions(false);

      }

    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);

  }, [showOptions]);



  useEffect(() => {

    setFields({

      "display name": user?.display_name || "",

      username: user?.username || "",

      email: user?.email || "",

    });

    setHasChanges(false);

  }, [user]);



  const revokePreview = () => {

    if (previewRef.current) {

      URL.revokeObjectURL(previewRef.current);

      previewRef.current = null;

    }

    clearAvatarPreviewUrl();

  };



  const setLocalPreview = (file: File) => {

    revokePreview();

    const preview = URL.createObjectURL(file);

    previewRef.current = preview;

    setAvatarPreviewUrl(preview);

  };



  const handlePicChange = async (e: ChangeEvent<HTMLInputElement>) => {

    const file = e.target.files?.[0];

    if (!file) return;



    if (file.size > 5 * 1024 * 1024) {

      setErrorMessage("File size too big! Please select an image under 5MB.");

      setTimeout(() => setErrorMessage(null), 3000);

      return;

    }



    setLocalPreview(file);

    setAvatarStatus("uploading");

    setUploadProgress(0);

    setErrorMessage(null);



    const previousAvatarUrl = user?.avatar_url ?? null;



    try {

      const res = await edgestore.publicImages.upload({

        file,

        onProgressChange: (progress: number) => setUploadProgress(progress),

      });



      const thumbnailUrl = res.thumbnailUrl || res.url;



      updateUser({

        avatar_url: res.url,

        avatar_thumbnail_url: thumbnailUrl,

      });



      if (user) {

        const updatedUser: UpdateUserMeReq = {

          display_name: user.display_name,

          avatar_url: res.url,

          avatar_thumbnail_url: thumbnailUrl,

        };

        const saved = await updateUserMe(updatedUser);

        if (saved) {

          updateUser({

            avatar_url: saved.avatar_url ?? res.url,

            avatar_thumbnail_url: saved.avatar_thumbnail_url ?? thumbnailUrl,

          });

        }

      }



      const remoteReady = await preloadImage(thumbnailUrl);

      if (remoteReady) {

        revokePreview();

      }



      if (previousAvatarUrl && previousAvatarUrl !== res.url) {

        void edgestore.publicImages.delete({ url: previousAvatarUrl }).catch((err) => {

          console.warn("Failed to delete old user profile picture (ignored):", err);

        });

      }

    } catch (err) {

      console.error("Image upload failed.", err);

      revokePreview();

      setErrorMessage("Failed to upload user profile picture. Please try again.");

      setTimeout(() => setErrorMessage(null), 3000);

    } finally {

      setAvatarStatus("idle");

      setUploadProgress(0);

      setShowOptions(false);

      if (fileInputRef.current) fileInputRef.current.value = "";

    }

  };



  const handleRemovePic = async () => {

    if (!user?.avatar_url) return;



    setAvatarStatus("removing");

    setErrorMessage(null);



    try {

      await edgestore.publicImages.delete({ url: user.avatar_url });



      const updatedUser: UpdateUserMeReq = {

        display_name: user.display_name,

        avatar_url: null,

        avatar_thumbnail_url: null,

      };

      await updateUserMe(updatedUser);

    } catch (err: unknown) {

      const errorMsg =

        typeof err === "object" && err !== null && "message" in err

          ? String((err as Record<string, unknown>).message)

          : String(err);

      console.error("EdgeStore delete failed:", errorMsg);

      setErrorMessage("Failed to remove user profile picture. Please try again.");

      setTimeout(() => setErrorMessage(null), 3000);

    } finally {

      revokePreview();

      updateUser({ avatar_url: null, avatar_thumbnail_url: null });

      setAvatarStatus("idle");

      setShowOptions(false);

    }

  };



  useEffect(() => () => revokePreview(), []);



  const handleFieldChange = (field: ProfileField, value: string) => {

    setFields((prev) => ({ ...prev, [field]: value }));

    setHasChanges(true);

  };



  const getCopyValue = (field: ProfileField) => fields[field];



  const getDisplayValue = (field: ProfileField) =>

    field === "username" ? `@${fields[field]}` : fields[field];



  const handleCopy = (field: ProfileField) => {

    const value = getCopyValue(field);

    if (!value) return;



    if (copyTextToClipboard(value)) {

      setCopiedField(field);

      setTimeout(() => setCopiedField(null), 2000);

      return;

    }



    setErrorMessage("Copy failed — clipboard access not available");

    setTimeout(() => setErrorMessage(null), 3000);

  };



  const showError = (message: string) => {

    setErrorMessage(message);

    setTimeout(() => setErrorMessage(null), 4000);

  };



  const handleSave = async () => {

    if (!user) return;



    const displayName = fields["display name"].trim().replace(/\s+/g, " ");

    const validationError = validateDisplayName(displayName);

    if (validationError) {

      showError(validationError);

      return;

    }



    try {

      const updatedUser: UpdateUserMeReq = {

        display_name: displayName,

        avatar_url: user.avatar_url ?? null,

        avatar_thumbnail_url: user.avatar_thumbnail_url ?? null,

      };



      const saved = await updateUserMe(updatedUser);

      if (!saved) {

        showError("Failed to save profile. Please try again.");

        return;

      }



      updateUser({

        display_name: saved.display_name,

        avatar_url: saved.avatar_url ?? undefined,

        avatar_thumbnail_url: saved.avatar_thumbnail_url ?? undefined,

      });

      setFields((prev) => ({ ...prev, "display name": saved.display_name }));

      setHasChanges(false);

      setEditingField(null);

      setErrorMessage(null);

    } catch (err: unknown) {

      const errorMsg =

        err instanceof Error

          ? err.message

          : typeof err === "object" && err !== null && "message" in err

            ? String((err as Record<string, unknown>).message)

            : "Request failed";

      showError(formatSaveError(errorMsg));

    }

  };



  const handleBlur = () => setEditingField(null);



  const handleSignOut = async () => {

    try {

      await authSignOut();

      localStorage.removeItem("userProfile");

      setUser({} as UserMeRes);



      if (

        document.cookie

          .split("; ")

          .find((row) => row.startsWith("remember_me="))

      ) {

        document.cookie = `remember_me=false; max-age=0; path=/; samesite=lax`;

      }



      router.push("/signin");

    } catch (err: unknown) {

      const errorMsg =

        typeof err === "object" && err !== null && "message" in err

          ? String((err as Record<string, unknown>).message)

          : "Sign out failed";

      console.error(errorMsg);

    }

  };



  const openFilePicker = () => {

    if (avatarBusy) return;

    fileInputRef.current?.click();

  };



  return (

    <div className="space-y-8">

      {errorMessage && (

        <div className="text-sm text-destructive bg-destructive-muted border border-destructive px-3 py-2 rounded-lg">

          {errorMessage}

        </div>

      )}



      <div className="flex flex-col items-center">

        <div

          className={`w-32 h-32 overflow-hidden rounded-full group relative ${avatarBusy ? "pointer-events-none" : "cursor-pointer"}`}

          onClick={() => {

            if (avatarBusy) return;

            if (hasAvatar) setShowOptions(!showOptions);

            else openFilePicker();

          }}

        >

          {hasAvatar ? (

            <Image

              key={avatarThumbnailUrl}

              src={avatarThumbnailUrl}

              alt="User profile picture"

              fill

              sizes="128px"

              unoptimized

              style={{ objectFit: "cover" }}

            />

          ) : (

            <div className="flex items-center justify-center w-full h-full bg-surface-control">

              <HiOutlineUser size={52} className="text-list-muted" />

            </div>

          )}



          {!avatarBusy && (

            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-75 transition">

              <FaPen className="text-white text-lg" />

            </div>

          )}



          {avatarBusy && (

            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-full bg-black/60">

              <Loader2 className="h-8 w-8 animate-spin text-white" aria-hidden />

              <span className="mt-2 text-xs font-medium text-white">

                {avatarStatus === "removing"

                  ? "Removing…"

                  : uploadProgress > 0

                    ? `Uploading ${Math.round(uploadProgress)}%`

                    : "Uploading…"}

              </span>

            </div>

          )}

        </div>



        {hasAvatar && showOptions && !avatarBusy && (

          <div ref={optionsRef} className={`${contextMenuPanelClass("absolute")} w-52 mt-36`}>

            <ContextMenuList

              items={[

                {

                  label: "View user profile picture",

                  onClick: () => {

                    setShowOptions(false);

                    setShowAvatarViewer(true);

                  },

                },

                {

                  label: "Change",

                  onClick: openFilePicker,

                },

                {

                  label: "Remove",

                  danger: true,

                  onClick: handleRemovePic,

                  disabled: !user?.avatar_url,

                },

              ]}

            />

          </div>

        )}



        <Modal

          isOpen={showAvatarViewer}

          onClose={() => setShowAvatarViewer(false)}

          panelClassName="relative flex max-h-[92vh] max-w-[min(92vw,40rem)] flex-col items-center"

          overlayClassName="bg-black/80"

        >

          <button

            type="button"

            onClick={() => setShowAvatarViewer(false)}

            className="absolute -top-10 right-0 text-white/80 transition hover:text-white"

            aria-label="Close user profile picture viewer"

          >

            <IoIosClose size={32} />

          </button>

          {profilePictureViewUrl ? (

            <Image

              key={profilePictureViewUrl}

              src={profilePictureViewUrl}

              alt={`${user?.display_name || "User"}'s user profile picture`}

              width={640}

              height={640}

              unoptimized

              className="max-h-[85vh] w-auto max-w-full rounded-2xl object-contain"

            />

          ) : null}

        </Modal>



        <input

          ref={fileInputRef}

          type="file"

          accept="image/*"

          className="hidden"

          disabled={avatarBusy}

          onChange={handlePicChange}

        />



      </div>



      <SettingsForm>

        {(["display name", "username", "email"] as ProfileField[]).map((field) => (

          <SettingsField key={field} label={FIELD_LABELS[field]}>

            <div className="relative">

              {editingField === field && field === "display name" ? (

                <input

                  type="text"

                  value={fields[field]}

                  maxLength={DISPLAY_NAME_MAX_LENGTH}

                  onChange={(e) => handleFieldChange(field, e.target.value)}

                  onBlur={handleBlur}

                  onKeyDown={(e) => {

                    if (e.key === "Enter") handleSave();

                  }}

                  autoFocus

                  className={`${SETTINGS_INPUT_CLASS} pr-20`}

                />

              ) : (

                <input

                  type="text"

                  readOnly

                  value={getDisplayValue(field)}

                  className={`${SETTINGS_INPUT_CLASS} pr-20 cursor-default`}

                />

              )}

              <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-4">

                {field === "display name" &&

                  editingField !== field &&

                  !avatarBusy && (

                    <button

                      type="button"

                      className="text-list-muted opacity-70 transition hover:text-heading hover:opacity-100"

                      onClick={() => setEditingField("display name")}

                      title="Edit display name"

                      aria-label="Edit display name"

                    >

                      <FaPen className="text-base" />

                    </button>

                  )}

                <button

                  type="button"

                  className="text-list-muted opacity-70 transition hover:text-heading hover:opacity-100"

                  onClick={() => handleCopy(field)}

                  title="Copy to clipboard"

                  aria-label={`Copy ${FIELD_LABELS[field]}`}

                >

                  <FaCopy className="text-base" />

                </button>

              </div>

              {copiedField === field && (

                <div className="absolute right-0 top-full z-10 mt-1 whitespace-nowrap rounded bg-surface-inverse px-2 py-1 text-xs text-white shadow-lg animate-fadeIn">

                  Copied!

                </div>

              )}

            </div>

          </SettingsField>

        ))}



        <SettingsField label="Tags">

          <TagManager />

        </SettingsField>



        <SettingsField label="Social Links">

          <button type="button" className="flex items-center gap-1 text-primary">

            <FaPlus /> Add Social Link

          </button>

        </SettingsField>



        <div className="flex justify-end">

          <button

            type="button"

            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"

            onClick={handleSave}

            disabled={!hasChanges}

          >

            Save Changes

          </button>

        </div>

      </SettingsForm>



      <div className="pt-8 border-t border-subtle">

        <h3 className="text-lg font-bold text-destructive mb-2">Sign Out</h3>

        <p className="text-sm text-secondary mb-4">

          Sign out of your account on this device.

        </p>

        <button

          type="button"

          onClick={handleSignOut}

          className="px-6 py-2 border border-destructive text-destructive rounded-lg hover:bg-destructive-muted transition-colors"

        >

          Sign Out

        </button>

      </div>

    </div>

  );

}


