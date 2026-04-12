export const REQUIRED_QUESTION_IDS = new Set([
  "plannedSleepHours",
  "naturalSleepHours",
]);

export const PROFILE_QUESTIONS = [
  {
    id: "plannedSleepHours",
    label: "Sleep duration",
    min: 0,
    max: 14,
    required: true,
    step: 0.5,
  },
  {
    id: "naturalSleepHours",
    label: "How much sleep do you usually get if you don't set an alarm?",
    min: 0,
    max: 14,
    required: true,
    step: 0.5,
  },
  {
    id: "stressLevel",
    label: "How stressed are you tonight? (1-10)",
    min: 0,
    max: 10,
    step: 1,
  },
  {
    id: "roomWakeCount",
    label: "Number of interruptions to sleep (got out of bed)",
    min: 0,
    max: 5,
    step: 1,
  },
  {
    id: "sleepConsistency",
    label: "How consistent has your sleep been in the last week? (1-10)",
    min: 0,
    max: 10,
    step: 1,
  },
  {
    id: "environmentLevel",
    label: "How disruptive is your sleep environment? (temperature, noise, comfort) (1-10)",
    min: 0,
    max: 10,
    step: 1,
  },
  {
    id: "alcoholLevel",
    label: "How much alcohol have you had to drink? (1-10)",
    min: 0,
    max: 10,
    step: 1,
  },
  {
    id: "caffeineLevel",
    label: "How much caffeine is still in your system? (1-10)",
    min: 0,
    max: 10,
    step: 1,
  },
  {
    id: "cannabisLevel",
    label: "How much cannabis is in your system? (1-10)",
    min: 0,
    max: 10,
    step: 1,
  },
];

export function createDefaultAnswers() {
  return {
    plannedSleepHours: { value: 8, skipped: false },
    naturalSleepHours: { value: 8, skipped: false },
    stressLevel: { value: 3, skipped: false },
    roomWakeCount: { value: 0, skipped: false },
    sleepConsistency: { value: 6, skipped: false },
    environmentLevel: { value: 2, skipped: false },
    alcoholLevel: { value: 0, skipped: false },
    caffeineLevel: { value: 0, skipped: false },
    cannabisLevel: { value: 0, skipped: false },
  };
}
