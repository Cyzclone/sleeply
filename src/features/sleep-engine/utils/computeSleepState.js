import { STAGE_PULSE_PROFILES } from "../../pulse-engine/constants/stagePulseProfiles";
import { BASE_STAGE_WAVE_PROFILES } from "../../wave-engine/constants/stageWaveProfiles";
import { computeConditionModifiers } from "./computeConditionModifiers";
import { compute3DVisualMetrics } from "./compute3DVisualMetrics";
import { computeCoreSleepMetrics } from "./computeCoreSleepMetrics";
import { computeScoreMetrics } from "./computeScoreMetrics";
import { computeTimelineMetrics } from "./computeTimelineMetrics";
import { computeWaveMetrics } from "./computeWaveMetrics";
import { normalizeInputs } from "./normalizeInputs";
import { resolveConditionedSleepState } from "./resolveConditionedSleepState";

function createBaseStageProfiles() {
  return Object.fromEntries(
    Object.entries(BASE_STAGE_WAVE_PROFILES).map(([stageKey, profile]) => [
      stageKey,
      {
        panelLabel: profile.panelLabel,
        title: profile.panelLabel,
        values: profile.values,
      },
    ]),
  );
}

function createNoSleepState(normalized, awakeOnlyMinutes = 60) {
  const resolvedAwakeMinutes = Math.max(1, Math.round(awakeOnlyMinutes));
  const stageProfiles = createBaseStageProfiles();
  const pulseStageProfiles = Object.fromEntries(
    Object.entries(STAGE_PULSE_PROFILES).map(([stageKey, profile]) => [
      stageKey,
      {
        ...profile,
        pulseTypeWeights: stageProfiles[stageKey].values,
      },
    ]),
  );

  return {
    normalized,
    core: {
      deepPressure: 0,
      disruption: 1,
      durationAdequacy: 0,
      fragmentation: 1,
      remPressure: 0,
      sedation: 0,
      sleepPressure: 1,
      stability: 0,
      stimulation: 0,
      wakeDrive: 1,
    },
    modifiers: {
      activeConditions: [],
      clampHits: [],
      conditionStrengths: {},
    },
    timeline: {
      architectureStability: 0,
      averageCycleLength: 0,
      boundaryAwakeMinutes: resolvedAwakeMinutes,
      cycleCount: 0,
      cycleLengthVariance: 0,
      cycleTargets: {
        firstCycleMinutes: 0,
        genericCycleMinutes: 0,
        laterCycleMinutes: 0,
      },
      deepSleepBias: 0,
      earlyDeepBoost: 0,
      earlyNightSedation: 0,
      fragmentation: 1,
      lateNightDisruption: 0,
      lateRemExpansion: 0,
      lightSleepBias: 0,
      noSleepMode: true,
      remBias: 0,
      sleepContinuity: 0,
      stageDurationTargets: {
        awakeBoundaryMinutes: resolvedAwakeMinutes,
        deep: 0,
        light: 0,
        rem: 0,
      },
      stageTransitionSmoothness: 0,
      totalSleepMinutes: 0,
      wakeLikelihood: 1,
    },
    stageProfiles,
    waves: {
      amplitudeStability: 0.18,
      frequencyStability: 0.22,
      noiseLevel: 0.3,
      signalStability: 0.16,
      waveSummary: {
        alpha: 35,
        beta: 55,
        delta: 2,
        theta: 8,
      },
      waveSynchronization: 0.2,
    },
    visual3d: {
      pulseCoherence: 0.3,
      pulseDensity: 0.42,
      regionalBalance: 0.44,
      stageProfiles: pulseStageProfiles,
      visualCalmness: 0.18,
      visualDisruption: 0.82,
    },
    score: computeScoreMetrics({ normalized }),
    debug: {
      activeConditions: [],
      clampHits: [],
    },
  };
}

export function computeSleepState(answers, options = {}) {
  const normalized = normalizeInputs(answers);

  if (normalized.raw.durationHours <= 0) {
    return createNoSleepState(normalized, options.awakeOnlyMinutes);
  }

  const core = computeCoreSleepMetrics(normalized);
  const baseTimeline = computeTimelineMetrics({ core, normalized });
  const modifiers = computeConditionModifiers({ core, normalized, timeline: baseTimeline });
  const resolvedState = resolveConditionedSleepState({
    core,
    modifiers,
    timeline: baseTimeline,
  });
  const timeline = resolvedState.timeline;
  const stageProfiles = resolvedState.stageProfiles;
  const score = computeScoreMetrics({ core, normalized, timeline });
  const waves = computeWaveMetrics({ core, normalized, stageProfiles, timeline });
  const visual3d = compute3DVisualMetrics({
    core,
    pulseStageProfiles: resolvedState.pulseStageProfiles,
    timeline,
    waves,
  });

  return {
    normalized,
    core,
    modifiers,
    timeline,
    stageProfiles,
    score,
    waves,
    visual3d,
    debug: resolvedState.debug,
  };
}
