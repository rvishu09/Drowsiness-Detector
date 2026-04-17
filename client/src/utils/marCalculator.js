// MAR = Mouth Aspect Ratio
// Detects yawning when mouth opens wide

function dist(a, b) {
  return Math.sqrt(
    Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2)
  );
}

export function calcMAR(landmarks) {
  const { MOUTH } = require('./landmarks');
  const [p1, p2, p3, p4, p5, p6, p7, p8] =
    MOUTH.map(i => landmarks[i]);

  const vertical1 = dist(p3, p7);
  const vertical2 = dist(p4, p8);
  const horizontal = dist(p1, p2);

  return (vertical1 + vertical2) / (2.0 * horizontal);
}