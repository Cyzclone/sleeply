import { BRAIN_HEMISPHERES, BRAIN_REGION_KEYS } from "../constants/brainRegions";

function makeRegionMap() {
  return Object.fromEntries(BRAIN_REGION_KEYS.map((region) => [region, []]));
}

export function bucketPointsByRegion(anchors) {
  const byRegion = makeRegionMap();
  const byHemisphere = Object.fromEntries(BRAIN_HEMISPHERES.map((side) => [side, []]));
  const byRegionAndHemisphere = Object.fromEntries(
    BRAIN_REGION_KEYS.map((region) => [
      region,
      Object.fromEntries(BRAIN_HEMISPHERES.map((side) => [side, []])),
    ]),
  );

  anchors.forEach((anchor) => {
    byRegion[anchor.region]?.push(anchor);
    byHemisphere[anchor.hemisphere]?.push(anchor);
    byRegionAndHemisphere[anchor.region]?.[anchor.hemisphere]?.push(anchor);
  });

  return {
    all: anchors,
    byHemisphere,
    byRegion,
    byRegionAndHemisphere,
  };
}
