import { BASELINE_VALUES, INPUT_LIMITS } from "../constants/sleepStateConstants";

function clamp01(value) {
  return Math.max(0, Math.min(value, 1));
}

function readValue(answer, fallback) {
  if (!answer || answer.skipped) {
    return fallback;
  }

  return Number(answer.value ?? fallback);
}

export function normalizeInputs(answers) {
  const durationHours = readValue(answers.plannedSleepHours, BASELINE_VALUES.durationHours);
  const naturalDurationHours = readValue(
    answers.naturalSleepHours,
    BASELINE_VALUES.naturalDurationHours,
  );
  const stress = readValue(answers.stressLevel, BASELINE_VALUES.stress);
  const timesWokeUp = readValue(answers.roomWakeCount, BASELINE_VALUES.timesWokeUp);
  const consistency = readValue(answers.sleepConsistency, BASELINE_VALUES.consistency);
  const environment = readValue(answers.environmentLevel, BASELINE_VALUES.environment);
  const alcohol = readValue(answers.alcoholLevel, BASELINE_VALUES.alcohol);
  const caffeine = readValue(answers.caffeineLevel, BASELINE_VALUES.caffeine);
  const weed = readValue(answers.cannabisLevel, BASELINE_VALUES.weed);

  return {
    raw: {
      durationHours,
      naturalDurationHours,
      stress,
      timesWokeUp,
      consistency,
      environment,
      alcohol,
      caffeine,
      weed,
    },
    scaled: {
      duration: clamp01(durationHours / INPUT_LIMITS.durationHours),
      naturalDuration: clamp01(naturalDurationHours / INPUT_LIMITS.durationHours),
      stress: clamp01(stress / INPUT_LIMITS.tenPointScale),
      timesWokeUp: clamp01(timesWokeUp / INPUT_LIMITS.timesWokeUp),
      consistency: clamp01(consistency / INPUT_LIMITS.tenPointScale),
      environment: clamp01(environment / INPUT_LIMITS.tenPointScale),
      alcohol: clamp01(alcohol / INPUT_LIMITS.tenPointScale),
      caffeine: clamp01(caffeine / INPUT_LIMITS.tenPointScale),
      weed: clamp01(weed / INPUT_LIMITS.tenPointScale),
    },
  };
}
