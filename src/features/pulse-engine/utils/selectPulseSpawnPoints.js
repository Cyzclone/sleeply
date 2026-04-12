import { BRAIN_HEMISPHERES, BRAIN_REGION_KEYS } from "../../brain-mapping/constants/brainRegions";
import {
  BASELINE_PULSE_TYPE_WEIGHT,
  BASELINE_REGION_WEIGHT,
  PULSE_TYPE_CONTRAST_EXPONENT,
  PULSE_TYPE_KEYS,
} from "../constants/pulseDefaults";

function normalizeWeights(weights) {
  const total = Object.values(weights).reduce((sum, value) => sum + Math.max(0, value), 0) || 1;

  return Object.fromEntries(
    Object.entries(weights).map(([key, value]) => [key, Math.max(0, value) / total]),
  );
}

function chooseWeightedKey(weights) {
  const entries = Object.entries(weights);
  let cursor = Math.random();

  for (const [key, value] of entries) {
    cursor -= value;
    if (cursor <= 0) {
      return key;
    }
  }

  return entries[entries.length - 1]?.[0] ?? "";
}

export function resolvePulseTypeWeights(stageProfile) {
  const weighted = Object.fromEntries(
    PULSE_TYPE_KEYS.map((key) => [
      key,
      BASELINE_PULSE_TYPE_WEIGHT + (stageProfile?.pulseTypeWeights?.[key] ?? 0),
    ]),
  );

  const contrasted = Object.fromEntries(
    Object.entries(weighted).map(([key, value]) => [
      key,
      Math.pow(Math.max(value, 0.0001), PULSE_TYPE_CONTRAST_EXPONENT),
    ]),
  );

  return normalizeWeights(contrasted);
}

export function resolveRegionWeights(stageProfile) {
  const weighted = Object.fromEntries(
    BRAIN_REGION_KEYS.map((key) => [
      key,
      BASELINE_REGION_WEIGHT + (stageProfile?.regionWeights?.[key] ?? 0),
    ]),
  );

  return normalizeWeights(weighted);
}

function chooseHemisphere(previousSelection, stageProfile, clusterState) {
  if (clusterState.active && clusterState.hemisphere) {
    return clusterState.hemisphere;
  }

  const repeatBias = (stageProfile.intentionality ?? 0.5) * 0.42;
  if (previousSelection.hemisphere && Math.random() < repeatBias) {
    return previousSelection.hemisphere;
  }

  return BRAIN_HEMISPHERES[Math.floor(Math.random() * BRAIN_HEMISPHERES.length)];
}

export function selectPulseSpawnPoint({
  buckets,
  previousSelection,
  stageProfile,
  stateRef,
}) {
  const clusterState = stateRef.current;
  const regionWeights = resolveRegionWeights(stageProfile);
  const pulseTypeWeights = resolvePulseTypeWeights(stageProfile);
  const randomness = stageProfile.randomness ?? 0.5;
  const clustering = stageProfile.clustering ?? 0.2;
  const intentionality = stageProfile.intentionality ?? 0.5;
  const synchronization = stageProfile.synchronization ?? 0.4;

  let region = chooseWeightedKey(regionWeights);
  if (clusterState.active && clusterState.remaining > 0 && Math.random() < clustering) {
    region = clusterState.region;
  } else if (previousSelection.region && Math.random() < intentionality * (1 - randomness * 0.5)) {
    region = previousSelection.region;
  }

  const hemisphere = chooseHemisphere(previousSelection, stageProfile, clusterState);
  const regionCandidates =
    buckets.byRegionAndHemisphere?.[region]?.[hemisphere]?.length
      ? buckets.byRegionAndHemisphere[region][hemisphere]
      : buckets.byRegion?.[region]?.length
        ? buckets.byRegion[region]
        : buckets.all;
  const anchor = regionCandidates[Math.floor(Math.random() * regionCandidates.length)];
  const pulseType = chooseWeightedKey(pulseTypeWeights);

  const shouldStartCluster =
    Math.random() < clustering * (0.45 + synchronization * 0.35 + intentionality * 0.25);

  if (!clusterState.active && shouldStartCluster) {
    stateRef.current = {
      active: true,
      hemisphere,
      region,
      remaining: 1 + Math.round(1 + clustering * 4 + synchronization * 3),
    };
  } else if (clusterState.active) {
    stateRef.current = {
      ...clusterState,
      remaining: Math.max(0, clusterState.remaining - 1),
    };

    if (stateRef.current.remaining === 0) {
      stateRef.current = { active: false, hemisphere: "", region: "", remaining: 0 };
    }
  }

  return {
    anchor,
    hemisphere,
    pulseType,
    pulseTypeShare: pulseTypeWeights[pulseType] ?? 0,
    pulseTypeWeights,
    region,
    regionWeights,
  };
}
