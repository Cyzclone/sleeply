export const GLOBAL_PHYSIOLOGY_ENVELOPE = {
  firstCycleMinutes: { min: 70, max: 100 },
  genericCycleMinutes: { min: 80, max: 120 },
  laterCycleMinutes: { min: 90, max: 120 },
  totalDeepPercentOfSleep: { min: 0.1, max: 0.3 },
  totalRemPercentOfSleep: { min: 0.15, max: 0.3 },
};

export const GLOBAL_MODIFIER_CAPS = {
  cycleLengthDeltaCapDefault: 0.05,
  cycleLengthDeltaCapDeprivation: 0.1,
  syncDeltaCapAbsolute: 0.05,
  waveShiftCapDefault: 0.03,
  waveShiftCapDeprivation: 0.05,
};

export const CONDITION_CAPS = {
  alcohol: {
    awakeBoundaryMinutes: { min: 0, max: 3 },
    cycleLengthDelta: { min: -0.05, max: 0.05 },
    deepStageDurationDelta: { min: -0.05, max: 0.1 },
    earlyDeepBoostDelta: { min: 0, max: 0.15 },
    lateNightDisruptionDelta: { min: 0, max: 0.15 },
    lightStageDurationDelta: { min: 0, max: 0.1 },
    remStageDurationDelta: { min: -0.25, max: 0 },
    syncDelta: { min: -0.05, max: 0 },
    waveShiftCap: 0.03,
  },
  cannabis: {
    awakeBoundaryMinutes: { min: 0, max: 2 },
    cycleLengthDelta: { min: -0.05, max: 0.05 },
    deepStageDurationDelta: { min: 0, max: 0.1 },
    lightStageDurationDelta: { min: 0, max: 0.05 },
    remStageDurationDelta: { min: -0.1, max: 0 },
    syncDelta: { min: -0.03, max: 0.03 },
    waveShiftCap: 0.03,
  },
  caffeine: {
    awakeBoundaryMinutes: { min: 0, max: 3 },
    cycleLengthDelta: { min: -0.05, max: 0 },
    deepStageDurationDelta: { min: -0.1, max: 0 },
    lightStageDurationDelta: { min: 0, max: 0.1 },
    remStageDurationDelta: { min: -0.05, max: 0 },
    syncDelta: { min: -0.03, max: 0 },
    waveShiftCap: 0.02,
  },
  environment: {
    awakeBoundaryMinutes: { min: 0, max: 4 },
    cycleLengthDelta: { min: -0.05, max: 0.02 },
    deepStageDurationDelta: { min: -0.12, max: 0 },
    lightStageDurationDelta: { min: 0, max: 0.12 },
    remStageDurationDelta: { min: -0.08, max: 0 },
    syncDelta: { min: -0.04, max: 0 },
    waveShiftCap: 0.03,
  },
  deprivation: {
    awakeBoundaryMinutes: { min: 0, max: 2 },
    cycleLengthDelta: { min: -0.1, max: 0.05 },
    deepStageDurationDelta: { min: 0, max: 0.25 },
    lightStageDurationDelta: { min: -0.1, max: 0.1 },
    remStageDurationDelta: { min: -0.1, max: 0.1 },
    syncDelta: { min: 0, max: 0.05 },
    waveShiftCap: 0.05,
  },
  stress: {
    awakeBoundaryMinutes: { min: 0, max: 4 },
    cycleLengthDelta: { min: -0.05, max: 0.05 },
    deepStageDurationDelta: { min: -0.1, max: 0 },
    lightStageDurationDelta: { min: 0, max: 0.1 },
    remStageDurationDelta: { min: -0.1, max: 0.1 },
    syncDelta: { min: -0.04, max: 0 },
    waveShiftCap: 0.03,
  },
};

export const DIMINISHING_RETURN_FACTORS = [1, 0.66, 0.42, 0.28];

export const STAGE_DURATION_BOUNDS = {
  awake: { min: 6, max: 16 },
  deep: GLOBAL_PHYSIOLOGY_ENVELOPE.totalDeepPercentOfSleep,
  light: { min: 0.35, max: 0.62 },
  rem: GLOBAL_PHYSIOLOGY_ENVELOPE.totalRemPercentOfSleep,
};

export const BASE_STAGE_SYNC_BOUNDS = {
  awake: { max: 0.32, min: 0.16 },
  deep: { max: 0.92, min: 0.76 },
  light: { max: 0.58, min: 0.38 },
  rem: { max: 0.5, min: 0.3 },
};

export const BASE_STAGE_CLAMP_RANGES = {
  awake: {
    alpha: { min: 0.25, max: 0.46 },
    beta: { min: 0.42, max: 0.66 },
    delta: { min: 0.01, max: 0.07 },
    theta: { min: 0.05, max: 0.16 },
  },
  deep: {
    alpha: { min: 0.01, max: 0.06 },
    beta: { min: 0.01, max: 0.05 },
    delta: { min: 0.68, max: 0.88 },
    theta: { min: 0.08, max: 0.22 },
  },
  light: {
    alpha: { min: 0.12, max: 0.28 },
    beta: { min: 0.08, max: 0.2 },
    delta: { min: 0.06, max: 0.18 },
    theta: { min: 0.42, max: 0.64 },
  },
  rem: {
    alpha: { min: 0.08, max: 0.22 },
    beta: { min: 0.34, max: 0.56 },
    delta: { min: 0.01, max: 0.08 },
    theta: { min: 0.28, max: 0.46 },
  },
};

export const BASE_STAGE_DURATION_TARGETS = {
  awakeBoundaryMinutes: 10,
  deep: 0.24,
  light: 0.46,
  rem: 0.3,
};

export const STAGE_PANEL_LABELS = {
  awake: "Awake",
  deep: "Deep Sleep",
  light: "Light Sleep",
  rem: "REM Sleep",
};
