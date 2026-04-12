function fract(value) {
  return value - Math.floor(value);
}

function pseudoRandom(seed) {
  return fract(Math.sin(seed * 127.1 + 311.7) * 43758.5453123);
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function smoothstep(value) {
  return value * value * (3 - 2 * value);
}

export function createSmoothRandomModulator({ seed, minDuration, maxDuration, minValue, maxValue }) {
  return function sample(timeSeconds) {
    const durationRange = maxDuration - minDuration;
    const phaseIndex = Math.floor(timeSeconds / maxDuration);
    const segmentSeed = seed + phaseIndex * 17.31;
    const currentDuration = minDuration + pseudoRandom(segmentSeed) * durationRange;
    const currentIndex = Math.floor(timeSeconds / currentDuration);
    const segmentStart = currentIndex * currentDuration;
    const localT = smoothstep(
      Math.max(0, Math.min((timeSeconds - segmentStart) / currentDuration, 1)),
    );
    const currentValue = lerp(
      minValue,
      maxValue,
      pseudoRandom(seed + currentIndex * 13.17),
    );
    const nextValue = lerp(
      minValue,
      maxValue,
      pseudoRandom(seed + (currentIndex + 1) * 13.17),
    );

    return lerp(currentValue, nextValue, localT);
  };
}

export function createLayeredNoise(seed) {
  return function sample(timeSeconds) {
    const low = Math.sin(timeSeconds * (0.41 + pseudoRandom(seed + 1)) + seed) * 0.52;
    const mid =
      Math.sin(timeSeconds * (1.17 + pseudoRandom(seed + 2) * 0.5) + seed * 1.9) * 0.31;
    const high =
      Math.cos(timeSeconds * (3.6 + pseudoRandom(seed + 3) * 0.8) + seed * 2.7) * 0.17;

    return low + mid + high;
  };
}

export function createMicroJitter(seed, intensity = 1) {
  return function sample(timeSeconds) {
    const rapid =
      Math.sin(timeSeconds * (9.5 + pseudoRandom(seed + 4) * 4) + seed * 1.3) * 0.55;
    const flutter =
      Math.cos(timeSeconds * (17 + pseudoRandom(seed + 5) * 8) + seed * 0.7) * 0.3;
    const grit =
      Math.sin(timeSeconds * (29 + pseudoRandom(seed + 6) * 12) + seed * 2.1) * 0.15;

    return (rapid + flutter + grit) * intensity;
  };
}

