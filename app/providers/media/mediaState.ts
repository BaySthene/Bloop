"use client";

import { useRef, useState } from "react";
import {CameraResolution, MediaState} from "./media.type";

export function useMediaState(): MediaState {
    const audioRef = useRef<HTMLAudioElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
    const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

    const [selectedMicId, setSelectedMicId] = useState<string | null>(null);
    const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
    const [selectedSpeakerId, setSelectedSpeakerId] = useState<string | null>(null);

    const [mirrorEnabled, setMirrorEnabled] = useState<boolean>(false);
    const [cameraResolution, setCameraResolution] = useState<CameraResolution>({
        width: 1280,
        height: 720,
        frameRate: 30,
    });

    const [volume, setVolume] = useState(0);

    return {
        audioRef,
        videoRef,
        audioStream,
        videoStream,
        devices,

        selectedMicId,
        selectedCameraId,
        selectedSpeakerId,

        mirrorEnabled,
        cameraResolution,

        volume,

        setAudioStream,
        setVideoStream,
        setDevices,

        setSelectedMicId,
        setSelectedCameraId,
        setSelectedSpeakerId,

        setMirrorEnabled,
        setCameraResolution,

        setVolume,
    };
}
