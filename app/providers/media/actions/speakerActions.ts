import {MediaState} from "@/app/providers/media/media.type";

export function createSpeakerActions(state: MediaState) {
    const { audioRef, selectedSpeakerId } = state;

    const changeSpeaker = async () => {
        if (!audioRef.current || !selectedSpeakerId) return;

        if (typeof audioRef.current.setSinkId === "function") {
            await audioRef.current.setSinkId(selectedSpeakerId);
        }
    };

    return { changeSpeaker };
}
