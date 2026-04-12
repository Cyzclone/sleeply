import { STAGE_PULSE_PROFILES } from "../../pulse-engine/constants/stagePulseProfiles";
import { BASE_STAGE_WAVE_PROFILES } from "../../wave-engine/constants/stageWaveProfiles";
import {
  BASE_STAGE_CLAMP_RANGES,
  BASE_STAGE_DURATION_TARGETS,
  BASE_STAGE_SYNC_BOUNDS,
  GLOBAL_PHYSIOLOGY_ENVELOPE,
  STAGE_DURATION_BOUNDS,
  STAGE_PANEL_LABELS,
} from "../constants/sleepModifierConstants";

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

function clamp01(value) {
  return clamp(value, 0, 1);
}

function roundTo(value, digits = 3) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function pushClampHit(clampHits, label, raw, resolved) {
  if (Math.abs(raw - resolved) > 0.0001) {
    clampHits.push(`${label}: ${raw.toFixed(3)} -> ${resolved.toFixed(3)}`);
  }
}

function applyStageWaveVariance(stageKey, values) {
  return Object.fromEntries(
    Object.entries(values).map(([waveKey, value]) => {
      if (value <= 0.01) {
        return [waveKey, value];
      }

      const varianceScale = 1 + (Math.random() * 0.3 - 0.15);
      return [waveKey, value * varianceScale];
    }),
  );
}

function boundedNormalize(rawShares, bounds, clampHits, labelPrefix) {
  const shares = Object.fromEntries(
    Object.entries(rawShares).map(([key, value]) => {
      const bounded = clamp(value, bounds[key].min, bounds[key].max);
      pushClampHit(clampHits, `${labelPrefix} ${key}`, value, bounded);
      return [key, bounded];
    }),
  );

  let total = Object.values(shares).reduce((sum, value) => sum + value, 0);
  let diff = 1 - total;
  let guard = 0;

  while (Math.abs(diff) > 0.0001 && guard < 12) {
    const adjustableKeys = Object.keys(shares).filter((key) =>
      diff > 0
        ? shares[key] < bounds[key].max - 0.0001
        : shares[key] > bounds[key].min + 0.0001,
    );

    if (!adjustableKeys.length) {
      break;
    }

    const availableTotal = adjustableKeys.reduce((sum, key) => {
      const available =
        diff > 0 ? bounds[key].max - shares[key] : shares[key] - bounds[key].min;
      return sum + Math.max(available, 0);
    }, 0);

    if (availableTotal <= 0.0001) {
      break;
    }

    adjustableKeys.forEach((key) => {
      const available =
        diff > 0 ? bounds[key].max - shares[key] : shares[key] - bounds[key].min;
      const portion = available / availableTotal;
      shares[key] += diff * portion;
      shares[key] = clamp(shares[key], bounds[key].min, bounds[key].max);
    });

    total = Object.values(shares).reduce((sum, value) => sum + value, 0);
    diff = 1 - total;
    guard += 1;
  }

  if (Math.abs(diff) > 0.0005) {
    clampHits.push(`${labelPrefix} normalization saturated at ${diff.toFixed(3)}`);
  }

  return Object.fromEntries(
    Object.entries(shares).map(([key, value]) => [key, roundTo(value)]),
  );
}

function buildResolvedStageProfiles(modifiers, clampHits) {
  return Object.fromEntries(
    Object.entries(BASE_STAGE_WAVE_PROFILES).map(([stageKey, profile]) => {
      const baseValues = profile.values;
      const offsets = modifiers.waveOffsets[stageKey];
      const rawValues = Object.fromEntries(
        Object.entries(baseValues).map(([waveKey, value]) => [
          waveKey,
          value + (offsets?.[waveKey] ?? 0),
        ]),
      );
      const variedValues = applyStageWaveVariance(stageKey, rawValues);
      const resolvedValues = boundedNormalize(
        variedValues,
        BASE_STAGE_CLAMP_RANGES[stageKey],
        clampHits,
        `${stageKey} wave mix`,
      );

      return [
        stageKey,
        {
          panelLabel: STAGE_PANEL_LABELS[stageKey] ?? profile.panelLabel,
          title: STAGE_PANEL_LABELS[stageKey] ?? profile.panelLabel,
          values: resolvedValues,
        },
      ];
    }),
  );
}

function buildResolvedPulseProfiles(stageProfiles, modifiers, clampHits) {
  const syncFactorByStage = {
    awake: 0.28,
    deep: 1,
    light: 0.62,
    rem: 0.52,
  };

  return Object.fromEntries(
    Object.entries(STAGE_PULSE_PROFILES).map(([stageKey, profile]) => {
      const syncFactor = syncFactorByStage[stageKey] ?? 0.5;
      const rawSync = profile.synchronization + modifiers.stageSyncDelta * syncFactor;
      const synchronization = clamp(
        rawSync,
        BASE_STAGE_SYNC_BOUNDS[stageKey].min,
        BASE_STAGE_SYNC_BOUNDS[stageKey].max,
      );
      pushClampHit(clampHits, `${stageKey} 3D sync`, rawSync, synchronization);

      const clustering = clamp(profile.clustering + modifiers.stageSyncDelta * syncFactor * 0.7, 0.08, 0.9);
      const randomness = clamp(profile.randomness - modifiers.stageSyncDelta * syncFactor * 0.55, 0.08, 0.88);
      const intentionality = clamp(profile.intentionality + modifiers.stageSyncDelta * syncFactor * 0.28, 0.18, 0.96);

      return [
        stageKey,
        {
          ...profile,
          clustering: roundTo(clustering),
          intentionality: roundTo(intentionality),
          pulseTypeWeights: stageProfiles[stageKey].values,
          randomness: roundTo(randomness),
          synchronization: roundTo(synchronization),
        },
      ];
    }),
  );
}

