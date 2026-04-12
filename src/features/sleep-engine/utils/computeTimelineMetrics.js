function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

function clamp01(value) {
  return clamp(value, 0, 1);
}

export function computeTimelineMetrics({ core, normalized }) {
  const totalSleepMinutes = Math.max(5, Math.round(normalized.raw.durationHours * 60));
  const durationAdequacy = core.durationAdequacy ?? normalized.scaled.duration;
  const cycleCount = Math.max(1, Math.round(totalSleepMinutes / 92));
  const averageCycleLength = totalSleepMinutes / cycleCount;
  const cycleLengthVariance = clamp01(core.disruption * 0.5 + (1 - core.stability) * 0.3);
  const wakeLikelihood = clamp01(core.wakeDrive * 0.9);
  const earlyNightSedation = clamp01(core.sedation * 0.9);
  const lateNightDisruption = clamp01(core.disruption * 0.78 + core.wakeDrive * 0.22);
  const deepSleepBias = clamp01(0.28 + core.deepPressure * 0.44 + (1 - durationAdequacy) * 0.12 - core.disruption * 0.04);
  const remBias = clamp01(0.18 + core.remPressure * 0.54 + durationAdequacy * 0.08 - core.fragmentation * 0.04);
  const lightSleepBias = clamp01(0.38 + core.fragmentation * 0.26 + (1 - durationAdequacy) * 0.12 - core.deepPressure * 0.1);
  const stageTransitionSmoothness = clamp01(core.stability * 0.7 + (1 - core.fragmentation) * 0.3);
  const lateRemExpansion = clamp01(core.remPressure * 0.76 + durationAdequacy * 0.24);
  const earlyDeepBoost = clamp01(core.deepPressure * 0.76 + core.sleepPressure * 0.24 + (1 - durationAdequacy) * 0.12);
  const firstCycleMinutes = clamp(
    Math.round(82 + earlyDeepBoost * 10 - cycleLengthVariance * 4),
    70,
    100,
  );
  const laterCycleMinutes = clamp(
    Math.round(95 + lateRemExpansion * 13 + cycleLengthVariance * 4),
    90,
    120,
  );
  const genericCycleMinutes = clamp(
    Math.round(firstCycleMinutes * 0.38 + laterCycleMinutes * 0.62),
    80,
    120,
  );

  const baseLightShare = clamp(
    0.42 + lightSleepBias * 0.12 + (1 - durationAdequacy) * 0.04 - deepSleepBias * 0.06,
    0.35,
    0.58,
  );
  const baseDeepShare = clamp(
    0.16 + deepSleepBias * 0.18 + earlyDeepBoost * 0.08,
    0.1,
    0.3,
  );
  const baseRemShare = clamp(
    0.16 + remBias * 0.14 + lateRemExpansion * 0.06,
    0.15,
    0.3,
  );
  const totalStageShare = baseLightShare + baseDeepShare + baseRemShare;
  const stageDurationTargets = {
    awakeBoundaryMinutes: 10,
    deep: baseDeepShare / totalStageShare,
    light: baseLightShare / totalStageShare,
    rem: baseRemShare / totalStageShare,
  };

  return {
    totalSleepMinutes,
    cycleCount,
    averageCycleLength,
    cycleTargets: {
      firstCycleMinutes,
      genericCycleMinutes,
      laterCycleMinutes,
    },
    cycleLengthVariance,
    wakeLikelihood,
    earlyNightSedation,
    lateNightDisruption,
    deepSleepBias,
    remBias,
    lightSleepBias,
    stageTransitionSmoothness,
    lateRemExpansion,
    earlyDeepBoost,
    stageDurationTargets,
    fragmentation: core.fragmentation,
    sleepContinuity: 1 - core.fragmentation,
    architectureStability: core.stability,
  };
}
