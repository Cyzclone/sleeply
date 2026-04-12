function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

function roundWhole(value) {
  return Math.round(Number.isFinite(value) ? value : 0);
}

function getSleepAdjustment(sleepHours) {
  if (sleepHours <= 0) return 0;
  if (sleepHours < 3) return -45;
  if (sleepHours < 4) return -36;
  if (sleepHours < 5) return -26;
  if (sleepHours < 6) return -17;
  if (sleepHours < 7) return -9;
  if (sleepHours < 8) return -3;
  if (sleepHours <= 10) return 6;
  if (sleepHours <= 11) return 4;
  if (sleepHours <= 12) return 1;
  return -2;
}

function getNaturalMatchAdjustment(sleepHours, naturalHours) {
  const difference = sleepHours - naturalHours;
  const absDiff = Math.abs(difference);

  if (absDiff < 0.001) return 10;
  if (absDiff <= 0.5) return 8;
  if (absDiff <= 1.0) return 5;
  if (absDiff <= 1.5) return 2;

  if (difference < 0 && absDiff <= 2.0) return -5;
  if (difference < 0 && absDiff <= 3.0) return -10;
  if (difference < 0 && absDiff > 3.0) return -15;

  if (difference >= 0 && difference < 2.0) return 0;
  if (difference < 3.0) return -1;
  return -2;
}

function getStressAdjustment(stress) {
  if (stress <= 0) return 2;
  if (stress === 1) return 2;
  if (stress === 2) return 1;
  if (stress === 3) return 1;
  if (stress === 4) return 0;
  if (stress === 5) return 0;
  if (stress === 6) return -1;
  if (stress === 7) return -2;
  if (stress === 8) return -3;
  return -4;
}

function getWakeupAdjustment(wakeups) {
  if (wakeups <= 0) return 5;
  if (wakeups === 1) return 2;
  if (wakeups === 2) return -2;
  if (wakeups === 3) return -6;
  if (wakeups === 4) return -10;
  if (wakeups === 5) return -15;
  return -20;
}

function getPositiveTenScaleAdjustment(value) {
  if (value <= 0) return -10;
  if (value === 1) return -8;
  if (value === 2) return -6;
  if (value === 3) return -4;
  if (value === 4) return -2;
  if (value === 5) return 0;
  if (value === 6) return 1;
  if (value === 7) return 3;
  if (value === 8) return 5;
  if (value === 9) return 7;
  return 9;
}

function getRoutineAdjustment(routine) {
  return getPositiveTenScaleAdjustment(routine);
}

function getEnvironmentAdjustment(environment) {
  const environmentQuality = clamp(10 - environment, 0, 10);

  return getPositiveTenScaleAdjustment(environmentQuality);
}

function getAlcoholAdjustment(alcohol) {
  if (alcohol <= 0) return 0;
  if (alcohol === 1) return -1;
  if (alcohol === 2) return -3;
  if (alcohol === 3) return -5;
  if (alcohol === 4) return -8;
  if (alcohol === 5) return -12;
  if (alcohol === 6) return -16;
  if (alcohol === 7) return -21;
  if (alcohol === 8) return -27;
  if (alcohol === 9) return -34;
  return -42;
}

function getCaffeineAdjustment(caffeine) {
  if (caffeine <= 0) return 0;
  if (caffeine === 1) return -1;
  if (caffeine === 2) return -2;
  if (caffeine === 3) return -4;
  if (caffeine === 4) return -6;
  if (caffeine === 5) return -9;
  if (caffeine === 6) return -13;
  if (caffeine === 7) return -18;
  if (caffeine === 8) return -24;
  if (caffeine === 9) return -31;
  return -38;
}

function getCannabisAdjustment(cannabis) {
  if (cannabis <= 0) return 0;
  if (cannabis === 1) return -1;
  if (cannabis === 2) return -2;
  if (cannabis === 3) return -4;
  if (cannabis === 4) return -6;
  if (cannabis === 5) return -9;
  if (cannabis === 6) return -13;
  if (cannabis === 7) return -17;
  if (cannabis === 8) return -22;
  if (cannabis === 9) return -28;
  return -34;
}

