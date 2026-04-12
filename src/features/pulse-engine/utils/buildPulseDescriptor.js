import {
  MAX_LIFESPAN,
  MAX_SIZE,
  MIN_LIFESPAN,
  MIN_SIZE,
  PULSE_COLORS,
} from "../constants/pulseDefaults";

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

const TYPE_SIZE_MULTIPLIER = {
  alpha: 0.92,
  beta: 0.82,
  delta: 1.16,
  theta: 1,
};

export function buildPulseDescriptor({
  anchor,
  id,
  pulseType,
  pulseTypeShare = 0.25,
  stageProfile,
  spawnedAt,
}) {
  const baseSize = randomBetween(MIN_SIZE, MAX_SIZE);
  const baseLifespan = randomBetween(MIN_LIFESPAN, MAX_LIFESPAN);
  const presenceScale = 0.72 + Math.pow(Math.max(pulseTypeShare, 0), 0.65) * 0.9;
  const size =
    baseSize *
    (stageProfile.sizeBias ?? 1) *
    (TYPE_SIZE_MULTIPLIER[pulseType] ?? 1) *
    presenceScale;
  const lifespan = baseLifespan * (0.94 + (stageProfile.synchronization ?? 0.5) * 0.22);

  return {
    brightness:
      (stageProfile.brightnessBias ?? 1) *
      (0.74 + Math.pow(Math.max(pulseTypeShare, 0), 0.58) * 0.55) *
      randomBetween(0.94, 1.06),
    color: PULSE_COLORS[pulseType],
    hemisphere: anchor.hemisphere,
    id,
    lifeProgress: 0,
    lifespan,
    normal: anchor.normal,
    position: anchor.position,
    pulseType,
    pulseTypeShare,
    region: anchor.region,
    size,
    spawnedAt,
  };
}
