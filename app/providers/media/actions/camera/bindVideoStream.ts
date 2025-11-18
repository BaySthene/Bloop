export const bindVideoStream = async (
    video: HTMLVideoElement | null,
    stream: MediaStream
) => {
    if (!video) return;
    video.srcObject = stream;
    await video.play();
};