function getCrossingPenalty(
  alcoholAdjustment,
  caffeineAdjustment,
  cannabisAdjustment,
  alcohol,
  caffeine,
  cannabis,
) {
  const overThreeCount =
    (alcohol > 3 ? 1 : 0) +
    (caffeine > 3 ? 1 : 0) +
    (cannabis > 3 ? 1 : 0);

  if (overThreeCount < 2) {
    return 0;
  }

  const combinedDrugNegative =
    Math.abs(alcoholAdjustment) +
    Math.abs(caffeineAdjustment) +
    Math.abs(cannabisAdjustment);

  if (overThreeCount === 2) {
    return -Math.round(0.25 * combinedDrugNegative);
  }

  return -Math.round(0.4 * combinedDrugNegative);
}

function buildNoSleepScoreState() {
  const scoreFactors = [
    { id: "sleepHours", label: "Sleep hours", value: -75 },
    { id: "naturalSleepNeed", label: "Natural sleep need", value: 0 },
    { id: "stress", label: "Stress", value: 0 },
    { id: "wakeups", label: "Wake-ups", value: 0 },
    { id: "routine", label: "Routine", value: 0 },
    { id: "environment", label: "Environment", value: 0 },
    { id: "alcohol", label: "Alcohol", value: 0 },
    { id: "caffeine", label: "Caffeine", value: 0 },
    { id: "cannabis", label: "Cannabis", value: 0 },
  ];

  return {
    breakdown: {
      alcoholAdjustment: 0,
      base: 75,
      caffeineAdjustment: 0,
      cannabisAdjustment: 0,
      crossingPenalty: 0,
      environmentAdjustment: 0,
      naturalMatchAdjustment: 0,
      routineAdjustment: 0,
      sleepAdjustment: 0,
      stressAdjustment: 0,
      wakeupAdjustment: 0,
    },
    componentScores: {
      architecture: 0,
      duration: 0,
      efficiency: 0,
      modifiers: 0,
      rawComposite: 0,
    },
    efficiency: 0,
    overallSleepScore: 0,
    rawEffects: scoreFactors,
    reason: "No sleep entered",
    remRestoration: 0,
    repairQuality: 0,
    restfulness: 0,
    scoreFactors,
    sleepContinuity: 0,
    valid: false,
  };
}

function buildScoreFactors(breakdown) {
  const scoreFactors = [
    { id: "sleepHours", label: "Sleep hours", value: breakdown.sleepAdjustment },
    {
      id: "naturalSleepNeed",
      label: "Natural sleep need",
      value: breakdown.naturalMatchAdjustment,
    },
    { id: "stress", label: "Stress", value: breakdown.stressAdjustment },
    { id: "wakeups", label: "Wake-ups", value: breakdown.wakeupAdjustment },
    { id: "routine", label: "Routine", value: breakdown.routineAdjustment },
    { id: "environment", label: "Environment", value: breakdown.environmentAdjustment },
    { id: "alcohol", label: "Alcohol", value: breakdown.alcoholAdjustment },
    { id: "caffeine", label: "Caffeine", value: breakdown.caffeineAdjustment },
    { id: "cannabis", label: "Cannabis", value: breakdown.cannabisAdjustment },
  ];

  if (breakdown.crossingPenalty !== 0) {
    scoreFactors.push({
      id: "drugsCross",
      label: "Drugs (crossing)",
      value: breakdown.crossingPenalty,
    });
  }

  return scoreFactors;
}

