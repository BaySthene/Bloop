import {MediaState} from "@/app/providers/media/media.type";

export const getCameraConstraints = (state: MediaState) => {
    const { selectedCameraId, cameraResolution } = state;

    return {
        video: {
            deviceId: selectedCameraId ? { exact: selectedCameraId } : undefined,
            width: cameraResolution?.width
                ? { ideal: cameraResolution.width }
                : undefined,
            height: cameraResolution?.height
                ? { ideal: cameraResolution.height }
                : undefined,
            frameRate: cameraResolution?.frameRate
                ? { ideal: cameraResolution.frameRate }
                : undefined,
        },
    };
};