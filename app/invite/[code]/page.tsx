"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { acceptInvite, getPublicInviteInfo, InviteInfo } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    (async () => {
      setLoading(true);
      const info = await getPublicInviteInfo(code);
      if (info) setInvite(info);
      else setError("Invite not found or expired");
      setLoading(false);
    })();
  }, [code]);

  const handleAccept = async () => {
    setAccepting(true);
    setError(null);
    const res = await acceptInvite(code);
    setAccepting(false);
    if (res) router.push("/home");
    else setError("Failed to accept invite. You may need to sign in first.");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EAE4D5]">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EAE4D5] p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        {error && !invite ? (
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid Invite</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              type="button"
              onClick={() => router.push("/home")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Go Home
            </button>
          </>
        ) : invite ? (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re invited!</h1>
            <p className="text-gray-600 mb-6">
              Join <strong>{invite.hall_name}</strong>
            </p>
            {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
            <button
              type="button"
              onClick={handleAccept}
              disabled={accepting}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {accepting ? "Joining..." : "Accept Invite"}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
