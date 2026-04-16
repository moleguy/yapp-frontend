"use client";

import React from "react";
import HallSettingsNav from "../../components/HallSettingsNav";
import { useParams, useRouter } from "next/navigation";
import { IoIosClose } from "react-icons/io";

export default function HallSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const hallId = params.hallId as string;

  const handleClose = () => {
    router.push("/home");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="relative w-[95%] max-w-6xl h-[85vh] bg-white rounded-2xl flex overflow-hidden shadow-2xl">
        {/* Sidebar Navigation */}
        <HallSettingsNav hallId={hallId} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          {/* Header with Close Button */}
          <div className="flex justify-end p-4 border-b border-[#dcd9d3]">
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-black transition-colors"
              title="Close Settings"
            >
              <IoIosClose size={32} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
