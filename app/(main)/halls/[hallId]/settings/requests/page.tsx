"use client";

import { EmptyState, LoadingState } from "@/app/(main)/components/FeedbackStates";
import { SettingsNotice } from "@/app/(main)/components/UserSettingsContent";
import { Inbox } from "lucide-react";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSelectHall, useSelectedHall } from "@/app/store/useHallStore";
import { useUser } from "@/app/store/useUserStore";
import {
  getJoinRequests,
  acceptJoinRequest,
  declineJoinRequest,
  HallJoinRequest,
} from "@/lib/api";
import { HiOutlineCheck, HiOutlineXMark } from "react-icons/hi2";

export default function HallJoinRequestsSettings() {
  const params = useParams();
  const hallId = params.hallId as string;
  const selectHall = useSelectHall();
  const hall = useSelectedHall();
  const user = useUser();

  const [requests, setRequests] = useState<HallJoinRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    if (!hallId) return;
    setLoading(true);
    try {
      const res = await getJoinRequests(hallId);
      if (res) {
        setRequests(res.requests || []);
        setTotal(res.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hallId) {
      selectHall(hallId);
    }
  }, [hallId, selectHall]);

  useEffect(() => {
    if (hallId && hall?.is_private) {
      load();
    }
  }, [hallId, hall?.is_private]);

  const onAccept = async (requestId: string) => {
    if (!hallId) return;
    setBusyId(requestId);
    try {
      const ok = await acceptJoinRequest(hallId, requestId);
      if (ok) await load();
    } finally {
      setBusyId(null);
    }
  };

  const onDecline = async (requestId: string) => {
    if (!hallId) return;
    setBusyId(requestId);
    try {
      const ok = await declineJoinRequest(hallId, requestId);
      if (ok) await load();
    } finally {
      setBusyId(null);
    }
  };

  if (!hall) return null;

  const isOwner = hall.owner_id === user?.id;

  if (!hall.is_private) {
    return (
      <SettingsNotice>
        Join requests only apply to private halls. This hall is public.
      </SettingsNotice>
    );
  }

  return (
    <div className="space-y-6">
      {total > 0 ? (
        <p className="text-list-muted">{total} pending request{total === 1 ? "" : "s"}.</p>
      ) : null}

      <div className="bg-surface-card border border-default rounded-xl overflow-hidden">
        {loading ? (
          <LoadingState message="Loading requests…" fullHeight={false} />
        ) : requests.length === 0 ? (
          <EmptyState
            title="No pending requests"
            description="Join requests for this private hall will appear here."
            icon={<Inbox className="w-7 h-7" />}
            fullHeight={false}
          />
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-default text-xs font-semibold text-list-muted uppercase tracking-wider">
                <th className="px-4 py-3">User ID</th>
                <th className="px-4 py-3">Requested</th>
                {isOwner && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-list-hover">
                  <td className="px-4 py-3 font-mono text-sm">{r.user_id}</td>
                  <td className="px-4 py-3 text-sm text-secondary">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  {isOwner && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onAccept(r.id)}
                          disabled={busyId === r.id}
                          className="p-2 rounded-lg text-green-700 hover:bg-green-50 disabled:opacity-50"
                          title="Accept"
                        >
                          <HiOutlineCheck size={22} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDecline(r.id)}
                          disabled={busyId === r.id}
                          className="p-2 rounded-lg text-destructive hover:bg-destructive-muted disabled:opacity-50"
                          title="Decline"
                        >
                          <HiOutlineXMark size={22} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!isOwner && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          Only moderators with the right permissions can manage join requests.
        </div>
      )}
    </div>
  );
}
