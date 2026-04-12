import { BASE_PULSES_PER_SECOND } from "../constants/pulseDefaults";

export function resolvePulseSpawnRate(stageProfile) {
  return Math.max(24, BASE_PULSES_PER_SECOND * (stageProfile?.pulseRateMultiplier ?? 1));
}
