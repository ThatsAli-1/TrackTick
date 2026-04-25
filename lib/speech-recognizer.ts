/** Browser FFT speech recognizer from @tensorflow-models/speech-commands (loaded via script tag). */
export type BrowserSpeechRecognizer = {
  ensureModelLoaded: () => Promise<void>;
  wordLabels: () => string[];
  listen: (
    cb: (result: { scores: number[] }) => void,
    opts: { includeSpectrogram: boolean; probabilityThreshold: number },
  ) => Promise<void>;
  stopListening: () => Promise<void>;
};
