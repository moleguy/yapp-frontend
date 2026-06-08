"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { acceptInvite, getPublicInviteInfo, InviteInfo } from "@/lib/api";
import { LoadingState, ErrorState, InlineError } from "@/app/(main)/components/FeedbackStates";

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
      <div className="min-h-screen flex items-center justify-center bg-surface-shell">
        <LoadingState message="Loading invite…" fullHeight={false} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-shell p-4">
      <div className="bg-surface-card rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        {error && !invite ? (
          <ErrorState
            title="Invalid invite"
            message={error}
            action={{ label: "Go Home", onClick: () => router.push("/home") }}
            fullHeight={false}
          />
        ) : invite ? (
          <>
            <h1 className="text-2xl font-bold text-heading mb-2">You&apos;re invited!</h1>
            <p className="text-secondary mb-6">
              Join <strong>{invite.hall_name}</strong>
            </p>
            {error && <InlineError message={error} className="mb-4" />}
            <button
              type="button"
              onClick={handleAccept}
              disabled={accepting}
              className="w-full px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50"
            >
              {accepting ? "Joining..." : "Accept Invite"}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
