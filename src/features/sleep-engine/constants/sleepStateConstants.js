export const INPUT_LIMITS = {
  durationHours: 12,
  timesWokeUp: 5,
  tenPointScale: 10,
};

export const BASELINE_VALUES = {
  durationHours: 8,
  naturalDurationHours: 8,
  stress: 3,
  timesWokeUp: 0,
  consistency: 6,
  environment: 2,
  alcohol: 0,
  caffeine: 0,
  weed: 0,
};

export const SLEEP_STATE_MODIFIERS = {
  continuity: {
    wakeups: 0.38,
    stress: 0.24,
    alcohol: 0.16,
    caffeine: 0.18,
    weed: 0.08,
    environment: 0.22,
    inconsistency: 0.14,
  },
  sleepPressure: {
    shortSleep: 0.62,
    inconsistency: 0.2,
    stress: 0.18,
    caffeine: 0.22,
    environment: 0.14,
  },
  pressures: {
    deepBase: 0.34,
    remBase: 0.26,
    deepShortSleep: 0.26,
    remDuration: 0.18,
    remConsistency: 0.12,
    alcoholPenalty: 0.18,
    caffeinePenalty: 0.16,
    environmentPenalty: 0.12,
    stressPenalty: 0.1,
  },
  visual: {
    densityBase: 0.36,
    coherenceBase: 0.72,
    disruptionBase: 0.2,
  },
};