export function resolveConditionedSleepState({ modifiers, timeline }) {
  const clampHits = [...modifiers.clampHits];
  const baseCycleTargets = timeline.cycleTargets ?? {
    firstCycleMinutes: 84,
    genericCycleMinutes: timeline.averageCycleLength ?? 92,
    laterCycleMinutes: 98,
  };
  const cycleTargets = {
    firstCycleMinutes: Math.round(
      clamp(
        baseCycleTargets.firstCycleMinutes * (1 + modifiers.architecture.cycleLengthDelta * 0.75) +
          modifiers.architecture.earlyDeepBoostDelta * 10,
        GLOBAL_PHYSIOLOGY_ENVELOPE.firstCycleMinutes.min,
        GLOBAL_PHYSIOLOGY_ENVELOPE.firstCycleMinutes.max,
      ),
    ),
    laterCycleMinutes: Math.round(
      clamp(
        baseCycleTargets.laterCycleMinutes * (1 + modifiers.architecture.cycleLengthDelta) +
          modifiers.architecture.lateRemExpansionDelta * 12,
        GLOBAL_PHYSIOLOGY_ENVELOPE.laterCycleMinutes.min,
        GLOBAL_PHYSIOLOGY_ENVELOPE.laterCycleMinutes.max,
      ),
    ),
    genericCycleMinutes: Math.round(
      clamp(
        baseCycleTargets.genericCycleMinutes * (1 + modifiers.architecture.cycleLengthDelta * 0.92) +
          modifiers.architecture.lateRemExpansionDelta * 6,
        GLOBAL_PHYSIOLOGY_ENVELOPE.genericCycleMinutes.min,
        GLOBAL_PHYSIOLOGY_ENVELOPE.genericCycleMinutes.max,
      ),
    ),
  };

  const baseStageTargets = {
    ...BASE_STAGE_DURATION_TARGETS,
    ...timeline.stageDurationTargets,
  };
  const resolvedStageDurationTargets = boundedNormalize(
    {
      deep: baseStageTargets.deep + modifiers.stageDurations.deep,
      light: baseStageTargets.light + modifiers.stageDurations.light,
      rem: baseStageTargets.rem + modifiers.stageDurations.rem,
    },
    {
      deep: STAGE_DURATION_BOUNDS.deep,
      light: STAGE_DURATION_BOUNDS.light,
      rem: STAGE_DURATION_BOUNDS.rem,
    },
    clampHits,
    "Stage duration",
  );

  const boundaryAwakeMinutes = Math.round(
    clamp(
      baseStageTargets.awakeBoundaryMinutes + modifiers.stageDurations.awakeBoundaryMinutesDelta,
      STAGE_DURATION_BOUNDS.awake.min,
      STAGE_DURATION_BOUNDS.awake.max,
    ),
  );

  const stageProfiles = buildResolvedStageProfiles(modifiers, clampHits);
  const pulseStageProfiles = buildResolvedPulseProfiles(stageProfiles, modifiers, clampHits);

  const resolvedTimeline = {
    ...timeline,
    averageCycleLength: cycleTargets.genericCycleMinutes,
    boundaryAwakeMinutes,
    cycleCount: Math.max(1, Math.round(timeline.totalSleepMinutes / Math.max(cycleTargets.genericCycleMinutes, 1))),
    cycleTargets,
    deepSleepBias: clamp01(resolvedStageDurationTargets.deep * 2.2 + (timeline.earlyDeepBoost + modifiers.architecture.earlyDeepBoostDelta) * 0.22),
    earlyDeepBoost: clamp01(timeline.earlyDeepBoost + modifiers.architecture.earlyDeepBoostDelta),
    lateRemExpansion: clamp01(timeline.lateRemExpansion + modifiers.architecture.lateRemExpansionDelta),
    lightSleepBias: clamp01(resolvedStageDurationTargets.light * 1.45),
    remBias: clamp01(resolvedStageDurationTargets.rem * 1.9 + (timeline.lateRemExpansion + modifiers.architecture.lateRemExpansionDelta) * 0.12),
    stageDurationTargets: {
      awakeBoundaryMinutes: boundaryAwakeMinutes,
      ...resolvedStageDurationTargets,
    },
    wakeLikelihood: clamp01(timeline.wakeLikelihood + modifiers.wakeDriveNudge),
  };

  return {
    debug: {
      activeConditions: modifiers.activeConditions,
      clampHits,
      conditions: modifiers.conditionStrengths,
      cycleTargets: {
        after: cycleTargets,
        before: baseCycleTargets,
      },
      stageDurations: {
        after: resolvedTimeline.stageDurationTargets,
        before: baseStageTargets,
      },
      stageSync: Object.fromEntries(
        Object.keys(pulseStageProfiles).map((stageKey) => [
          stageKey,
          {
            after: pulseStageProfiles[stageKey].synchronization,
            before: STAGE_PULSE_PROFILES[stageKey].synchronization,
          },
        ]),
      ),
      waveProfiles: Object.fromEntries(
        Object.keys(stageProfiles).map((stageKey) => [
          stageKey,
          {
            after: stageProfiles[stageKey].values,
            before: BASE_STAGE_WAVE_PROFILES[stageKey].values,
          },
        ]),
      ),
    },
    pulseStageProfiles,
    stageProfiles,
    timeline: resolvedTimeline,
  };
}
