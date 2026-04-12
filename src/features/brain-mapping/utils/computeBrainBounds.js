export function computeBrainBounds(points) {
  return points.reduce(
    (bounds, point) => ({
      maxX: Math.max(bounds.maxX, point[0]),
      maxY: Math.max(bounds.maxY, point[1]),
      maxZ: Math.max(bounds.maxZ, point[2]),
      minX: Math.min(bounds.minX, point[0]),
      minY: Math.min(bounds.minY, point[1]),
      minZ: Math.min(bounds.minZ, point[2]),
    }),
    {
      maxX: -Infinity,
      maxY: -Infinity,
      maxZ: -Infinity,
      minX: Infinity,
      minY: Infinity,
      minZ: Infinity,
    },
  );
}
