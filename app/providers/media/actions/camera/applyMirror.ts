export const applyMirror = (
    video: HTMLVideoElement | null,
    enabled: boolean
) => {
    if (!video) return;
    video.style.transform = enabled ? "scaleX(-1)" : "scaleX(1)";
};
