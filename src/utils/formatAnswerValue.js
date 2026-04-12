export function formatAnswerValue(question, answer) {
  if (!answer || answer.skipped) {
    return "Skipped";
  }

  if (question.id === "plannedSleepHours" || question.id === "naturalSleepHours") {
    return `${answer.value} hours`;
  }

  if (question.id === "roomWakeCount") {
    return `${answer.value}`;
  }

  return `${answer.value} / 10`;
}
