"use client";

import React, { useEffect, useRef, useState } from "react";
import { FaPlus } from "react-icons/fa";
import { RiMessage3Fill } from "react-icons/ri";
import { BsGridFill } from "react-icons/bs";
import AddHallPopup from "./AddHallPopup";
import ManageHallsPopup from "./ManageHallsPopup";
import { ContextMenu, type ContextMenuItem } from "./ContextMenu";
import { FaLayerGroup } from "react-icons/fa6";
import Image from "next/image";
import { useEdgeStore } from "@/lib/edgestore";
import { Hall, createHall, acceptInvite, getUserHalls } from "@/lib/api";
import { buildHallContextMenuItems } from "@/lib/hallContextMenu";
import { LoadingState } from "./FeedbackStates";

interface HallListProps {
	halls: Hall[];
	setHalls: React.Dispatch<React.SetStateAction<Hall[]>>;
	activeHall: Hall | null;
	onHallClick: (hall: Hall) => void;
	onLeaveHall: (hallId: string) => void;
	onDirectMessagesClick: () => void;
	onHallsToggle: () => void;
	activeView: "hall" | "dm" | null;
	onCreateCategoryClick: (hall: Hall) => void;
	onCreateRoomClick: (hall: Hall) => void;
	isLoading: boolean;
	showRooms: boolean;
	setShowRooms: React.Dispatch<React.SetStateAction<boolean>>;
	currentUserId?: string;
	onInviteHall: (hall: Hall) => void;
}

/** Derive icon size, gap, and column count from sidebar width */
function getIconMetrics(w: number): { iconSize: number; gap: number; cols: number } {
	if (w >= 420) return { iconSize: 72, gap: 16, cols: 4 };
	if (w >= 340) return { iconSize: 64, gap: 16, cols: 3 };
	if (w >= 280) return { iconSize: 56, gap: 12, cols: 3 };
	return { iconSize: 48, gap: 10, cols: 2 };
}

/** How many halls to show before overflow — fills ~3 rows */
function calcMaxVisible(w: number, iconSize: number, gap: number): number {
	const padding = 32;
	const cols = Math.floor((w - padding + gap) / (iconSize + gap));
	return Math.max(4, cols * 3);
}

function hallListProfilePictureUrl(hall: Hall): string | null {
	return hall.icon_url ?? hall.icon_thumbnail_url ?? null;
}

function HallListProfilePicture({
	hall,
	iconSize,
	iconStyle,
	isActive,
	borderWidthClass = "border",
}: {
	hall: Hall;
	iconSize: number;
	iconStyle: React.CSSProperties;
	isActive: boolean;
	borderWidthClass?: string;
}) {
	const src = hallListProfilePictureUrl(hall);
	if (!src) return null;

	return (
		<div
			style={iconStyle}
			className={`relative overflow-hidden rounded-lg ${borderWidthClass} ${
				isActive ? "border-accent" : "border-transparent"
			}`}
		>
			<Image
				src={src}
				alt={`${hall.name} hall profile picture`}
				fill
				sizes={`${Math.ceil(iconSize * 2)}px`}
				unoptimized
				className="object-cover"
			/>
		</div>
	);
}

