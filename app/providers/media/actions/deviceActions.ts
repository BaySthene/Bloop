import {MediaState} from "@/app/providers/media/media.type";

export function createDeviceActions(state: MediaState) {
    const { setDevices } = state;

    const refreshDevices = async () => {
        const list = await navigator.mediaDevices.enumerateDevices();
        setDevices(list);
    };

    return { refreshDevices };
}
