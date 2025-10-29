// Utilities for magnitude-based styling
export const magnitudeToColor = (norm) => {
  const hue = 120 * (1 - norm);
  return `hsl(${hue}, 85%, 45%)`;
};

export const computeScales = (features) => {
  let maxLog = 0;
  for (const f of features) {
    const m = Math.max(0, Number(f.properties?.mag) || 0);
    const v = Math.log10(m + 1);
    if (v > maxLog) maxLog = v;
  }
  if (!isFinite(maxLog) || maxLog === 0) maxLog = 1;
  const minR = 3;
  const maxR = 22;
  return {
    toNorm: (mag) => Math.log10(Math.max(0, mag) + 1) / maxLog,
    toRadius: (mag) => {
      const norm = Math.log10(Math.max(0, mag) + 1) / maxLog;
      return minR + norm * (maxR - minR);
    },
  };
};



