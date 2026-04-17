import { useRef, useState, useEffect, useCallback } from 'react';
import FatigueGauge from '../components/FatigueGauge';
import { computeFatigueScore, getRiskLevel } from '../utils/fatigueScore';
import { toast } from 'react-toastify';

const EAR_THRESHOLD      = 0.25;
const MAR_THRESHOLD      = 0.60;
const CONSECUTIVE_FRAMES = 15;
const COOLDOWN_MS        = 8000;

// Load a script tag dynamically and resolve when ready
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.crossOrigin = 'anonymous';
    s.onload  = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export default function Detection() {
  const videoRef     = useRef(null);
  const canvasRef    = useRef(null);
  const faceMeshRef  = useRef(null);
  const animRef      = useRef(null);
  const drowsyFrames = useRef(0);
  const lastAlert    = useRef(0);
  const lastState    = useRef(0);
  const alarmRef     = useRef(null);
  const eventBuffer  = useRef([]);

  const [metrics,    setMetrics]    = useState(null);
  const [alertActive,setAlert]      = useState(false);
  const [running,    setRunning]    = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [camError,   setCamError]   = useState('');
  const [status,     setStatus]     = useState('Loading face detection model...');

  // ── Load MediaPipe via CDN script tags ──────────────────
  useEffect(() => {
    alarmRef.current = new Audio('/alarm.mp3');

    async function initMediaPipe() {
      try {
        setStatus('Loading MediaPipe scripts...');

        // Load all required MediaPipe scripts from CDN
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js');
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js');
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js');

        setStatus('Initializing face mesh...');

        // window.FaceMesh is now available from the CDN script
        const faceMesh = new window.FaceMesh({
          locateFile: (file) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        faceMesh.onResults(handleResults);

        await faceMesh.initialize();
        faceMeshRef.current = faceMesh;

        setModelReady(true);
        setStatus('Model ready');
        setCamError('');
      } catch (err) {
        console.error('MediaPipe load error:', err);
        setCamError(
          'Failed to load face detection model. ' +
          'Make sure you have internet connection and try refreshing the page.'
        );
        setStatus('');
      }
    }

    initMediaPipe();

    return () => {
      cancelAnimationFrame(animRef.current);
      stopCamera();
    };
  }, []);

  // ── Landmark math ────────────────────────────────────────
  function dist(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }

  function calcEAR(lm, pts) {
    const [p1, p2, p3, p4, p5, p6] = pts.map(i => lm[i]);
    return (dist(p2, p6) + dist(p3, p5)) / (2 * dist(p1, p4));
  }

  function calcMAR(lm) {
    const pts = [61, 291, 39, 181, 0, 17, 269, 405].map(i => lm[i]);
    return (dist(pts[2], pts[6]) + dist(pts[3], pts[7])) / (2 * dist(pts[0], pts[1]));
  }

  // ── Process FaceMesh results ─────────────────────────────
  const handleResults = useCallback((results) => {
    if (!results.multiFaceLandmarks?.length) return;

    const lm  = results.multiFaceLandmarks[0];
    const ear = (calcEAR(lm, [362,385,387,263,373,380]) +
                 calcEAR(lm, [33,160,158,133,153,144])) / 2;
    const mar = calcMAR(lm);

    const nose = lm[1], chin = lm[152];
    const headTilt = Math.abs(
      Math.atan2(chin.x - nose.x, chin.y - nose.y) * (180 / Math.PI)
    );

    const isDrowsy  = ear < EAR_THRESHOLD;
    const isYawning = mar > MAR_THRESHOLD;
    const score     = computeFatigueScore({ ear, mar, headTilt });
    const risk      = getRiskLevel(score);

    // ── Alert logic ──────────────────────────────────────
    if (isDrowsy || isYawning || score > 60) {
      drowsyFrames.current += 1;
    } else {
      drowsyFrames.current = Math.max(0, drowsyFrames.current - 1);
    }

    const now        = Date.now();
    const cooldownOk = now - lastAlert.current > COOLDOWN_MS;

    if (drowsyFrames.current >= CONSECUTIVE_FRAMES && cooldownOk) {
      lastAlert.current    = now;
      drowsyFrames.current = 0;
      alarmRef.current?.play().catch(() => {});
      setAlert(true);
      setTimeout(() => setAlert(false), 6000);
      toast.warning('⚠ Drowsiness detected! Pull over safely.');
    }

    // Buffer event
    eventBuffer.current.push({
      ear: +ear.toFixed(4), mar: +mar.toFixed(4),
      headTilt: +headTilt.toFixed(2), fatigueScore: score,
      isDrowsy, isYawning, timestamp: now,
    });

    // Throttle React state — update only 2× per second
    if (now - lastState.current > 500) {
      lastState.current = now;
      setMetrics({
        ear: +ear.toFixed(3), mar: +mar.toFixed(3),
        headTilt: +headTilt.toFixed(1),
        score, risk, isDrowsy, isYawning,
      });
    }

    // Draw landmarks on canvas
    drawLandmarks(results);
  }, []);

  // ── Draw face mesh on canvas ─────────────────────────────
  function drawLandmarks(results) {
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    if (!canvas || !video) return;

    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.multiFaceLandmarks && window.drawConnectors && window.FACEMESH_TESSELATION) {
      for (const landmarks of results.multiFaceLandmarks) {
        window.drawConnectors(ctx, landmarks, window.FACEMESH_TESSELATION,
          { color: '#1D9E7533', lineWidth: 1 });
        window.drawConnectors(ctx, landmarks, window.FACEMESH_RIGHT_EYE,
          { color: '#1D9E75', lineWidth: 2 });
        window.drawConnectors(ctx, landmarks, window.FACEMESH_LEFT_EYE,
          { color: '#1D9E75', lineWidth: 2 });
        window.drawConnectors(ctx, landmarks, window.FACEMESH_LIPS,
          { color: '#BA7517', lineWidth: 2 });
      }
    }
  }

  // ── Camera ───────────────────────────────────────────────
  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      return true;
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setCamError('Camera permission denied. Please allow camera access in your browser.');
      } else {
        setCamError('No camera found. Connect a webcam and try again.');
      }
      return false;
    }
  }

  function stopCamera() {
    videoRef.current?.srcObject
      ?.getTracks().forEach(t => t.stop());
  }

  // ── Detection loop ───────────────────────────────────────
  async function loop() {
    if (
      videoRef.current?.readyState === 4 &&
      faceMeshRef.current
    ) {
      await faceMeshRef.current.send({ image: videoRef.current });
    }
    animRef.current = requestAnimationFrame(loop);
  }

  // ── Start / Stop ─────────────────────────────────────────
  async function handleStart() {
    setCamError('');
    const ok = await startCamera();
    if (!ok) return;
    setRunning(true);
    setMetrics(null);
    loop();
    toast.success('Detection started');
  }

  function handleStop() {
    cancelAnimationFrame(animRef.current);
    stopCamera();
    setRunning(false);
    setMetrics(null);
    drowsyFrames.current = 0;
    toast.info('Detection stopped');
  }

  // ── Render ───────────────────────────────────────────────
  const borderColor = running
    ? (metrics?.risk?.color || '#1D9E75')
    : '#1e2a1e';

  return (
    <div style={styles.page}>

      {/* Alert banner */}
      {alertActive && (
        <div style={styles.alertBanner}>
          ⚠ DROWSINESS DETECTED — Pull over safely and rest
        </div>
      )}

      <div style={styles.container}>
        <h1 style={styles.title}>Live Detection</h1>

        {camError && (
          <div style={styles.errorBox}>{camError}</div>
        )}

        <div style={styles.cameraRow}>

          {/* Video */}
          <div style={{ ...styles.videoWrap, borderColor }}>
            <video
              ref={videoRef} muted playsInline
              style={styles.video}
            />
            <canvas ref={canvasRef} style={styles.canvas} />

            {!running && (
              <div style={styles.videoOverlay}>
                {modelReady ? '📷 Camera off' : status}
              </div>
            )}
          </div>

          {/* Right panel */}
          <div style={styles.rightPanel}>

            {metrics
              ? <FatigueGauge score={metrics.score} risk={metrics.risk} />
              : (
                <div style={styles.gaugePlaceholder}>
                  <span style={{ color: '#444', fontSize: '13px' }}>
                    {modelReady ? 'Start detection to see score' : status}
                  </span>
                </div>
              )
            }

            {metrics && (
              <div style={styles.metricsBox}>
                <MetricRow label="EAR"       value={metrics.ear}            warn={metrics.isDrowsy}      />
                <MetricRow label="MAR"       value={metrics.mar}            warn={metrics.isYawning}     />
                <MetricRow label="Head Tilt" value={metrics.headTilt + '°'} warn={metrics.headTilt > 20} />
              </div>
            )}

            <button
              onClick={running ? handleStop : handleStart}
              disabled={!modelReady}
              style={{
                ...styles.actionBtn,
                background: running ? '#7f1d1d' : '#1D9E75',
                cursor: modelReady ? 'pointer' : 'not-allowed',
                opacity: modelReady ? 1 : 0.5,
              }}
            >
              {running ? '⏹ Stop Detection' : '▶ Start Detection'}
            </button>

            {!modelReady && !camError && (
              <p style={{ color: '#555', fontSize: '12px', textAlign: 'center' }}>
                {status}
              </p>
            )}
          </div>
        </div>

        <div style={styles.tipsBox}>
          <span style={{ color: '#1D9E75', fontWeight: 500 }}>Tips: </span>
          <span style={{ color: '#666', fontSize: '13px' }}>
            Ensure good lighting · Face the camera directly · Keep your face fully in frame
          </span>
        </div>
      </div>
    </div>
  );
}

