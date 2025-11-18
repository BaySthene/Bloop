import { RefObject } from "react";

export interface CameraResolution {
    width: number;
    height: number;
    frameRate?: number;
}

export interface MediaState {
    audioRef: RefObject<HTMLAudioElement | null>;
    videoRef: RefObject<HTMLVideoElement | null>;

    audioStream: MediaStream | null;
    videoStream: MediaStream | null;

    devices: MediaDeviceInfo[];

    selectedMicId: string | null;
    selectedCameraId: string | null;
    selectedSpeakerId: string | null;

    mirrorEnabled: boolean;
    cameraResolution: CameraResolution;

    volume: number;

    setAudioStream: (s: MediaStream | null) => void;
    setVideoStream: (s: MediaStream | null) => void;
    setDevices: (d: MediaDeviceInfo[]) => void;

    setSelectedMicId: (id: string) => void;
    setSelectedCameraId: (id: string) => void;
    setSelectedSpeakerId: (id: string) => void;

    setMirrorEnabled: (v: boolean) => void;
    setCameraResolution: (v: CameraResolution) => void;

    setVolume: (v: number) => void;
}

export interface MediaActions {
    refreshDevices: () => Promise<void>;
    startMic: () => Promise<void>;
    startCamera: () => Promise<void>;
    stopAll: () => void;
    stopCamera: () => void;
    changeSpeaker: () => Promise<void>;
}

export interface MediaContextType extends MediaState, MediaActions {}