export default function HallList({
	halls,
	setHalls,
	activeHall,
	onHallClick,
	onLeaveHall,
	onDirectMessagesClick,
	onHallsToggle,
	activeView,
	onCreateCategoryClick,
	onCreateRoomClick,
	isLoading,
	showRooms,
	setShowRooms,
	currentUserId,
	onInviteHall,
}: HallListProps) {
	const [showPopup, setShowPopup] = useState(false);
	const [showManageHalls, setShowManageHalls] = useState(false);
	const [contextMenu, setContextMenu] = useState<{ x: number; y: number; hallId: string } | null>(null);
	const [extraHallContextMenu, setExtraHallContextMenu] = useState<{ x: number; y: number; hallId: string } | null>(null);
	const [addHallContextMenu, setAddHallContextMenu] = useState<{ x: number; y: number } | null>(null);
	const [showMorePopup, setShowMorePopup] = useState(false);
	const [popupStep, setPopupStep] = useState<"choice" | "create" | "join">("choice");

	const dragIndexRef = useRef<number | null>(null);
	const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

	const containerRef = useRef<HTMLDivElement | null>(null);
	const [sidebarWidth, setSidebarWidth] = useState(350);

	const menuRef = useRef<HTMLDivElement | null>(null);
	const addHallMenuRef = useRef<HTMLDivElement | null>(null);
	const hallPopupRef = useRef<HTMLDivElement | null>(null);
	const moreButtonRef = useRef<HTMLButtonElement | null>(null);
	const addHallButtonRef = useRef<HTMLButtonElement | null>(null);
	const extraHallsMenuRef = useRef<HTMLDivElement | null>(null);

	const { edgestore } = useEdgeStore();

	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;
		const ro = new ResizeObserver((entries) => {
			for (const entry of entries) setSidebarWidth(entry.contentRect.width);
		});
		ro.observe(el);
		return () => ro.disconnect();
	}, []);

	const { iconSize, gap, cols } = getIconMetrics(sidebarWidth);
	const maxVisible = calcMaxVisible(sidebarWidth, iconSize, gap);
	const visibleHalls = halls.slice(0, maxVisible);
	const extraHalls = halls.slice(maxVisible);
	const iconStyle = { width: iconSize, height: iconSize, minWidth: iconSize, minHeight: iconSize };

	useEffect(() => {
		if (!showMorePopup) return;
		const handle = (e: MouseEvent) => {
			const t = e.target as Node;
			if (hallPopupRef.current?.contains(t) || moreButtonRef.current?.contains(t)) return;
			setShowMorePopup(false);
		};
		window.addEventListener("mousedown", handle);
		return () => window.removeEventListener("mousedown", handle);
	}, [showMorePopup]);

	useEffect(() => {
		if (!contextMenu && !addHallContextMenu && !extraHallContextMenu) return;
		const handle = (e: MouseEvent) => {
			if (
				menuRef.current?.contains(e.target as Node) ||
				addHallMenuRef.current?.contains(e.target as Node) ||
				addHallButtonRef.current?.contains(e.target as Node) ||
				extraHallsMenuRef.current?.contains(e.target as Node)
			) return;
			setContextMenu(null);
			setAddHallContextMenu(null);
			setExtraHallContextMenu(null);
		};
		window.addEventListener("mousedown", handle);
		return () => window.removeEventListener("mousedown", handle);
	}, [contextMenu, addHallContextMenu, extraHallContextMenu]);

	const handleDragStart = (index: number) => { dragIndexRef.current = index; };

	const handleDragOver = (e: React.DragEvent, index: number) => {
		e.preventDefault();
		setDragOverIndex(index);
	};

	const handleDrop = (dropIndex: number) => {
		const dragIndex = dragIndexRef.current;
		if (dragIndex === null || dragIndex === dropIndex) {
			dragIndexRef.current = null;
			setDragOverIndex(null);
			return;
		}
		setHalls((prev) => {
			const next = [...prev];
			const [moved] = next.splice(dragIndex, 1);
			next.splice(dropIndex, 0, moved);
			return next;
		});
		dragIndexRef.current = null;
		setDragOverIndex(null);
	};

	const handleDragEnd = () => { dragIndexRef.current = null; setDragOverIndex(null); };

	const handleCreateHall = async (name: string, imageString?: string) => {
		let hallIconUrl: string | null = null;
		let hallIconThumbnailUrl: string | null = null;
		if (imageString) {
			const file = base64ToFile(imageString, "hall-profile-picture.png");
			const res = await uploadImage(file);
			if (res) { hallIconUrl = res.url; hallIconThumbnailUrl = res.thumbnailUrl; }
		}
		try {
			const newHall = await createHall({ name, is_private: false, icon_url: hallIconUrl ?? null, icon_thumbnail_url: hallIconThumbnailUrl ?? null, banner_color: "#ffffff", description: "" });
			if (newHall) { setHalls((prev) => [...prev, newHall]); onHallClick(newHall); }
		} catch (err) { console.warn("Failed to create hall:", err); }
	};

	async function uploadImage(file: File): Promise<{ url: string; thumbnailUrl: string } | null> {
		try {
			const res = await edgestore.publicImages.upload({ file, onProgressChange: (p: number) => console.log(p) });
			return res.url && res.thumbnailUrl ? { url: res.url, thumbnailUrl: res.thumbnailUrl } : null;
		} catch { return null; }
	}

	function base64ToFile(base64: string, filename: string): File {
		const arr = base64.split(",");
		const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
		const bstr = atob(arr[1]);
		let n = bstr.length;
		const u8arr = new Uint8Array(n);
		while (n--) u8arr[n] = bstr.charCodeAt(n);
		return new File([u8arr], filename, { type: mime });
	}

	const [joinError, setJoinError] = useState<string | null>(null);
	const [isJoining, setIsJoining] = useState(false);

	const handleJoinHall = async (inviteCode: string) => {
		if (!inviteCode.trim()) {
			setJoinError("Please enter an invite code");
			return;
		}

		setIsJoining(true);
		setJoinError(null);

		try {
			let code = inviteCode.trim();
			if (code.includes("/")) {
				code = code.split("/").pop() || code;
			}

			const result = await acceptInvite(code);

			if (result) {
				const updatedHalls = await getUserHalls();
				if (updatedHalls) {
					setHalls(updatedHalls);
					const newHall = updatedHalls.find((h) => h.id === result.hall_id);
					if (newHall) {
						onHallClick(newHall);
					}
				}
			} else {
				setJoinError("Failed to join hall. Please check the invite code.");
			}
		} catch (err) {
			console.error("Error joining hall:", err);
			setJoinError("Error joining hall. Please try again.");
		} finally {
			setIsJoining(false);
		}
	};

	const toggleRoomsVisibility = () => setShowRooms((p) => !p);

	const closeAllContextMenus = () => {
		setContextMenu(null);
		setAddHallContextMenu(null);
		setExtraHallContextMenu(null);
	};

	const hallTileContextMenuItems: ContextMenuItem[] = contextMenu
		? buildHallContextMenuItems({
				hallId: contextMenu.hallId,
				hall: halls.find((h) => h.id === contextMenu.hallId),
				currentUserId,
				onInvite: () => {
					const hall = halls.find((h) => h.id === contextMenu.hallId);
					if (hall) onInviteHall(hall);
				},
				onCreateFloor: () => {
					const hall = halls.find((h) => h.id === contextMenu.hallId);
					if (hall) onCreateCategoryClick(hall);
				},
				onCreateRoom: () => {
					const hall = halls.find((h) => h.id === contextMenu.hallId);
					if (hall) onCreateRoomClick(hall);
				},
				onLeaveHall,
				onClose: () => setContextMenu(null),
			})
		: [];

	const addHallContextMenuItems: ContextMenuItem[] = [
		{ label: "Create Hall", danger: false, onClick: () => { setShowPopup(true); setPopupStep("create"); setAddHallContextMenu(null); } },
		{ label: "Join Hall", danger: false, onClick: () => { setShowPopup(true); setPopupStep("join"); setAddHallContextMenu(null); } },
	];

	const extraHallContextMenuItems: ContextMenuItem[] = [
		{ label: showRooms ? "Hide Rooms" : "Show Rooms", danger: false, onClick: () => { toggleRoomsVisibility(); setExtraHallContextMenu(null); } },
		{ label: "Hall Settings", danger: false, onClick: () => { if (activeHall) window.location.href = `/halls/${activeHall.id}/settings/profile`; setExtraHallContextMenu(null); } },
		{ label: "Create Room", danger: false, onClick: () => { if (activeHall) onCreateRoomClick(activeHall); setExtraHallContextMenu(null); } },
		{ label: "Manage Halls", danger: false, onClick: () => { setShowManageHalls(true); setExtraHallContextMenu(null); } },
		{ label: activeHall?.owner_id === currentUserId ? "Delete Hall" : "Leave Hall", danger: true, onClick: () => { if (activeHall) onLeaveHall(activeHall.id); setExtraHallContextMenu(null); } },
	];

	return (
		<div ref={containerRef} className="flex flex-col items-center select-none w-full">
			<div className="flex w-full bg-surface-tab-inactive rounded-t-lg">
				<button onClick={onHallsToggle} className={`flex-1 p-3 flex items-center justify-center cursor-pointer transition-all duration-150 ${activeView === "hall" ? "bg-surface-sidebar text-heading" : "hover:bg-surface-neutral text-secondary"}`}>
					<BsGridFill className="w-8 h-8" />
				</button>
				<button onClick={onDirectMessagesClick} className={`flex-1 p-3 flex items-center justify-center cursor-pointer transition-all duration-150 ${activeView === "dm" ? "bg-surface-sidebar text-heading" : "hover:bg-surface-neutral text-secondary"}`}>
					<RiMessage3Fill className="w-8 h-8" />
				</button>
			</div>

			{activeView === "hall" && (
				isLoading ? (
					<LoadingState message="Loading halls…" fullHeight={false} className="w-full py-8" />
				) : (
				<div
					className="grid w-full justify-items-center"
					style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${iconSize}px, 1fr))`, gap, padding: 16 }}
				>
					<button
						ref={addHallButtonRef}
						style={iconStyle}
						onClick={() => { setShowPopup(true); setPopupStep("choice"); }}
						onContextMenu={(e) => {
							e.preventDefault();
							closeAllContextMenus();
							setAddHallContextMenu({ x: e.clientX, y: e.clientY });
						}}
						className="flex items-center justify-center bg-surface-control rounded-lg hover:bg-primary hover:text-white cursor-pointer transition-colors"
					>
						<FaPlus size={Math.round(iconSize * 0.35)} />
					</button>

					{visibleHalls.map((hall, index) => (
						<div
							key={hall.id}
							draggable
							onDragStart={() => handleDragStart(index)}
							onDragOver={(e) => handleDragOver(e, index)}
							onDrop={() => handleDrop(index)}
							onDragEnd={handleDragEnd}
							style={iconStyle}
							className={`relative flex items-center justify-center rounded-lg cursor-pointer active:cursor-grabbing transition-all duration-150
								${dragOverIndex === index && dragIndexRef.current !== index ? "scale-110 ring-2 ring-primary ring-offset-1" : ""}
								${dragIndexRef.current === index ? "opacity-40" : "opacity-100"}`}
							onClick={() => onHallClick(hall)}
							onContextMenu={(e) => {
								e.preventDefault();
								closeAllContextMenus();
								setContextMenu({ x: e.clientX, y: e.clientY, hallId: hall.id });
							}}
						>
							<div
								className="absolute rounded-full bg-primary transition-transform duration-300 origin-center"
								style={{ bottom: -6, width: iconSize * 0.5, height: 4, transform: activeHall?.id === hall.id ? "scaleX(1)" : "scaleX(0)" }}
							/>

							{hallListProfilePictureUrl(hall) ? (
								<HallListProfilePicture
									hall={hall}
									iconSize={iconSize}
									iconStyle={iconStyle}
									isActive={activeHall?.id === hall.id}
								/>
							) : (
								<div
									style={iconStyle}
									className={`rounded-lg text-heading flex items-center justify-center color-primary-button border ${activeHall?.id === hall.id ? "border-accent" : "border-transparent"}`}
								>
									<span style={{ fontSize: Math.round(iconSize * 0.38) }}>
										{hall.name.trim().charAt(0).toUpperCase()}
									</span>
								</div>
							)}
						</div>
					))}

					{extraHalls.length > 0 && (
						<button
							ref={moreButtonRef}
							style={iconStyle}
							onClick={() => setShowMorePopup((p) => !p)}
							onContextMenu={(e) => {
								e.preventDefault();
								e.stopPropagation();
								closeAllContextMenus();
								setExtraHallContextMenu({ x: e.clientX, y: e.clientY, hallId: "" });
							}}
							className="flex items-center justify-center bg-surface-control rounded-lg hover:bg-surface-neutral cursor-pointer transition-colors"
						>
							<FaLayerGroup style={{ width: iconSize * 0.38, height: iconSize * 0.38 }} className="text-primary" />
						</button>
					)}
				</div>
				)
			)}

			{contextMenu && (
				<ContextMenu ref={menuRef} x={contextMenu.x} y={contextMenu.y} items={hallTileContextMenuItems} />
			)}

			{addHallContextMenu && (
				<ContextMenu ref={addHallMenuRef} x={addHallContextMenu.x} y={addHallContextMenu.y} items={addHallContextMenuItems} />
			)}

			{showMorePopup && (
				<div
					ref={hallPopupRef}
					className="absolute top-78 left-70 bg-surface-card border border-default shadow-lg rounded-xl p-2 grid gap-2 z-50"
					style={{ gridTemplateColumns: `repeat(${cols}, ${iconSize}px)` }}
				>
					{extraHalls.map((hall) => (
						<div key={hall.id} style={iconStyle} className="flex items-center justify-center rounded-lg cursor-pointer" onClick={() => { onHallClick(hall); setShowMorePopup(false); }}>
							{hallListProfilePictureUrl(hall) ? (
								<HallListProfilePicture
									hall={hall}
									iconSize={iconSize}
									iconStyle={iconStyle}
									isActive={activeHall?.id === hall.id}
									borderWidthClass="border-2"
								/>
							) : (
								<div style={iconStyle} className={`rounded-lg text-heading flex items-center justify-center color-primary-button border-2 ${activeHall?.id === hall.id ? "border-accent" : "border-transparent"}`}>
									<span style={{ fontSize: Math.round(iconSize * 0.38) }}>{hall.name.trim().charAt(0).toUpperCase()}</span>
								</div>
							)}
						</div>
					))}
				</div>
			)}

			{extraHallContextMenu && (
				<ContextMenu ref={extraHallsMenuRef} x={extraHallContextMenu.x} y={extraHallContextMenu.y} items={extraHallContextMenuItems} />
			)}

			<AddHallPopup
				isOpen={showPopup}
				onClose={() => { setShowPopup(false); setPopupStep("choice"); setJoinError(null); }}
				onCreate={handleCreateHall}
				onJoin={handleJoinHall}
				initialStep={popupStep}
				joinError={joinError}
				isJoining={isJoining}
			/>

			<ManageHallsPopup
				isOpen={showManageHalls}
				onClose={() => setShowManageHalls(false)}
				halls={halls}
				activeHallId={activeHall?.id ?? null}
				onSelectHall={onHallClick}
			/>
		</div>
	);
}
