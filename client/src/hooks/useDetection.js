import { useEffect, useRef, useCallback } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import { avgEAR } from '../utils/earCalculator';
import { calcMAR } from '../utils/marCalculator';

const EAR_THRESHOLD = 0.25; // below = eye closed
const MAR_THRESHOLD = 0.6;  // above = yawning

export function useDetection(videoRef, canvasRef, onResult) {
  const faceMeshRef = useRef(null);

  const processResults = useCallback((results) => {
    if (!results.multiFaceLandmarks?.length) return;
    const landmarks = results.multiFaceLandmarks[0];
    const ear = avgEAR(landmarks);
    const mar = calcMAR(landmarks);

    // Head tilt: angle from nose tip to chin relative to vertical
    const nose = landmarks[1];
    const chin = landmarks[152];
    const headTilt = Math.abs(
      Math.atan2(chin.x - nose.x, chin.y - nose.y) * (180 / Math.PI)
    );

    onResult({
      ear: parseFloat(ear.toFixed(4)),
      mar: parseFloat(mar.toFixed(4)),
      isDrowsy: ear < EAR_THRESHOLD,
      isYawning: mar > MAR_THRESHOLD,
      headTilt: parseFloat(headTilt.toFixed(2)),
    });
  }, [onResult]);

  useEffect(() => {
    faceMeshRef.current = new FaceMesh({
      locateFile: (f) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`,
    });
    faceMeshRef.current.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    faceMeshRef.current.onResults(processResults);

    let animId;
    const detect = async () => {
      if (videoRef.current?.readyState === 4) {
        await faceMeshRef.current.send({ image: videoRef.current });
      }
      animId = requestAnimationFrame(detect);
    };
    detect();
    return () => cancelAnimationFrame(animId);
  }, [videoRef, processResults]);
}