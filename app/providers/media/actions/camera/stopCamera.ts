
export const stopCamera = (stream: MediaStream | null, video: HTMLVideoElement | null) => {
    if (stream) {
        stream.getTracks().forEach((t) => t.stop());
    }
    if (video) {
        video.srcObject = null;
    }
};
