"use client";

import {
    createContext,
    useContext,
    useEffect,
    ReactNode,
} from "react";

import { useMediaState } from "./mediaState";
import { createMediaActions } from "./mediaActions";
import { MediaContextType } from "./media.type";

const MediaContext = createContext<MediaContextType | null>(null);

export function MediaProvider({ children }: { children: ReactNode }) {
    const state = useMediaState();
    const actions = createMediaActions(state);

    useEffect(() => {
        actions.refreshDevices();
        navigator.mediaDevices.addEventListener("devicechange", actions.refreshDevices);

        return () =>
            navigator.mediaDevices.removeEventListener(
                "devicechange",
                actions.refreshDevices
            );
    }, [actions]);

    const value: MediaContextType = {
        ...state,
        ...actions,
    };

    return <MediaContext.Provider value={value}>{children}</MediaContext.Provider>;
}

export function useMedia(): MediaContextType {
    const ctx = useContext(MediaContext);
    if (!ctx) throw new Error("useMedia must be used within MediaProvider");
    return ctx;
}
