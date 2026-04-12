import { buildWaveComponentSample } from "./buildWaveComponentSample";

function buildEnvironmentNoise(timeSeconds, environment) {
  const noiseLevel = environment?.noiseLevel ?? 0.2;
  const low =
    Math.sin(timeSeconds * 0.83 + 0.7) * 0.16 +
    Math.cos(timeSeconds * 1.91 + 2.2) * 0.09;
  const mid =
    Math.sin(timeSeconds * 6.2 + 1.3) * 0.04 +
    Math.cos(timeSeconds * 9.7 + 0.4) * 0.025;

  return (low + mid) * noiseLevel;
}

export function buildCombinedEegSample(generators, mix, dt, timeSeconds, environment) {
  const delta = buildWaveComponentSample(generators.delta, dt, environment);
  const theta = buildWaveComponentSample(generators.theta, dt, environment);
  const alpha = buildWaveComponentSample(generators.alpha, dt, environment);
  const beta = buildWaveComponentSample(generators.beta, dt, environment);
  const components = {
    delta,
    theta,
    alpha,
    beta,
  };
  const diagnostics = {
    delta: generators.delta.getDiagnostics(),
    theta: generators.theta.getDiagnostics(),
    alpha: generators.alpha.getDiagnostics(),
    beta: generators.beta.getDiagnostics(),
  };

  return {
    components,
    diagnostics,
    combined:
      delta * (mix?.delta ?? 0) +
      theta * (mix?.theta ?? 0) +
      alpha * (mix?.alpha ?? 0) +
      beta * (mix?.beta ?? 0) +
      buildEnvironmentNoise(timeSeconds, environment),
  };
}
