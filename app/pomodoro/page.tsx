"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppShell, useTrackTheme } from "@/app/components/app-shell";
import * as tmPose from "@teachablemachine/pose";
import * as tf from "@tensorflow/tfjs";

const poseModelURL = "/api/models/pose/model.json";
const poseMetaURL = "/api/models/pose/metadata.json";
const MODE_SECONDS = {
  pomodoro: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
} as const;
type PomodoroMode = keyof typeof MODE_SECONDS;

type BrowserRecognizer = {
  ensureModelLoaded: () => Promise<void>;
  wordLabels: () => string[];
  listen: (
    cb: (result: { scores: number[] }) => void,
    opts: { includeSpectrogram: boolean; probabilityThreshold: number },
  ) => Promise<void>;
  stopListening: () => Promise<void>;
};

export default function PomodoroPage() {
  const { palette } = useTrackTheme();
  const [mode, setMode] = useState<PomodoroMode>("pomodoro");
  const [secondsLeft, setSecondsLeft] = useState(MODE_SECONDS.pomodoro);
  const [running, setRunning] = useState(false);
  const [goal, setGoal] = useState(6);
  const [sessions, setSessions] = useState<{ id: number; durationSeconds: number; completedAt: string }[]>([]);
  const [tasks, setTasks] = useState<{ id: number; title: string; done: boolean }[]>([]);
  const [aiReady, setAiReady] = useState(false);
  const [aiBooting, setAiBooting] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("Idle");
  const [poseStatus, setPoseStatus] = useState("Idle");

  const webcamRef = useRef<tmPose.Webcam | null>(null);
  const poseModelRef = useRef<tmPose.CustomPoseNet | null>(null);
  const recognizerRef = useRef<BrowserRecognizer | null>(null);
  const aiLoopRef = useRef<number | null>(null);
  const distractedSinceRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  const secondsRef = useRef(MODE_SECONDS.pomodoro);

  useEffect(() => {
    void fetch("/api/pomodoro/sessions")
      .then((res) => res.json())
      .then((data) => setSessions(data));

    void fetch("/api/tasks")
      .then((res) => res.json())
      .then((data) => setTasks(data));
  }, []);

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

  const logSessionCompletion = useCallback(async () => {
    await fetch("/api/pomodoro/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, durationSeconds: MODE_SECONDS[mode] }),
    });
    const data = await fetch("/api/pomodoro/sessions").then((res) => res.json());
    setSessions(data);
    setSecondsLeft(MODE_SECONDS[mode]);
  }, [mode]);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      if (secondsRef.current <= 1) {
        setRunning(false);
        setSecondsLeft(0);
        void logSessionCompletion();
        return;
      }
      setSecondsLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [running, logSessionCompletion]);

  useEffect(() => {
    secondsRef.current = secondsLeft;
  }, [secondsLeft]);

  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  async function stopAI() {
    if (aiLoopRef.current) {
      cancelAnimationFrame(aiLoopRef.current);
      aiLoopRef.current = null;
    }
    if (webcamRef.current) {
      webcamRef.current.stop();
      webcamRef.current = null;
    }
    if (recognizerRef.current) {
      await recognizerRef.current.stopListening();
      recognizerRef.current = null;
    }
    poseModelRef.current = null;
    distractedSinceRef.current = null;
    setAiReady(false);
    setAiBooting(false);
  }

  async function poseLoop(now: number) {
    const webcam = webcamRef.current;
    const model = poseModelRef.current;
    if (!webcam || !model) return;

    webcam.update();
    const { posenetOutput } = await model.estimatePose(webcam.canvas);
    const predictions = await model.predict(posenetOutput);
    const top = [...predictions].sort((a, b) => b.probability - a.probability)[0];
    const topClass = top?.className?.toLowerCase() ?? "";
    const topProb = top?.probability ?? 0;
    const focused = topClass.includes("focused") && topProb > 0.7;

    setPoseStatus(top ? `${top.className} ${(top.probability * 100).toFixed(1)}%` : "No pose result");

    if (!focused) {
      if (!distractedSinceRef.current) {
        distractedSinceRef.current = now;
      }
      if (now - distractedSinceRef.current > 5000 && runningRef.current) {
        setRunning(false);
        setVoiceStatus("Auto-paused: distracted >5s");
      }
    } else {
      if (distractedSinceRef.current && !runningRef.current) {
        setRunning(true);
        setVoiceStatus("Auto-resumed: focused again");
      }
      distractedSinceRef.current = null;
    }

    aiLoopRef.current = requestAnimationFrame((ts) => {
      void poseLoop(ts);
    });
  }

  async function startAI() {
    try {
      setAiBooting(true);
      const poseModel = await tmPose.load(poseModelURL, poseMetaURL);
      poseModelRef.current = poseModel;
      const webcam = new tmPose.Webcam(256, 256, true);
      await webcam.setup();
      await webcam.play();
      webcamRef.current = webcam;

      const win = window as Window & {
        tf?: typeof tf;
        speechCommands?: { create: (...args: unknown[]) => BrowserRecognizer };
      };
      if (!win.tf) {
        win.tf = tf;
      }
      await loadScript(
        "https://cdn.jsdelivr.net/npm/@tensorflow-models/speech-commands@0.5.4/dist/speech-commands.min.js",
      );
      const speechCommands = win.speechCommands;
      if (!speechCommands) throw new Error("Speech model loader missing.");
      const origin = window.location.origin;
      const recognizer = speechCommands.create(
        "BROWSER_FFT",
        undefined,
        `${origin}/api/models/audio/model.json`,
        `${origin}/api/models/audio/metadata.json`,
      );
      await recognizer.ensureModelLoaded();
      await recognizer.listen(
        (result) => {
          const labels = recognizer.wordLabels();
          let maxIdx = 0;
          for (let i = 1; i < result.scores.length; i += 1) {
            if (result.scores[i] > result.scores[maxIdx]) maxIdx = i;
          }
          const word = labels[maxIdx]?.toLowerCase() ?? "";
          const score = result.scores[maxIdx] ?? 0;
          if (score < 0.8 || word === "background noise") return;
          setVoiceStatus(`${word} ${(score * 100).toFixed(1)}%`);
          if (word === "start") {
            setRunning(true);
          }
          if (word === "stop") {
            setRunning(false);
          }
        },
        { includeSpectrogram: false, probabilityThreshold: 0.75 },
      );
      recognizerRef.current = recognizer;

      setAiReady(true);
      setAiBooting(false);
      setVoiceStatus("Listening for Start/stop");
      aiLoopRef.current = requestAnimationFrame((ts) => {
        void poseLoop(ts);
      });
    } catch (err) {
      setVoiceStatus(err instanceof Error ? err.message : "AI init failed");
      await stopAI();
    }
  }

  useEffect(() => {
    return () => {
      void stopAI();
    };
  }, []);

  async function finishSession() {
    setRunning(false);
    await logSessionCompletion();
    setSecondsLeft(MODE_SECONDS[mode]);
  }

  function switchMode(nextMode: PomodoroMode) {
    setMode(nextMode);
    setRunning(false);
    setSecondsLeft(MODE_SECONDS[nextMode]);
  }

  const display = useMemo(() => {
    const m = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
    const s = String(secondsLeft % 60).padStart(2, "0");
    return `${m}:${s}`;
  }, [secondsLeft]);

  return (
    <AppShell>
      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-3xl p-6" style={{ background: palette.cardBg }}>
          <h1 className="text-5xl">Focus Session</h1>
          <p className="mt-8 text-xl">Set your goal</p>
          <div className="mt-2 inline-flex items-center gap-5 rounded-xl px-3 py-2" style={{ background: palette.accent }}>
            <button type="button" onClick={() => setGoal((g) => Math.max(1, g - 1))}>
              -
            </button>
            <span>{goal}</span>
            <button type="button" onClick={() => setGoal((g) => Math.min(12, g + 1))}>
              +
            </button>
            <span className="text-xs">Pomodoros</span>
          </div>

          <p className="mt-8 text-xl">Session Progress</p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: palette.accent }}>
            {Array.from({ length: 6 }).map((_, idx) => (
              <span key={idx} className="text-xl">
                {idx < sessions.length % 6 ? "🍅" : "◔"}
              </span>
            ))}
          </div>

          <p className="mt-8 text-xl">Current Task</p>
          <div className="mt-2 inline-flex min-w-[280px] items-center justify-between rounded-xl px-3 py-2" style={{ background: palette.accent }}>
            <span>{tasks.find((task) => !task.done)?.title ?? "No active task"}</span>
            <span>&gt;</span>
          </div>
          <div className="mt-6 text-sm">
            <p>AI: {aiReady ? "Ready" : aiBooting ? "Loading..." : "Off"}</p>
            <p>Voice: {voiceStatus}</p>
            <p>Pose: {poseStatus}</p>
            <button
              type="button"
              onClick={() => void (aiReady ? stopAI() : startAI())}
              className="mt-3 rounded-lg px-3 py-1"
              style={{ background: palette.accent }}
            >
              {aiReady ? "Disable AI controls" : "Enable AI controls"}
            </button>
          </div>
        </section>

        <section className="rounded-3xl p-6 text-center" style={{ background: palette.cardBg }}>
          <p className="text-sm">
            <button
              type="button"
              onClick={() => switchMode("pomodoro")}
              className={mode === "pomodoro" ? "underline" : ""}
            >
              Pomodoro
            </button>
            <span className="mx-2">|</span>
            <button
              type="button"
              onClick={() => switchMode("shortBreak")}
              className={mode === "shortBreak" ? "underline" : ""}
            >
              Short Break
            </button>
            <span className="mx-2">|</span>
            <button
              type="button"
              onClick={() => switchMode("longBreak")}
              className={mode === "longBreak" ? "underline" : ""}
            >
              Long Break
            </button>
          </p>
          <p className="mt-5 text-8xl">
            {mode === "pomodoro" ? "Focus" : mode === "shortBreak" ? "Short" : "Long"}
          </p>
          <p className="mt-12 text-8xl">{display}</p>

          <div className="mx-auto mt-12 h-4 w-[70%] rounded-full" style={{ background: palette.progressFill }}>
            <div
              className="h-4 rounded-full"
              style={{
                width: `${((MODE_SECONDS[mode] - secondsLeft) / MODE_SECONDS[mode]) * 100}%`,
                background: palette.progressTrack,
              }}
            />
          </div>

          <div className="mt-12 flex items-center justify-center gap-2">
            <span className="text-sm">Pomodoros {sessions.length % goal}/{goal}</span>
            <button onClick={() => setRunning((v) => !v)} className="rounded-lg px-4 py-1" style={{ background: palette.accent }}>
              {running ? "PAUSE" : "START"}
            </button>
            <button
              onClick={() => {
                setRunning(false);
                setSecondsLeft(MODE_SECONDS[mode]);
              }}
              className="rounded-lg px-2 py-1"
              style={{ background: palette.accent }}
            >
              ◁
            </button>
            <button onClick={() => void finishSession()} className="rounded-lg px-2 py-1" style={{ background: palette.accent }}>
              ▷
            </button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
