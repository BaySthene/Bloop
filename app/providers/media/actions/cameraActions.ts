import {MediaState} from "@/app/providers/media/media.type";
import {applyMirror, bindVideoStream, getCameraConstraints} from "@/app/providers/media/actions/camera";

export function createCameraActions(state: MediaState) {
    const { videoRef, setVideoStream, mirrorEnabled } = state;

    const startCamera = async () => {
        const constraints = getCameraConstraints(state);

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        setVideoStream(stream);

        await bindVideoStream(videoRef.current, stream);

        applyMirror(videoRef.current, mirrorEnabled);
    };

    return { startCamera };
}