export function computeScoreMetrics({ normalized }) {
  const sleepHours = Number(normalized?.raw?.durationHours ?? 0);
  const naturalHours = Number(normalized?.raw?.naturalDurationHours ?? 0);

  if (sleepHours <= 0) {
    return buildNoSleepScoreState();
  }

  const stress = clamp(roundWhole(normalized?.raw?.stress ?? 0), 0, 10);
  const wakeups = Math.max(0, roundWhole(normalized?.raw?.timesWokeUp ?? 0));
  const routine = clamp(roundWhole(normalized?.raw?.consistency ?? 0), 0, 10);
  const environment = clamp(roundWhole(normalized?.raw?.environment ?? 0), 0, 10);
  const alcohol = clamp(roundWhole(normalized?.raw?.alcohol ?? 0), 0, 10);
  const caffeine = clamp(roundWhole(normalized?.raw?.caffeine ?? 0), 0, 10);
  const cannabis = clamp(roundWhole(normalized?.raw?.weed ?? 0), 0, 10);

  const breakdown = {
    alcoholAdjustment: getAlcoholAdjustment(alcohol),
    base: 75,
    caffeineAdjustment: getCaffeineAdjustment(caffeine),
    cannabisAdjustment: getCannabisAdjustment(cannabis),
    crossingPenalty: 0,
    environmentAdjustment: getEnvironmentAdjustment(environment),
    naturalMatchAdjustment: getNaturalMatchAdjustment(sleepHours, naturalHours),
    routineAdjustment: getRoutineAdjustment(routine),
    sleepAdjustment: getSleepAdjustment(sleepHours),
    stressAdjustment: getStressAdjustment(stress),
    wakeupAdjustment: getWakeupAdjustment(wakeups),
  };

  breakdown.crossingPenalty = getCrossingPenalty(
    breakdown.alcoholAdjustment,
    breakdown.caffeineAdjustment,
    breakdown.cannabisAdjustment,
    alcohol,
    caffeine,
    cannabis,
  );

  let score =
    breakdown.base +
    breakdown.sleepAdjustment +
    breakdown.naturalMatchAdjustment +
    breakdown.stressAdjustment +
    breakdown.wakeupAdjustment +
    breakdown.routineAdjustment +
    breakdown.environmentAdjustment +
    breakdown.alcoholAdjustment +
    breakdown.caffeineAdjustment +
    breakdown.cannabisAdjustment +
    breakdown.crossingPenalty;

  score = Math.max(score, 15);
  score = Math.min(score, 99);

  const scoreFactors = buildScoreFactors(breakdown);
  const sleepContinuity = clamp(85 + breakdown.wakeupAdjustment * 4, 0, 100);
  const efficiency = clamp(
    72 +
      breakdown.wakeupAdjustment * 4 +
      breakdown.stressAdjustment * 2 +
      breakdown.environmentAdjustment,
    0,
    100,
  );
  const restfulness = clamp(
    score +
      breakdown.routineAdjustment +
      breakdown.environmentAdjustment +
      breakdown.stressAdjustment,
    0,
    100,
  );
  const repairQuality = clamp(
    score + breakdown.sleepAdjustment + breakdown.naturalMatchAdjustment,
    0,
    100,
  );
  const remRestoration = clamp(
    score +
      breakdown.naturalMatchAdjustment +
      breakdown.stressAdjustment +
      Math.round(breakdown.wakeupAdjustment / 2),
    0,
    100,
  );

  return {
    breakdown,
    componentScores: {
      architecture: breakdown.routineAdjustment + breakdown.environmentAdjustment,
      duration: breakdown.sleepAdjustment + breakdown.naturalMatchAdjustment,
      efficiency: breakdown.wakeupAdjustment,
      modifiers:
        breakdown.stressAdjustment +
        breakdown.alcoholAdjustment +
        breakdown.caffeineAdjustment +
        breakdown.cannabisAdjustment +
        breakdown.crossingPenalty,
      rawComposite: score,
    },
    efficiency,
    overallSleepScore: score,
    rawEffects: scoreFactors,
    reason: "",
    remRestoration,
    repairQuality,
    restfulness,
    scoreFactors,
    sleepContinuity,
    valid: true,
  };
}
