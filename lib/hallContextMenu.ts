import type { ContextMenuItem } from "@/app/(main)/components/ContextMenu";
import type { Hall } from "@/lib/api";

export function buildHallContextMenuItems({
  hallId,
  hall,
  currentUserId,
  onInvite,
  onCreateFloor,
  onCreateRoom,
  onLeaveHall,
  onClose,
}: {
  hallId: string;
  hall: Hall | undefined;
  currentUserId?: string;
  onInvite: () => void;
  onCreateFloor: () => void;
  onCreateRoom: () => void;
  onLeaveHall: (hallId: string) => void;
  onClose: () => void;
}): ContextMenuItem[] {
  const isOwner = hall?.owner_id === currentUserId;

  return [
    {
      label: "Invite People",
      danger: false,
      onClick: () => {
        onInvite();
        onClose();
      },
    },
    {
      label: "Create Floor",
      danger: false,
      onClick: () => {
        onCreateFloor();
        onClose();
      },
    },
    {
      label: "Create Room",
      danger: false,
      onClick: () => {
        onCreateRoom();
        onClose();
      },
    },
    {
      label: "Hall Settings",
      danger: false,
      onClick: () => {
        window.location.href = `/halls/${hallId}/settings/profile`;
        onClose();
      },
    },
    {
      label: isOwner ? "Delete Hall" : "Leave Hall",
      danger: true,
      onClick: () => {
        onLeaveHall(hallId);
        onClose();
      },
    },
  ];
}
