"use client";

import { useEffect, useState } from "react";
import { useMessageStore } from "@/app/store/useMessageStore";

/**
 * Hook to ensure Zustand persisted stores are hydrated on client-side mount
 * Needed for proper localStorage restoration with SSR
 */
export function useStoreHydration() {
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        // Trigger manual rehydration for persisted stores
        useMessageStore.persist?.rehydrate?.();
        setIsHydrated(true);
    }, []);

    return isHydrated;
}
