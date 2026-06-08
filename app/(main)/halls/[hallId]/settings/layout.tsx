"use client";

import React, { useEffect } from "react";
import HallSettingsNav from "@/app/(main)/halls/components/HallSettingsNav";
import SettingsPanelHeader from "@/app/(main)/components/SettingsPanelHeader";
import { LoadingState } from "@/app/(main)/components/FeedbackStates";
import { useParams, usePathname, useRouter } from "next/navigation";
import { MODAL_BACKDROP_CLASS, MODAL_Z_INDEX } from "@/app/(main)/components/Modal";
import { getHallSettingsSection } from "@/lib/hallSettingsSections";
import {
  SETTINGS_PANEL_BODY_CLASS,
  SETTINGS_PANEL_MAIN_CLASS,
  SETTINGS_PANEL_NAV_CLASS,
  SETTINGS_PANEL_SHELL_CLASS,
} from "@/lib/settingsPanelLayout";
import { useSelectHall, useSelectedHall } from "@/app/store/useHallStore";

export default function HallSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const hallId = params.hallId as string;
  const section = getHallSettingsSection(pathname);
  const selectHall = useSelectHall();
  const selectedHall = useSelectedHall();
  const hallReady = selectedHall?.id === hallId;

  useEffect(() => {
    if (hallId) {
      void selectHall(hallId);
    }
  }, [hallId, selectHall]);

  const handleClose = () => {
    router.push("/home");
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        router.push("/home");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  return (
    <div className={`fixed inset-0 ${MODAL_Z_INDEX} flex items-center justify-center ${MODAL_BACKDROP_CLASS}`}>
      <div className={SETTINGS_PANEL_SHELL_CLASS}>
        <HallSettingsNav hallId={hallId} className={SETTINGS_PANEL_NAV_CLASS} />

        <div className={SETTINGS_PANEL_MAIN_CLASS}>
          <SettingsPanelHeader
            title={section.title}
            subtitle={section.subtitle}
            onClose={handleClose}
          />

          <div className={SETTINGS_PANEL_BODY_CLASS}>
            <div className="w-full max-w-2xl">
              {hallReady ? children : <LoadingState message="Loading hall…" />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
