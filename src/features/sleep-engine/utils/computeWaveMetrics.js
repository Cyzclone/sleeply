function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

function clamp01(value) {
  return clamp(value, 0, 1);
}

export function computeWaveMetrics({ core, timeline, stageProfiles }) {
  const signalStability = clamp01(core.stability * 0.7 + (1 - core.fragmentation) * 0.3);
  const waveSynchronization = clamp01(signalStability * 0.72 + timeline.stageTransitionSmoothness * 0.28);
  const amplitudeStability = clamp01(timeline.deepSleepBias * 0.44 + signalStability * 0.4);
  const frequencyStability = clamp01(timeline.remBias * 0.34 + signalStability * 0.46);
  const noiseLevel = clamp01(core.disruption * 0.62 + (1 - signalStability) * 0.18 + core.fragmentation * 0.1);
  const resolvedStageProfiles = stageProfiles ?? {};
  const stageWeights = timeline.stageDurationTargets ?? { deep: 0.24, light: 0.46, rem: 0.3 };
  const weightedWaveSummary = ["delta", "theta", "alpha", "beta"].reduce((summary, waveKey) => {
    const weightedValue =
      (resolvedStageProfiles.awake?.values?.[waveKey] ?? 0) * 0.02 +
      (resolvedStageProfiles.light?.values?.[waveKey] ?? 0) * (stageWeights.light ?? 0) +
      (resolvedStageProfiles.deep?.values?.[waveKey] ?? 0) * (stageWeights.deep ?? 0) +
      (resolvedStageProfiles.rem?.values?.[waveKey] ?? 0) * (stageWeights.rem ?? 0);

    summary[waveKey] = clamp(Math.round(weightedValue * 100), 1, 96);
    return summary;
  }, {});

  return {
    signalStability,
    waveSynchronization,
    amplitudeStability,
    frequencyStability,
    noiseLevel,
    waveSummary: weightedWaveSummary,
  };
}
