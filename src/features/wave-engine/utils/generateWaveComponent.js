function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

export function generateWaveComponent(profile, mixValue, timeSeconds, renderState) {
  const stability = renderState?.stability ?? 0.6;
  const synchronization = renderState?.synchronization ?? 0.6;

  const frequencyBase = lerp(profile.minFreqHz, profile.maxFreqHz, 0.52);
  const frequencyWobble =
    Math.sin(timeSeconds * (0.22 + profile.wobble) + profile.phase) *
      frequencyBase *
      profile.wobble *
      0.18 +
    Math.cos(timeSeconds * 0.11 + profile.phase * 1.7) *
      frequencyBase *
      (1 - synchronization) *
      0.04;
  const frequency = Math.max(0.1, frequencyBase + frequencyWobble);

  const driftWave =
    0.82 +
    Math.sin(timeSeconds * (0.18 + profile.drift) + profile.phase * 0.8) * 0.12 +
    Math.cos(timeSeconds * 0.07 + profile.phase * 2.2) * 0.06;
  const amplitude =
    profile.baseAmplitude *
    mixValue *
    driftWave *
    (0.86 + stability * 0.2);
  const phaseDrift =
    profile.phase +
    Math.sin(timeSeconds * 0.09 + profile.phase) * 0.22 +
    Math.cos(timeSeconds * 0.05 + profile.phase * 1.3) * 0.1;

  const fundamental = Math.sin(timeSeconds * Math.PI * 2 * frequency + phaseDrift);
  const overtone = Math.sin(
    timeSeconds * Math.PI * 2 * frequency * 0.5 + phaseDrift * 1.8,
  );
  const shimmer = Math.cos(
    timeSeconds * Math.PI * 2 * frequency * 1.35 + phaseDrift * 0.7,
  );

  return amplitude * (fundamental * 0.78 + overtone * 0.16 + shimmer * 0.06);
}

