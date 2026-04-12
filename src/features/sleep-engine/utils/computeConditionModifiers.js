import {
  CONDITION_CAPS,
  DIMINISHING_RETURN_FACTORS,
  GLOBAL_MODIFIER_CAPS,
} from "../constants/sleepModifierConstants";

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

function clamp01(value) {
  return clamp(value, 0, 1);
}

function pushClampHit(clampHits, label, raw, resolved) {
  if (Math.abs(raw - resolved) > 0.0001) {
    clampHits.push(`${label}: ${raw.toFixed(3)} -> ${resolved.toFixed(3)}`);
  }
}

function clampWithHit(label, raw, bounds, clampHits) {
  const resolved = clamp(raw, bounds.min, bounds.max);
  pushClampHit(clampHits, label, raw, resolved);
  return resolved;
}

function combineDampedContributions(entries, clampHits, label, bounds) {
  const sorted = [...entries]
    .map((value) => Number(value) || 0)
    .sort((left, right) => Math.abs(right) - Math.abs(left));
  const raw = sorted.reduce(
    (sum, value, index) => sum + value * (DIMINISHING_RETURN_FACTORS[index] ?? 0.18),
    0,
  );

  return clampWithHit(label, raw, bounds, clampHits);
}

function buildWaveOffsets({
  alcohol,
  caffeine,
  cannabis,
  clampHits,
  deprivation,
  environment,
  stress,
}) {
  const defaultCap = GLOBAL_MODIFIER_CAPS.waveShiftCapDefault;
  const deprivationCap = GLOBAL_MODIFIER_CAPS.waveShiftCapDeprivation;

  function clampWave(stageKey, waveKey, raw, primaryStrength = 0) {
    const dynamicCap = clamp(
      defaultCap + deprivation * (deprivationCap - defaultCap) + primaryStrength * 0.01,
      defaultCap,
      deprivationCap,
    );
    const resolved = clamp(raw, -dynamicCap, dynamicCap);
    pushClampHit(clampHits, `${stageKey}.${waveKey} wave shift`, raw, resolved);
    return resolved;
  }

  return {
    awake: {
      alpha: clampWave("awake", "alpha", alcohol * 0.012 + cannabis * 0.01 - stress * 0.014 - caffeine * 0.01 - environment * 0.008, alcohol),
      beta: clampWave("awake", "beta", stress * 0.018 + deprivation * 0.01 + caffeine * 0.016 - alcohol * 0.016 - cannabis * 0.012 + environment * 0.008, stress),
      delta: clampWave("awake", "delta", deprivation * 0.005 + alcohol * 0.002, deprivation),
      theta: clampWave("awake", "theta", deprivation * 0.01 + alcohol * 0.004 - cannabis * 0.002 - caffeine * 0.004 + environment * 0.004, deprivation),
    },
    deep: {
      alpha: clampWave("deep", "alpha", stress * 0.004 - deprivation * 0.003),
      beta: clampWave("deep", "beta", stress * 0.008 + caffeine * 0.01 - cannabis * 0.003 + environment * 0.01),
      delta: clampWave("deep", "delta", deprivation * 0.04 + cannabis * 0.014 + alcohol * 0.005 - stress * 0.02 - caffeine * 0.022 - environment * 0.024, deprivation),
      theta: clampWave("deep", "theta", stress * 0.016 + caffeine * 0.012 - deprivation * 0.02 - cannabis * 0.008 + environment * 0.014, deprivation),
    },
    light: {
      alpha: clampWave("light", "alpha", alcohol * 0.008 + cannabis * 0.005 - deprivation * 0.006 - caffeine * 0.004 - environment * 0.006),
      beta: clampWave("light", "beta", stress * 0.014 + caffeine * 0.012 - alcohol * 0.004 + environment * 0.01, stress),
      delta: clampWave("light", "delta", deprivation * 0.018 + alcohol * 0.007 - stress * 0.008 - caffeine * 0.01 - environment * 0.01, deprivation),
      theta: clampWave("light", "theta", deprivation * 0.012 + alcohol * 0.01 + cannabis * 0.004 - stress * 0.006 - caffeine * 0.004 + environment * 0.008, deprivation),
    },
    rem: {
      alpha: clampWave("rem", "alpha", alcohol * 0.006 + cannabis * 0.004 - stress * 0.004 - caffeine * 0.004 - environment * 0.006),
      beta: clampWave("rem", "beta", stress * 0.012 + alcohol * 0.01 + caffeine * 0.012 - deprivation * 0.006 + environment * 0.008, stress),
      delta: clampWave("rem", "delta", deprivation * 0.004 - alcohol * 0.002),
      theta: clampWave("rem", "theta", deprivation * 0.014 - stress * 0.006 - alcohol * 0.01 - cannabis * 0.006 - caffeine * 0.006 + environment * 0.01, deprivation),
    },
  };
}

