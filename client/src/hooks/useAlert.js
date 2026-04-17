import { useRef, useCallback } from 'react';

const CONSECUTIVE_FRAMES = 15;   // ~0.5s at 30fps
const COOLDOWN_MS = 8000;        // 8s before next alert

export function useAlert(onAlert) {
  const drowsyFrames  = useRef(0);
  const lastAlertTime = useRef(0);
  const alarmRef      = useRef(new Audio('/alarm.mp3'));

  const check = useCallback(({ isDrowsy, isYawning, score }) => {
    const now = Date.now();

    if (isDrowsy || isYawning || score > 60) {
      drowsyFrames.current += 1;
    } else {
      drowsyFrames.current = Math.max(0, drowsyFrames.current - 1);
    }

    const cooldownOk = now - lastAlertTime.current > COOLDOWN_MS;

    if (drowsyFrames.current >= CONSECUTIVE_FRAMES && cooldownOk) {
      lastAlertTime.current = now;
      drowsyFrames.current = 0;
      alarmRef.current.play().catch(() => {});
      onAlert({ type: 'DROWSY', timestamp: now, score });
    }
  }, [onAlert]);

  return { check };
}