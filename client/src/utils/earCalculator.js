// EAR = Eye Aspect Ratio
// Based on Soukupova & Cech (2016) formula
// EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)

function dist(a, b) {
  return Math.sqrt(
    Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2)
  );
}

export function calcEAR(landmarks, eyeIndices) {
  const [p1, p2, p3, p4, p5, p6] =
    eyeIndices.map(i => landmarks[i]);

  const vertical1 = dist(p2, p6);
  const vertical2 = dist(p3, p5);
  const horizontal = dist(p1, p4);

  return (vertical1 + vertical2) / (2.0 * horizontal);
}

export function avgEAR(landmarks) {
  const { LEFT_EYE, RIGHT_EYE } = require('./landmarks');
  const left = calcEAR(landmarks, LEFT_EYE);
  const right = calcEAR(landmarks, RIGHT_EYE);
  return (left + right) / 2;
}