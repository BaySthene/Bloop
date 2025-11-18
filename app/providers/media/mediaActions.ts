

import {MediaState} from "@/app/providers/media/media.type";
import {
    createCameraActions,
    createDeviceActions,
    createMicActions,
    createSpeakerActions
} from "@/app/providers/media/actions";
import {stopCamera} from "@/app/providers/media/actions/camera";

export function createMediaActions(state: MediaState) {
    return {
        ...createMicActions(state),
        ...createCameraActions(state),
        ...createSpeakerActions(state),
        ...createDeviceActions(state),

        stopCamera: () => stopCamera(state.videoStream, state.videoRef.current),
        stopAll: () => {
            state.videoStream?.getTracks().forEach((t) => t.stop());
            state.audioStream?.getTracks().forEach((t) => t.stop());

            if (state.videoRef.current) {
                state.videoRef.current.srcObject = null;
            }
            if (state.audioRef.current) {
                state.audioRef.current.srcObject = null;
            }

            state.setAudioStream(null);
            state.setVideoStream(null);
        }
    };
}
