// Hook to simulate snapshot playback of time-series frames (e.g., weekly trends)
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * useSnapshotSimulation
 * Inputs: frames: array of frame objects, getId(frame) -> unique id/string
 * Outputs: { playing, currentIndex, currentFrame, play, pause, toggle, step, reset }
 */
export function useSnapshotSimulation({ frames = [], intervalMs = 1200, getId }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef(null);

  const safeGetId = useMemo(() => getId || ((f, i) => f?.id ?? i), [getId]);

  const currentFrame = frames?.[currentIndex] ?? null;

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const step = useCallback(
    (delta = 1) => {
      if (!frames || frames.length === 0) return;
      setCurrentIndex((idx) => (idx + delta + frames.length) % frames.length);
    },
    [frames]
  );

  const play = useCallback(() => {
    if (!frames || frames.length === 0) return;
    if (playing) return;
    setPlaying(true);
    timerRef.current = setInterval(() => step(1), intervalMs);
  }, [frames, intervalMs, playing, step]);

  const pause = useCallback(() => {
    setPlaying(false);
    clear();
  }, [clear]);

  const toggle = useCallback(() => {
    if (playing) pause();
    else play();
  }, [play, pause, playing]);

  const reset = useCallback(() => {
    pause();
    setCurrentIndex(0);
  }, [pause]);

  useEffect(() => () => clear(), [clear]);

  return {
    playing,
    currentIndex,
    currentFrame,
    currentId: currentFrame ? safeGetId(currentFrame, currentIndex) : null,
    play,
    pause,
    toggle,
    step,
    reset,
  };
}
