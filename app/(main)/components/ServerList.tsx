"use client";

import React, { useEffect, useRef, useState } from "react";
import { FaPlus } from "react-icons/fa";
import { RiMessage3Fill } from "react-icons/ri";
import { BsGridFill } from "react-icons/bs";
import AddServerPopup from "./AddServerPopup";
import { FaLayerGroup } from "react-icons/fa6";
import Image from "next/image";
import { useEdgeStore } from "@/lib/edgestore";
import { Hall, createHall } from "@/lib/api";

interface ServerListProps {
	servers: Hall[];
	setServers: React.Dispatch<React.SetStateAction<Hall[]>>;
	activeServer: Hall | null;
	onServerClick: (server: Hall) => void;
	onLeaveServer: (serverId: string) => void;
	onDirectMessagesClick: () => void;
	onServersToggle: () => void;
	activeView: "server" | "dm" | null;
	onCreateCategoryClick: (server: Hall) => void;
	onCreateRoomClick: (server: Hall) => void;
	isLoading: boolean;
	showChannels: boolean;
	setShowChannels: React.Dispatch<React.SetStateAction<boolean>>;
	currentUserId?: string;
}

/** Derive icon size, gap, and column count from sidebar width */
function getIconMetrics(w: number): { iconSize: number; gap: number; cols: number } {
	if (w >= 420) return { iconSize: 72, gap: 16, cols: 4 };
	if (w >= 340) return { iconSize: 64, gap: 16, cols: 3 };
	if (w >= 280) return { iconSize: 56, gap: 12, cols: 3 };
	return { iconSize: 48, gap: 10, cols: 2 };
}

/** How many servers to show before overflow — fills ~3 rows */
function calcMaxVisible(w: number, iconSize: number, gap: number): number {
	const padding = 32;
	const cols = Math.floor((w - padding + gap) / (iconSize + gap));
	return Math.max(4, cols * 3);
}

