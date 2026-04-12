function normalize(value, min, max) {
  const span = Math.max(max - min, 0.0001);
  return (value - min) / span;
}

export function classifyBrainRegion(position, bounds) {
  const [x, y, z] = position;
  const normalizedX = normalize(x, bounds.minX, bounds.maxX);
  const normalizedY = normalize(y, bounds.minY, bounds.maxY);
  const normalizedZ = normalize(z, bounds.minZ, bounds.maxZ);
  const centeredX = normalizedX - 0.5;
  const hemisphere = centeredX < 0 ? "left" : "right";
  const lateral = Math.abs(centeredX);
  const isHippocampus =
    lateral >= 0.16 &&
    lateral <= 0.34 &&
    normalizedY >= 0.26 &&
    normalizedY <= 0.5 &&
    normalizedZ >= 0.18 &&
    normalizedZ <= 0.42;

  if (normalizedY >= 0.68) {
    return { hemisphere, isHippocampus, region: "frontal" };
  }

  if (normalizedY <= 0.18) {
    return { hemisphere, isHippocampus, region: "occipital" };
  }

  if (lateral >= 0.22 && normalizedZ <= 0.5) {
    return { hemisphere, isHippocampus, region: "temporal" };
  }

  if (normalizedZ >= 0.62 && normalizedY >= 0.28) {
    return { hemisphere, isHippocampus, region: "parietal" };
  }

  return { hemisphere, isHippocampus, region: "central" };
}
