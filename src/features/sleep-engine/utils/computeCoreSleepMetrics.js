import { SLEEP_STATE_MODIFIERS } from "../constants/sleepStateConstants";

function clamp01(value) {
  return Math.max(0, Math.min(value, 1));
}

export function computeCoreSleepMetrics({ raw, scaled }) {
  const durationAdequacy = clamp01(raw.durationHours / Math.max(raw.naturalDurationHours, 0.5));
  const inconsistency = 1 - scaled.consistency;
  const durationShortfall = 1 - durationAdequacy;
  const fragmentation = clamp01(
    scaled.timesWokeUp * SLEEP_STATE_MODIFIERS.continuity.wakeups +
      durationShortfall * 0.18 +
      scaled.stress * SLEEP_STATE_MODIFIERS.continuity.stress +
      scaled.alcohol * SLEEP_STATE_MODIFIERS.continuity.alcohol +
      scaled.caffeine * SLEEP_STATE_MODIFIERS.continuity.caffeine +
      scaled.weed * SLEEP_STATE_MODIFIERS.continuity.weed +
      scaled.environment * SLEEP_STATE_MODIFIERS.continuity.environment +
      inconsistency * SLEEP_STATE_MODIFIERS.continuity.inconsistency,
  );
  const sleepContinuity = clamp01(1 - fragmentation);
  const architectureStability = clamp01(
    sleepContinuity * 0.4 +
      scaled.consistency * 0.18 +
      durationAdequacy * 0.34 +
      (1 - scaled.environment) * 0.08,
  );
  const sedation = clamp01(scaled.alcohol * 0.58 + scaled.weed * 0.42);
  const stimulation = clamp01(scaled.caffeine * 0.72 + scaled.stress * 0.28);
  const disruption = clamp01(
    fragmentation * 0.5 +
      scaled.stress * 0.13 +
      sedation * 0.14 +
      stimulation * 0.12 +
      scaled.environment * 0.11,
  );
  const sleepPressure = clamp01(
    durationShortfall * (SLEEP_STATE_MODIFIERS.sleepPressure.shortSleep + 0.16) +
      inconsistency * SLEEP_STATE_MODIFIERS.sleepPressure.inconsistency +
      scaled.stress * SLEEP_STATE_MODIFIERS.sleepPressure.stress +
      scaled.caffeine * SLEEP_STATE_MODIFIERS.sleepPressure.caffeine +
      scaled.environment * SLEEP_STATE_MODIFIERS.sleepPressure.environment,
  );
  const deepPressure = clamp01(
    SLEEP_STATE_MODIFIERS.pressures.deepBase +
      sleepPressure * (SLEEP_STATE_MODIFIERS.pressures.deepShortSleep + 0.1) -
      scaled.alcohol * 0.14 -
      scaled.caffeine * 0.18 -
      scaled.environment * 0.12 -
      scaled.weed * 0.06,
  );
  const remPressure = clamp01(
    SLEEP_STATE_MODIFIERS.pressures.remBase +
      durationAdequacy * (SLEEP_STATE_MODIFIERS.pressures.remDuration + 0.14) +
      scaled.consistency * SLEEP_STATE_MODIFIERS.pressures.remConsistency -
      scaled.alcohol * SLEEP_STATE_MODIFIERS.pressures.alcoholPenalty -
      scaled.caffeine * SLEEP_STATE_MODIFIERS.pressures.caffeinePenalty -
      scaled.environment * SLEEP_STATE_MODIFIERS.pressures.environmentPenalty -
      scaled.stress * SLEEP_STATE_MODIFIERS.pressures.stressPenalty,
  );
  const wakeDrive = clamp01(
    scaled.timesWokeUp * 0.38 +
      scaled.stress * 0.18 +
      scaled.caffeine * 0.14 +
      scaled.environment * 0.14 +
      disruption * 0.24,
  );

  return {
    durationAdequacy,
    fragmentation,
    stability: architectureStability,
    sedation,
    stimulation,
    disruption,
    deepPressure,
    remPressure,
    sleepPressure,
    wakeDrive,
  };
}
