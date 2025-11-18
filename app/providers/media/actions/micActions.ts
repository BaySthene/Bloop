import {MediaState} from "@/app/providers/media/media.type";

export function createMicActions(state: MediaState) {
    const { audioRef, selectedMicId, setAudioStream, setVolume } = state;

    const startMic = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                deviceId: selectedMicId ? { exact: selectedMicId } : undefined,
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false,
            }
        });

        setAudioStream(stream);

        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        const data = new Uint8Array(analyser.frequencyBinCount);

        const loop = () => {
            analyser.getByteFrequencyData(data);
            setVolume(Math.max(...data) / 255);
            requestAnimationFrame(loop);
        };

        loop();

        if (audioRef.current) {
            audioRef.current.srcObject = stream;
            await audioRef.current.play();
        }
    };

    return { startMic };
}