export function computeConditionModifiers({ core, normalized }) {
  const clampHits = [];
  const deprivation = clamp01(
    (normalized.raw.naturalDurationHours - normalized.raw.durationHours) /
      Math.max(normalized.raw.naturalDurationHours, 4),
  );
  const alcohol = normalized.scaled.alcohol;
  const caffeine = normalized.scaled.caffeine;
  const cannabis = normalized.scaled.weed;
  const environment = normalized.scaled.environment;
  const stress = normalized.scaled.stress;

  const activeConditions = [
    { key: "deprivation", label: "Sleep Debt", strength: deprivation },
    { key: "environment", label: "Environment", strength: environment },
    { key: "stress", label: "Stress", strength: stress },
    { key: "alcohol", label: "Alcohol", strength: alcohol },
    { key: "caffeine", label: "Caffeine", strength: caffeine },
    { key: "cannabis", label: "Cannabis", strength: cannabis },
  ].filter((condition) => condition.strength > 0.04);

  const awakeBoundaryMinutesDelta = Math.round(
    combineDampedContributions(
      [
        clamp(stress * 3.4, CONDITION_CAPS.stress.awakeBoundaryMinutes.min, CONDITION_CAPS.stress.awakeBoundaryMinutes.max),
        clamp(environment * 3.2, CONDITION_CAPS.environment.awakeBoundaryMinutes.min, CONDITION_CAPS.environment.awakeBoundaryMinutes.max),
        clamp(alcohol * 1.9, CONDITION_CAPS.alcohol.awakeBoundaryMinutes.min, CONDITION_CAPS.alcohol.awakeBoundaryMinutes.max),
        clamp(caffeine * 2.3, CONDITION_CAPS.caffeine.awakeBoundaryMinutes.min, CONDITION_CAPS.caffeine.awakeBoundaryMinutes.max),
        clamp(cannabis * 1.1, CONDITION_CAPS.cannabis.awakeBoundaryMinutes.min, CONDITION_CAPS.cannabis.awakeBoundaryMinutes.max),
        clamp(deprivation * 0.8, CONDITION_CAPS.deprivation.awakeBoundaryMinutes.min, CONDITION_CAPS.deprivation.awakeBoundaryMinutes.max),
      ],
      clampHits,
      "Awake boundary minutes delta",
      { min: 0, max: 6 },
    ),
  );

  const cycleLengthDelta = combineDampedContributions(
    [
      clamp(-deprivation * 0.08, CONDITION_CAPS.deprivation.cycleLengthDelta.min, CONDITION_CAPS.deprivation.cycleLengthDelta.max),
      clamp(-environment * 0.03, CONDITION_CAPS.environment.cycleLengthDelta.min, CONDITION_CAPS.environment.cycleLengthDelta.max),
      clamp(alcohol * 0.018, CONDITION_CAPS.alcohol.cycleLengthDelta.min, CONDITION_CAPS.alcohol.cycleLengthDelta.max),
      clamp(-caffeine * 0.028, CONDITION_CAPS.caffeine.cycleLengthDelta.min, CONDITION_CAPS.caffeine.cycleLengthDelta.max),
      clamp(-stress * 0.026, CONDITION_CAPS.stress.cycleLengthDelta.min, CONDITION_CAPS.stress.cycleLengthDelta.max),
      clamp(cannabis * 0.01, CONDITION_CAPS.cannabis.cycleLengthDelta.min, CONDITION_CAPS.cannabis.cycleLengthDelta.max),
    ],
    clampHits,
    "Cycle length delta",
    {
      min: -GLOBAL_MODIFIER_CAPS.cycleLengthDeltaCapDeprivation,
      max: GLOBAL_MODIFIER_CAPS.cycleLengthDeltaCapDefault,
    },
  );

  const deepStageDurationDelta = combineDampedContributions(
    [
      clamp(deprivation * 0.18, CONDITION_CAPS.deprivation.deepStageDurationDelta.min, CONDITION_CAPS.deprivation.deepStageDurationDelta.max),
      clamp(-environment * 0.095, CONDITION_CAPS.environment.deepStageDurationDelta.min, CONDITION_CAPS.environment.deepStageDurationDelta.max),
      clamp(alcohol * 0.04, CONDITION_CAPS.alcohol.deepStageDurationDelta.min, CONDITION_CAPS.alcohol.deepStageDurationDelta.max),
      clamp(-caffeine * 0.085, CONDITION_CAPS.caffeine.deepStageDurationDelta.min, CONDITION_CAPS.caffeine.deepStageDurationDelta.max),
      clamp(-stress * 0.082, CONDITION_CAPS.stress.deepStageDurationDelta.min, CONDITION_CAPS.stress.deepStageDurationDelta.max),
      clamp(cannabis * 0.07, CONDITION_CAPS.cannabis.deepStageDurationDelta.min, CONDITION_CAPS.cannabis.deepStageDurationDelta.max),
    ],
    clampHits,
    "Deep duration delta",
    { min: -0.1, max: 0.25 },
  );

  const remStageDurationDelta = combineDampedContributions(
    [
      clamp(deprivation * 0.035, CONDITION_CAPS.deprivation.remStageDurationDelta.min, CONDITION_CAPS.deprivation.remStageDurationDelta.max),
      clamp(-environment * 0.055, CONDITION_CAPS.environment.remStageDurationDelta.min, CONDITION_CAPS.environment.remStageDurationDelta.max),
      clamp(-alcohol * 0.16, CONDITION_CAPS.alcohol.remStageDurationDelta.min, CONDITION_CAPS.alcohol.remStageDurationDelta.max),
      clamp(-caffeine * 0.035, CONDITION_CAPS.caffeine.remStageDurationDelta.min, CONDITION_CAPS.caffeine.remStageDurationDelta.max),
      clamp(-stress * 0.05, CONDITION_CAPS.stress.remStageDurationDelta.min, CONDITION_CAPS.stress.remStageDurationDelta.max),
      clamp(-cannabis * 0.065, CONDITION_CAPS.cannabis.remStageDurationDelta.min, CONDITION_CAPS.cannabis.remStageDurationDelta.max),
    ],
    clampHits,
    "REM duration delta",
    { min: -0.25, max: 0.12 },
  );

  const lightStageDurationDelta = combineDampedContributions(
    [
      clamp(-deprivation * 0.03, CONDITION_CAPS.deprivation.lightStageDurationDelta.min, CONDITION_CAPS.deprivation.lightStageDurationDelta.max),
      clamp(environment * 0.085, CONDITION_CAPS.environment.lightStageDurationDelta.min, CONDITION_CAPS.environment.lightStageDurationDelta.max),
      clamp(alcohol * 0.06, CONDITION_CAPS.alcohol.lightStageDurationDelta.min, CONDITION_CAPS.alcohol.lightStageDurationDelta.max),
      clamp(caffeine * 0.07, CONDITION_CAPS.caffeine.lightStageDurationDelta.min, CONDITION_CAPS.caffeine.lightStageDurationDelta.max),
      clamp(stress * 0.075, CONDITION_CAPS.stress.lightStageDurationDelta.min, CONDITION_CAPS.stress.lightStageDurationDelta.max),
      clamp(cannabis * 0.03, CONDITION_CAPS.cannabis.lightStageDurationDelta.min, CONDITION_CAPS.cannabis.lightStageDurationDelta.max),
    ],
    clampHits,
    "Light duration delta",
    { min: -0.1, max: 0.1 },
  );

  const earlyDeepBoostDelta = combineDampedContributions(
    [deprivation * 0.18, alcohol * 0.08, -caffeine * 0.08, -stress * 0.05, -environment * 0.08, cannabis * 0.05],
    clampHits,
    "Early deep boost delta",
    { min: -0.08, max: 0.2 },
  );

  const lateRemExpansionDelta = combineDampedContributions(
    [deprivation * 0.04, -alcohol * 0.12, -caffeine * 0.04, -stress * 0.05, -environment * 0.06, -cannabis * 0.05],
    clampHits,
    "Late REM expansion delta",
    { min: -0.15, max: 0.12 },
  );

  const stageSyncDelta = combineDampedContributions(
    [
      clamp(deprivation * 0.03, CONDITION_CAPS.deprivation.syncDelta.min, CONDITION_CAPS.deprivation.syncDelta.max),
      clamp(-environment * 0.028, CONDITION_CAPS.environment.syncDelta.min, CONDITION_CAPS.environment.syncDelta.max),
      clamp(-alcohol * 0.03, CONDITION_CAPS.alcohol.syncDelta.min, CONDITION_CAPS.alcohol.syncDelta.max),
      clamp(-caffeine * 0.018, CONDITION_CAPS.caffeine.syncDelta.min, CONDITION_CAPS.caffeine.syncDelta.max),
      clamp(-stress * 0.026, CONDITION_CAPS.stress.syncDelta.min, CONDITION_CAPS.stress.syncDelta.max),
      clamp(cannabis * 0.012, CONDITION_CAPS.cannabis.syncDelta.min, CONDITION_CAPS.cannabis.syncDelta.max),
    ],
    clampHits,
    "3D sync delta",
    {
      min: -GLOBAL_MODIFIER_CAPS.syncDeltaCapAbsolute,
      max: GLOBAL_MODIFIER_CAPS.syncDeltaCapAbsolute,
    },
  );

  return {
    activeConditions,
    clampHits,
    conditionStrengths: {
      alcohol,
      caffeine,
      cannabis,
      deprivation,
      stress,
    },
    architecture: {
      cycleLengthDelta,
      earlyDeepBoostDelta,
      lateRemExpansionDelta,
    },
    stageDurations: {
      awakeBoundaryMinutesDelta,
      deep: deepStageDurationDelta,
      light: lightStageDurationDelta,
      rem: remStageDurationDelta,
    },
    stageSyncDelta,
    waveOffsets: buildWaveOffsets({
      alcohol,
      caffeine,
      cannabis,
      clampHits,
      deprivation,
      environment,
      stress,
    }),
    wakeDriveNudge: clamp01(
      core.wakeDrive * 0.12 +
        stress * 0.08 +
        environment * 0.08 +
        alcohol * 0.04 +
        caffeine * 0.08,
    ),
  };
}
