function clamp01(value) {
  return Math.max(0, Math.min(value, 1));
}

export function normalizeStageWaveMix(mix) {
  const safeMix = {
    delta: Math.max(0, mix?.delta ?? 0),
    theta: Math.max(0, mix?.theta ?? 0),
    alpha: Math.max(0, mix?.alpha ?? 0),
    beta: Math.max(0, mix?.beta ?? 0),
  };
  const total =
    safeMix.delta + safeMix.theta + safeMix.alpha + safeMix.beta || 1;

  return {
    delta: safeMix.delta / total,
    theta: safeMix.theta / total,
    alpha: safeMix.alpha / total,
    beta: safeMix.beta / total,
  };
}

export function interpolateStageWaveMix(currentMix, targetMix, amount) {
  const nextAmount = clamp01(amount);

  return {
    delta: currentMix.delta + (targetMix.delta - currentMix.delta) * nextAmount,
    theta: currentMix.theta + (targetMix.theta - currentMix.theta) * nextAmount,
    alpha: currentMix.alpha + (targetMix.alpha - currentMix.alpha) * nextAmount,
    beta: currentMix.beta + (targetMix.beta - currentMix.beta) * nextAmount,
  };
}

