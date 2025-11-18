"use client";
import Image from "next/image";
import {useMedia} from "@/app/providers/media/MediaContext";
import {useState} from "react";

export default function Home() {

  const {
    startCamera,
    stopAll,
    stopCamera,
    startMic,
    audioRef,
    videoRef,
    devices,
    volume,
    mirrorEnabled,
    setMirrorEnabled,
    cameraResolution,
    setCameraResolution,
    selectedCameraId,
    setSelectedCameraId,
    selectedMicId,
    setSelectedMicId,
    selectedSpeakerId,
    setSelectedSpeakerId
  } = useMedia();

  const cams = devices.filter((d) => d.kind === "videoinput");
  const mics = devices.filter((d) => d.kind === "audioinput");
  const speakers = devices.filter((d) => d.kind === "audiooutput");

  const [showSettings, setShowSettings] = useState(false);

  return (
      <div className="flex flex-col items-center w-full min-h-screen bg-neutral-950 text-white p-6">

        {/* ============================
          YOUTUBE-STYLE VIDEO WRAPPER
      ============================= */}
        <div className="relative bg-black w-full max-w-5xl aspect-video rounded-xl overflow-hidden shadow-lg border border-neutral-800">

          {/* CAMERA FEED */}
          <video
              ref={videoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-cover transition-transform duration-300 ${
                  mirrorEnabled ? "scale-x-[-1]" : ""
              }`}
          />

          {/* PLAYER OVERLAY (BOTTOM BAR) */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex justify-between items-end">

            {/* LEFT SIDE BUTTONS */}
            <div className="flex items-center gap-3">
              <button
                  onClick={startCamera}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-medium"
              >
                ▶ Kamera Aç
              </button>

              <button
                  onClick={stopCamera}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg font-medium"
              >
                ⛔ Durdur
              </button>

              <button
                  onClick={startMic}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium"
              >
                🎤 Mikrofon
              </button>
            </div>

            {/* SETTINGS BUTTON */}
            <button
                onClick={() => setShowSettings(!showSettings)}
                className="px-3 py-2 bg-neutral-900/60 hover:bg-neutral-900/80 border border-neutral-700 rounded-lg"
            >
              ⚙️
            </button>
          </div>
        </div>

        {/* ============================
          SETTINGS PANEL (YOUTUBE)
      ============================= */}
        {showSettings && (
            <div className="w-full max-w-5xl mt-4 bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">

              {/* CAMERA SELECT */}
              <div>
                <label className="text-sm text-neutral-400">Kamera</label>
                <select
                    className="w-full mt-1 bg-neutral-800 p-2 rounded"
                    value={selectedCameraId ?? ""}
                    onChange={(e) => setSelectedCameraId(e.target.value)}
                >
                  <option value="">Varsayılan</option>
                  {cams.map((c) => (
                      <option key={c.deviceId} value={c.deviceId}>
                        {c.label}
                      </option>
                  ))}
                </select>
              </div>

              {/* RESOLUTION SELECT */}
              <div>
                <label className="text-sm text-neutral-400">Çözünürlük</label>
                <select
                    className="w-full mt-1 bg-neutral-800 p-2 rounded"
                    value={`${cameraResolution.width}x${cameraResolution.height}`}
                    onChange={(e) => {
                      const [w, h] = e.target.value.split("x").map(Number);
                      setCameraResolution({ width: w, height: h, frameRate: 30 });
                    }}
                >
                  <option value="640x480">480p (640×480)</option>
                  <option value="1280x720">720p (1280×720)</option>
                  <option value="1920x1080">1080p (1920×1080)</option>
                  <option value="2560x1440">1440p (2560×1440)</option>
                  <option value="3840x2160">4K (3840×2160)</option>
                </select>
              </div>

              {/* MIRROR MODE */}
              <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    checked={mirrorEnabled}
                    onChange={(e) => setMirrorEnabled(e.target.checked)}
                />
                <span>Ayna Modu</span>
              </div>

              {/* MICROPHONE SELECT */}
              <div>
                <label className="text-sm text-neutral-400">Mikrofon</label>
                <select
                    className="w-full mt-1 bg-neutral-800 p-2 rounded"
                    value={selectedMicId ?? ""}
                    onChange={(e) => setSelectedMicId(e.target.value)}
                >
                  {mics.map((m) => (
                      <option key={m.deviceId} value={m.deviceId}>
                        {m.label}
                      </option>
                  ))}
                </select>
              </div>

              {/* SPEAKER SELECT */}
              <div>
                <label className="text-sm text-neutral-400">Hoparlör</label>
                <select
                    className="w-full mt-1 bg-neutral-800 p-2 rounded"
                    value={selectedSpeakerId ?? ""}
                    onChange={(e) => setSelectedSpeakerId(e.target.value)}
                >
                  {speakers.map((s) => (
                      <option key={s.deviceId} value={s.deviceId}>
                        {s.label}
                      </option>
                  ))}
                </select>
              </div>

            </div>
        )}

        {/* ============================
          AUDIO + VOLUME METER
      ============================= */}
        <div className="mt-6 w-full max-w-5xl bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center gap-4">

          <audio ref={audioRef} controls className="h-10" />

          {/* VOLUME METER */}
          <div className="flex-1 h-3 bg-neutral-800 rounded-lg overflow-hidden">
            <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${volume * 100}%` }}
            />
          </div>

          <span className="text-neutral-400 w-12 text-right">
          {Math.round(volume * 100)}%
        </span>
        </div>
      </div>
  );
}
