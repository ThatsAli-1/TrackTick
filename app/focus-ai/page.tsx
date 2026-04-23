"use client";

import { useEffect, useRef, useState } from "react";
import { AppShell, useTrackTheme } from "@/app/components/app-shell";
import * as tmPose from "@teachablemachine/pose";

type PosePrediction = { className: string; probability: number };
type BrowserRecognizer = {
  ensureModelLoaded: () => Promise<void>;
  wordLabels: () => string[];
  listen: (
    cb: (result: { scores: number[] }) => void,
    opts: { includeSpectrogram: boolean; probabilityThreshold: number },
  ) => Promise<void>;
  stopListening: () => Promise<void>;
};

const poseModelURL = "/api/models/pose/model.json";
const poseMetaURL = "/api/models/pose/metadata.json";
const audioModelURL = "/api/models/audio/model.json";
const audioMetaURL = "/api/models/audio/metadata.json";

export default function FocusAIPage() {
  const { palette } = useTrackTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const webcamRef = useRef<tmPose.Webcam | null>(null);
  const poseModelRef = useRef<tmPose.CustomPoseNet | null>(null);
  const audioRef = useRef<BrowserRecognizer | null>(null);
  const rafRef = useRef<number | null>(null);

  const [running, setRunning] = useState(false);
  const [poseStatus, setPoseStatus] = useState("Loading model...");
  const [posePredictions, setPosePredictions] = useState<PosePrediction[]>([]);
  const [audioStatus, setAudioStatus] = useState("Waiting...");
  const [lastCommand, setLastCommand] = useState("None");
  async function loadScript(src: string) {
    if (document.querySelector(`script[src="${src}"]`)) return;
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.body.appendChild(script);
    });
  }

  const [error, setError] = useState("");

  async function stopEverything() {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (webcamRef.current) {
      webcamRef.current.stop();
      webcamRef.current = null;
    }
    if (audioRef.current) {
      await audioRef.current.stopListening();
    }
    setRunning(false);
  }

  async function drawFrame() {
    const webcam = webcamRef.current;
    const model = poseModelRef.current;
    const canvas = canvasRef.current;
    if (!webcam || !model || !canvas) return;

    webcam.update();
    const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
    const prediction = await model.predict(posenetOutput);
    const normalized = prediction
      .map((p) => ({ className: p.className, probability: p.probability }))
      .sort((a, b) => b.probability - a.probability);
    setPosePredictions(normalized);
    setPoseStatus(normalized[0] ? `${normalized[0].className} (${(normalized[0].probability * 100).toFixed(1)}%)` : "No prediction");

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(webcam.canvas, 0, 0);
      if (pose) {
        tmPose.drawKeypoints(pose.keypoints, 0.2, ctx);
        tmPose.drawSkeleton(pose.keypoints, 0.2, ctx);
      }
    }

    rafRef.current = requestAnimationFrame(() => {
      void drawFrame();
    });
  }

  async function startEverything() {
    try {
      setError("");
      setPoseStatus("Initializing...");

      const model = await tmPose.load(poseModelURL, poseMetaURL);
      poseModelRef.current = model;

      const size = 320;
      const flip = true;
      const webcam = new tmPose.Webcam(size, size, flip);
      await webcam.setup();
      await webcam.play();
      webcamRef.current = webcam;

      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = size;
        canvas.height = size;
      }

      await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js");
      await loadScript(
        "https://cdn.jsdelivr.net/npm/@tensorflow-models/speech-commands@0.5.4/dist/speech-commands.min.js",
      );
      const speechCommands = (window as Window & { speechCommands?: { create: (...args: unknown[]) => BrowserRecognizer } })
        .speechCommands;
      if (!speechCommands) {
        throw new Error("Speech commands library not available in browser.");
      }
      const recognizer = speechCommands.create("BROWSER_FFT", undefined, audioModelURL, audioMetaURL);
      await recognizer.ensureModelLoaded();
      await recognizer.listen(
        (result) => {
          const labels = recognizer.wordLabels();
          let maxIdx = 0;
          for (let i = 1; i < result.scores.length; i += 1) {
            if (result.scores[i] > result.scores[maxIdx]) maxIdx = i;
          }
          const word = labels[maxIdx];
          const score = result.scores[maxIdx];
          if (score > 0.8 && word.toLowerCase() !== "background noise") {
            setLastCommand(word);
            setAudioStatus(`${word} (${(score * 100).toFixed(1)}%)`);
          }
        },
        { includeSpectrogram: false, probabilityThreshold: 0.75 },
      );
      audioRef.current = recognizer;

      setRunning(true);
      void drawFrame();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start AI models.");
      await stopEverything();
    }
  }

  useEffect(() => {
    return () => {
      void stopEverything();
    };
  }, []);

  return (
    <AppShell>
      <h1 className="text-4xl">Focus AI</h1>
      <p className="mt-2" style={{ color: palette.mutedText }}>
        Live Teachable Machine pose + voice model inference
      </p>

      <div className="mt-5 flex gap-3">
        {!running ? (
          <button type="button" onClick={() => void startEverything()} className="rounded-lg px-4 py-2" style={{ background: palette.accent }}>
            Start Camera + Mic
          </button>
        ) : (
          <button type="button" onClick={() => void stopEverything()} className="rounded-lg px-4 py-2" style={{ background: palette.accent }}>
            Stop
          </button>
        )}
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl p-4" style={{ background: palette.cardBg }}>
          <p className="text-xl">Pose Model</p>
          <p className="mt-2 text-sm">{poseStatus}</p>
          <canvas ref={canvasRef} className="mt-4 w-full max-w-[360px] rounded-lg" />
          <div className="mt-4 space-y-1 text-sm">
            {posePredictions.map((item) => (
              <p key={item.className}>
                {item.className}: {(item.probability * 100).toFixed(1)}%
              </p>
            ))}
          </div>
        </section>

        <section className="rounded-2xl p-4" style={{ background: palette.cardBg }}>
          <p className="text-xl">Audio Model</p>
          <p className="mt-2 text-sm">Detected command: {lastCommand}</p>
          <p className="mt-1 text-sm">Status: {audioStatus}</p>
          <div className="mt-5 rounded-xl p-3 text-sm" style={{ background: palette.accent }}>
            Say your trained commands like <strong>Start</strong> or <strong>stop</strong>.
          </div>
        </section>
      </div>
    </AppShell>
  );
}
