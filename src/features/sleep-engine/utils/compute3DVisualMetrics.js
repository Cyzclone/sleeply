function clamp01(value) {
  return Math.max(0, Math.min(value, 1));
}

export function compute3DVisualMetrics({ core, pulseStageProfiles, timeline, waves }) {
  const stageSyncAverage =
    ((pulseStageProfiles?.awake?.synchronization ?? 0.24) +
      (pulseStageProfiles?.light?.synchronization ?? 0.46) +
      (pulseStageProfiles?.deep?.synchronization ?? 0.84) +
      (pulseStageProfiles?.rem?.synchronization ?? 0.4)) /
    4;
  const pulseDensity = clamp01(0.34 + timeline.fragmentation * 0.18 + waves.noiseLevel * 0.12);
  const pulseCoherence = clamp01(0.68 + stageSyncAverage * 0.16 - core.disruption * 0.14 - waves.noiseLevel * 0.08);
  const regionalBalance = clamp01(core.stability * 0.58 + timeline.remBias * 0.14 + timeline.deepSleepBias * 0.18);
  const visualCalmness = clamp01(core.stability * 0.54 + pulseCoherence * 0.34 + stageSyncAverage * 0.12);
  const visualDisruption = clamp01(core.disruption * 0.38 + pulseDensity * 0.16 + (1 - pulseCoherence) * 0.2);

  return {
    pulseDensity,
    pulseCoherence,
    stageProfiles: pulseStageProfiles,
    regionalBalance,
    visualCalmness,
    visualDisruption,
  };
}