function MetricRow({ label, value, warn }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      padding: '6px 0', borderBottom: '1px solid #1a1a1a',
    }}>
      <span style={{ color: '#666',  fontSize: '13px' }}>{label}</span>
      <span style={{ color: warn ? '#ef4444' : '#1D9E75', fontSize: '13px', fontWeight: 500 }}>
        {value}
      </span>
    </div>
  );
}

const styles = {
  page:         { background: '#0a0e0a', minHeight: 'calc(100vh - 60px)', padding: '2rem 1rem' },
  alertBanner:  { position: 'fixed', top: '60px', left: 0, right: 0, zIndex: 999, background: '#7f1d1d', color: '#fca5a5', textAlign: 'center', padding: '14px', fontSize: '16px', fontWeight: 600 },
  container:    { maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  title:        { color: '#fff', fontSize: '22px', fontWeight: 600 },
  errorBox:     { background: '#7f1d1d22', border: '1px solid #7f1d1d', borderRadius: '8px', padding: '12px 16px', color: '#fca5a5', fontSize: '14px' },
  cameraRow:    { display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' },
  videoWrap:    { flex: '1 1 400px', position: 'relative', border: '2px solid', borderRadius: '12px', overflow: 'hidden', background: '#000', minHeight: '300px', transition: 'border-color 0.4s ease' },
  video:        { width: '100%', display: 'block', transform: 'scaleX(-1)' },
  canvas:       { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'scaleX(-1)' },
  videoOverlay: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '14px' },
  rightPanel:   { display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: '180px' },
  gaugePlaceholder: { width: '160px', height: '160px', border: '1px solid #1e2a1e', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', textAlign: 'center' },
  metricsBox:   { background: '#0f1117', border: '1px solid #1e2a1e', borderRadius: '10px', padding: '12px 14px' },
  actionBtn:    { padding: '12px', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '15px', fontWeight: 600, transition: 'background 0.2s' },
  tipsBox:      { background: '#0f1117', border: '1px solid #1e2a1e', borderRadius: '8px', padding: '12px 16px' },
};