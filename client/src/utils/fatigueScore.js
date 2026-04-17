export function computeFatigueScore({ ear, mar, headTilt }) {
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const earScore  = clamp((0.35 - ear) / 0.35, 0, 1) * 100;
  const marScore  = clamp((mar - 0.4)  / 0.6,  0, 1) * 100;
  const tiltScore = clamp(headTilt / 30,         0, 1) * 100;

  return Math.round(earScore * 0.5 + marScore * 0.3 + tiltScore * 0.2);
}

export function getRiskLevel(score) {
  if (score < 30) return { level: 'Safe',     color: '#1D9E75' };
  if (score < 60) return { level: 'Moderate', color: '#BA7517' };
  return               { level: 'High',     color: '#A32D2D' };
}