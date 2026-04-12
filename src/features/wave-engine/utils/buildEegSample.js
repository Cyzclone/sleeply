import { EEG_WAVE_PROFILES } from "../constants/waveProfiles";
import { generateWaveComponent } from "./generateWaveComponent";

function buildSmoothNoise(timeSeconds, noiseLevel) {
  const lowBand = Math.sin(timeSeconds * 0.9) * 0.28;
  const midBand = Math.cos(timeSeconds * 2.1 + 1.3) * 0.18;
  const highBand = Math.sin(timeSeconds * 5.3 + 2.4) * 0.08;

  return (lowBand + midBand + highBand) * noiseLevel * 0.35;
}

export function buildEegSample(renderState, mix, timeSeconds) {
  const components = {
    delta: generateWaveComponent(
      EEG_WAVE_PROFILES.delta,
      mix.delta,
      timeSeconds,
      renderState,
    ),
    theta: generateWaveComponent(
      EEG_WAVE_PROFILES.theta,
      mix.theta,
      timeSeconds,
      renderState,
    ),
    alpha: generateWaveComponent(
      EEG_WAVE_PROFILES.alpha,
      mix.alpha,
      timeSeconds,
      renderState,
    ),
    beta: generateWaveComponent(
      EEG_WAVE_PROFILES.beta,
      mix.beta,
      timeSeconds,
      renderState,
    ),
  };

  const combined =
    components.delta +
    components.theta +
    components.alpha +
    components.beta +
    buildSmoothNoise(timeSeconds, renderState?.noiseLevel ?? 0.2);

  return {
    combined,
    components,
  };
}