export default function ServerList({
	servers,
	setServers,
	activeServer,
	onServerClick,
	onLeaveServer,
	onDirectMessagesClick,
	onServersToggle,
	activeView,
	onCreateCategoryClick,
	onCreateRoomClick,
	showChannels,
	setShowChannels,
	currentUserId,
}: ServerListProps) {
	const [showPopup, setShowPopup] = useState(false);
	const [contextMenu, setContextMenu] = useState<{ x: number; y: number; serverId: string } | null>(null);
	const [extraServerContextMenu, setExtraServerContextMenu] = useState<{ x: number; y: number; serverId: string } | null>(null);
	const [addServerContextMenu, setAddServerContextMenu] = useState<{ x: number; y: number } | null>(null);
	const [showMorePopup, setShowMorePopup] = useState(false);
	const [popupStep, setPopupStep] = useState<"choice" | "create" | "join">("choice");

	// Drag state
	const dragIndexRef = useRef<number | null>(null);
	const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

	// Width measurement
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [sidebarWidth, setSidebarWidth] = useState(350);

	const menuRef = useRef<HTMLDivElement | null>(null);
	const addServerMenuRef = useRef<HTMLDivElement | null>(null);
	const serverPopupRef = useRef<HTMLDivElement | null>(null);
	const moreButtonRef = useRef<HTMLButtonElement | null>(null);
	const addServerButtonRef = useRef<HTMLButtonElement | null>(null);
	const extraServersMenuRef = useRef<HTMLDivElement | null>(null);

	const { edgestore } = useEdgeStore();

	// Observe sidebar width
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
	const visibleServers = servers.slice(0, maxVisible);
	const extraServers = servers.slice(maxVisible);
	const iconStyle = { width: iconSize, height: iconSize, minWidth: iconSize, minHeight: iconSize };

	useEffect(() => {
		if (!showMorePopup) return;
		const handle = (e: MouseEvent) => {
			const t = e.target as Node;
			if (serverPopupRef.current?.contains(t) || moreButtonRef.current?.contains(t)) return;
			setShowMorePopup(false);
		};
		window.addEventListener("mousedown", handle);
		return () => window.removeEventListener("mousedown", handle);
	}, [showMorePopup]);

	useEffect(() => {
		if (!contextMenu && !addServerContextMenu && !extraServerContextMenu) return;
		const handle = (e: MouseEvent) => {
			if (
				menuRef.current?.contains(e.target as Node) ||
				addServerMenuRef.current?.contains(e.target as Node) ||
				addServerButtonRef.current?.contains(e.target as Node) ||
				extraServersMenuRef.current?.contains(e.target as Node)
			) return;
			setContextMenu(null);
			setAddServerContextMenu(null);
			setExtraServerContextMenu(null);
		};
		window.addEventListener("mousedown", handle);
		return () => window.removeEventListener("mousedown", handle);
	}, [contextMenu, addServerContextMenu, extraServerContextMenu]);

	// ---- Drag ----

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
		setServers((prev) => {
			const next = [...prev];
			const [moved] = next.splice(dragIndex, 1);
			next.splice(dropIndex, 0, moved);
			return next;
		});
		dragIndexRef.current = null;
		setDragOverIndex(null);
	};

	const handleDragEnd = () => { dragIndexRef.current = null; setDragOverIndex(null); };

	// ---- Server actions ----

	const handleCreateServer = async (name: string, imageString?: string) => {
		let hallIconUrl: string | null = null;
		let hallIconThumbnailUrl: string | null = null;
		if (imageString) {
			const file = base64ToFile(imageString, "hall-icon.png");
			const res = await uploadImage(file);
			if (res) { hallIconUrl = res.url; hallIconThumbnailUrl = res.thumbnailUrl; }
		}
		try {
			const newHall = await createHall({ name, is_private: false, icon_url: hallIconUrl ?? null, icon_thumbnail_url: hallIconThumbnailUrl ?? null, banner_color: "#ffffff", description: "" });
			if (newHall) { setServers((prev) => [...prev, newHall]); onServerClick(newHall); }
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

	const handleJoinServer = () => console.log("Join Hall clicked");
	const toggleChannelsVisibility = () => setShowChannels((p) => !p);

	const serverContextMenuItems = [
		{ label: "Invite People", danger: false, onClick: () => {} },
		{ label: "Create Floor", danger: false, onClick: () => { if (contextMenu) { const s = servers.find((s) => s.id === contextMenu.serverId); if (s) onCreateCategoryClick(s); } setContextMenu(null); } },
		{ label: "Create Room", danger: false, onClick: () => { if (contextMenu) { const s = servers.find((s) => s.id === contextMenu.serverId); if (s) onCreateRoomClick(s); } setContextMenu(null); } },
		{ label: "Hall Settings", danger: false, onClick: () => { if (contextMenu) window.location.href = `/halls/${contextMenu.serverId}/settings/profile`; setContextMenu(null); } },
		{
			label: contextMenu && servers.find((s) => s.id === contextMenu.serverId)?.owner_id === currentUserId ? "Delete Hall" : "Leave Hall",
			danger: true,
			onClick: () => { if (!contextMenu) return; onLeaveServer(contextMenu.serverId); setContextMenu(null); },
		},
	];

	const addServerContextMenuItems = [
		{ label: "Create Hall", danger: false, onClick: () => { setShowPopup(true); setPopupStep("create"); setAddServerContextMenu(null); } },
		{ label: "Join Hall", danger: false, onClick: () => { setShowPopup(true); setPopupStep("join"); setAddServerContextMenu(null); } },
	];

	const extraServerContextMenuItems = [
		{ label: showChannels ? "Hide Rooms" : "Show Rooms", danger: false, onClick: () => { setShowMorePopup(true); toggleChannelsVisibility(); setExtraServerContextMenu(null); } },
		{ label: "Hall Settings", danger: false, onClick: () => { if (activeServer) window.location.href = `/halls/${activeServer.id}/settings/profile`; setExtraServerContextMenu(null); } },
		{ label: "Create Room", danger: false, onClick: () => { if (activeServer) onCreateRoomClick(activeServer); setExtraServerContextMenu(null); } },
		{ label: "Manage Halls", danger: false, onClick: () => setExtraServerContextMenu(null) },
		{ label: activeServer?.owner_id === currentUserId ? "Delete Hall" : "Leave Hall", danger: true, onClick: () => { if (activeServer) onLeaveServer(activeServer.id); setExtraServerContextMenu(null); } },
	];

	const ContextMenuList = ({ items, ref: r }: { items: typeof serverContextMenuItems; ref: React.RefObject<HTMLDivElement | null> }) => (
		<>
			{items.map((item, idx, arr) => (
				<React.Fragment key={item.label}>
					<button onClick={item.onClick} className={`text-left w-full py-2 px-2 rounded-md cursor-pointer ${item.danger ? "text-[#cb3b40] hover:bg-[#fbeff0]" : "hover:bg-[#f2f2f3]"}`}>
						{item.label}
					</button>
					{idx < arr.length - 1 && <div className="h-px bg-gray-200 w-full my-1" />}
				</React.Fragment>
			))}
		</>
	);

	return (
		<div ref={containerRef} className="flex flex-col items-center select-none w-full">
			{/* Top toggle */}
			<div className="flex w-full bg-[#e6e6e6] rounded-t-lg">
				<button onClick={onServersToggle} className={`flex-1 p-3 flex items-center justify-center cursor-pointer transition-all duration-150 ${activeView === "server" ? "bg-[#f3f3f4] text-black" : "hover:bg-gray-300 text-gray-600"}`}>
					<BsGridFill className="w-8 h-8" />
				</button>
				<button onClick={onDirectMessagesClick} className={`flex-1 p-3 flex items-center justify-center cursor-pointer transition-all duration-150 ${activeView === "dm" ? "bg-[#f3f3f4] text-black" : "hover:bg-gray-300 text-gray-600"}`}>
					<RiMessage3Fill className="w-8 h-8" />
				</button>
			</div>

			{/* Server Grid */}
			{activeView === "server" && (
				<div
					className="grid w-full justify-items-center"
					style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${iconSize}px, 1fr))`, gap, padding: 16 }}
				>
					{/* Add button */}
					<button
						ref={addServerButtonRef}
						style={iconStyle}
						onClick={() => { setShowPopup(true); setPopupStep("choice"); }}
						onContextMenu={(e) => { e.preventDefault(); setAddServerContextMenu({ x: e.clientX, y: e.clientY }); }}
						className="flex items-center justify-center bg-gray-200 rounded-lg hover:bg-[#6164f2] hover:text-white cursor-pointer transition-colors"
					>
						<FaPlus size={Math.round(iconSize * 0.35)} />
					</button>

					{/* Servers */}
					{visibleServers.map((server, index) => (
						<div
							key={server.id}
							draggable
							onDragStart={() => handleDragStart(index)}
							onDragOver={(e) => handleDragOver(e, index)}
							onDrop={() => handleDrop(index)}
							onDragEnd={handleDragEnd}
							style={iconStyle}
							className={`relative flex items-center justify-center rounded-lg cursor-grab active:cursor-grabbing transition-all duration-150
								${dragOverIndex === index && dragIndexRef.current !== index ? "scale-110 ring-2 ring-[#6164f2] ring-offset-1" : ""}
								${dragIndexRef.current === index ? "opacity-40" : "opacity-100"}`}
							onClick={() => onServerClick(server)}
							onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, serverId: server.id }); }}
						>
							{/* Active dot */}
							<div
								className="absolute rounded-full bg-[#6164f2] transition-transform duration-300 origin-center"
								style={{ bottom: -6, width: iconSize * 0.5, height: 4, transform: activeServer?.id === server.id ? "scaleX(1)" : "scaleX(0)" }}
							/>

							{server.icon_thumbnail_url ? (
								<Image
									src={server.icon_thumbnail_url}
									alt={server.name}
									width={iconSize}
									height={iconSize}
									style={iconStyle}
									className={`rounded-lg object-cover border ${activeServer?.id === server.id ? "border-[#d4c9be]" : "border-transparent"}`}
								/>
							) : (
								<div
									style={iconStyle}
									className={`rounded-lg text-black flex items-center justify-center color-primary-button border ${activeServer?.id === server.id ? "border-[#D4C9BE]" : "border-transparent"}`}
								>
									<span style={{ fontSize: Math.round(iconSize * 0.38) }}>
										{server.name.trim().charAt(0).toUpperCase()}
									</span>
								</div>
							)}
						</div>
					))}

					{/* More button */}
					{extraServers.length > 0 && (
						<button
							ref={moreButtonRef}
							style={iconStyle}
							onClick={() => setShowMorePopup((p) => !p)}
							onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setExtraServerContextMenu({ x: e.clientX, y: e.clientY, serverId: "" }); }}
							className="flex items-center justify-center bg-gray-200 rounded-lg hover:bg-gray-300 cursor-pointer transition-colors"
						>
							<FaLayerGroup style={{ width: iconSize * 0.38, height: iconSize * 0.38 }} className="text-[#6164f2]" />
						</button>
					)}
				</div>
			)}

			{/* Server context menu */}
			{contextMenu && (
				<div ref={menuRef} className="flex flex-col items-center gap-1 py-2 px-2 fixed z-[100] border rounded-xl border-[#dcd9d3] shadow-lg w-48 bg-white text-[#1e1e1e] text-sm tracking-wide" style={{ top: contextMenu.y, left: contextMenu.x }}>
					<ContextMenuList items={serverContextMenuItems} ref={menuRef} />
				</div>
			)}

			{/* Add server context menu */}
			{addServerContextMenu && (
				<div ref={addServerMenuRef} className="flex flex-col items-center gap-1 py-2 px-2 fixed z-[100] border rounded-xl border-[#dcd9d3] shadow-lg w-48 bg-white text-[#1e1e1e] text-sm tracking-wide" style={{ top: addServerContextMenu.y, left: addServerContextMenu.x }}>
					<ContextMenuList items={addServerContextMenuItems} ref={addServerMenuRef} />
				</div>
			)}

			{/* More popup */}
			{showMorePopup && (
				<div
					ref={serverPopupRef}
					className="absolute top-78 left-70 bg-white border border-[#dcd9d3] shadow-lg rounded-xl p-2 grid gap-2 z-50"
					style={{ gridTemplateColumns: `repeat(${cols}, ${iconSize}px)` }}
				>
					{extraServers.map((server) => (
						<div key={server.id} style={iconStyle} className="flex items-center justify-center rounded-lg cursor-pointer" onClick={() => { onServerClick(server); setShowMorePopup(false); }}>
							{server.icon_thumbnail_url ? (
								<Image src={server.icon_thumbnail_url} alt={server.name} width={iconSize} height={iconSize} style={iconStyle} className={`rounded-lg object-cover border-2 ${activeServer?.id === server.id ? "border-[#d4c9be]" : "border-transparent"}`} />
							) : (
								<div style={iconStyle} className={`rounded-lg text-black flex items-center justify-center color-primary-button border-2 ${activeServer?.id === server.id ? "border-[#D4C9BE]" : "border-transparent"}`}>
									<span style={{ fontSize: Math.round(iconSize * 0.38) }}>{server.name.trim().charAt(0).toUpperCase()}</span>
								</div>
							)}
						</div>
					))}
				</div>
			)}

			{/* Extra server context menu */}
			{extraServerContextMenu && (
				<div ref={extraServersMenuRef} className="flex flex-col items-center gap-1 py-2 px-2 fixed z-[100] border rounded-xl border-[#dcd9d3] shadow-lg w-48 bg-white text-[#1e1e1e] text-sm tracking-wide" style={{ top: extraServerContextMenu.y, left: extraServerContextMenu.x }}>
					<ContextMenuList items={extraServerContextMenuItems} ref={extraServersMenuRef} />
				</div>
			)}

			<AddServerPopup
				isOpen={showPopup}
				onClose={() => { setShowPopup(false); setPopupStep("choice"); }}
				onCreate={handleCreateServer}
				onJoin={handleJoinServer}
				initialStep={popupStep}
			/>
		</div>
	);
}