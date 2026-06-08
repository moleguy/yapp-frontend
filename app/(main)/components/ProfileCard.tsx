"use client";

import React, { useCallback } from "react";
import { IoIosClose } from "react-icons/io";
import { Friend } from "@/app/(main)/components/FriendsProfile";
import Image from "next/image";
import { RiMessage3Fill } from "react-icons/ri";
import { UserCheck } from "lucide-react";
import Modal from "./Modal";

type ProfileCardProps = {
	friend: Friend;
	isOpen: boolean;
	onCloseAction?: () => void;
};

export default function ProfileCard({ friend, isOpen, onCloseAction }: ProfileCardProps) {
	const handleClose = useCallback(() => {
		if (typeof onCloseAction === "function") {
			onCloseAction();
		} else {
			console.warn("onCloseAction is not a function");
		}
	}, [onCloseAction]);

	if (!isOpen) return null;

	const handleCloseClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		handleClose();
	};

	return (
		<Modal
			isOpen={isOpen}
			onClose={handleClose}
			panelClassName="bg-surface-card shadow-lg w-[640px] max-w-full relative p-2 border border-default rounded-xl"
		>
			<button
				onClick={handleCloseClick}
				className="absolute top-3 right-3 bg-surface-control rounded-md text-secondary hover:text-heading cursor-pointer z-10"
			>
				<IoIosClose className="w-8 h-8" />
			</button>

			<div className="flex flex-col items-start text-center">
				<div className="w-full h-40 bg-green-800 rounded-t-lg">banner</div>
				<Image
					src={friend.avatarUrl || "/icons/default-avatar.png"}
					alt={`${friend.name}'s user profile picture`}
					width={90}
					height={90}
					className="absolute top-30 left-12 w-32 h-32 rounded-full object-cover mb-2 bg-surface-control"
				/>

				<div className="flex flex-col justify-center items-start w-full py-8 px-8">
					<label className="text-xl font-semibold mt-12">{friend.name}</label>
					{friend.username && <p className="text-sm text-secondary">@{friend.username}</p>}

					{friend.memberSince && (
						<p className="mt-3 text-base text-strong">Member since {friend.memberSince}</p>
					)}

					{friend.mutualHalls !== undefined && (
						<p className="mt-2 text-base text-strong">Mutual Halls: {friend.mutualHalls}</p>
					)}

					{friend.mutualFriends !== undefined && (
						<p className="mt-1 text-base text-strong">Mutual Friends: {friend.mutualFriends}</p>
					)}

					<div className="flex gap-4 items-center mt-8">
						<button
							type="button"
							className="flex items-center gap-2 border border-default py-2 px-3 focus:outline-none rounded-lg cursor-pointer hover:bg-surface-control text-heading"
						>
							<RiMessage3Fill className="w-6 h-6" />
							Message
						</button>

						<button
							type="button"
							className="border border-default py-2 px-3 rounded-lg hover:bg-surface-control cursor-pointer"
						>
							<UserCheck className="w-6 h-6" />
						</button>
					</div>
				</div>
			</div>
		</Modal>
	);
}
