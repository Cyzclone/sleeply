import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { bucketPointsByRegion } from "../../brain-mapping/utils/bucketPointsByRegion";
import { STAGE_PULSE_PROFILES } from "../constants/stagePulseProfiles";
import { MAX_GAP_SECONDS, MIN_GAP_SECONDS } from "../constants/pulseDefaults";
import { buildPulseDescriptor } from "../utils/buildPulseDescriptor";
import { resolvePulseSpawnRate } from "../utils/resolvePulseSpawnRate";
import { selectPulseSpawnPoint } from "../utils/selectPulseSpawnPoints";

const DEBUG_PULSE_STATS = false;

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function scheduleNextSpawn(now, stageProfile) {
  const pulsesPerSecond = resolvePulseSpawnRate(stageProfile);
  const preferredGap = 1 / pulsesPerSecond;
  const randomness = stageProfile.randomness ?? 0.5;
  const intentionality = stageProfile.intentionality ?? 0.5;
  const jitterMin = MIN_GAP_SECONDS * (0.65 + randomness * 0.55);
  const jitterMax = MAX_GAP_SECONDS * (0.5 + randomness * 0.75);
  const randomizedGap = randomBetween(jitterMin, jitterMax);
  const smoothness = 0.25 + intentionality * 0.45;

  return now + preferredGap * smoothness + randomizedGap * (1 - smoothness);
}

export function usePulseEngine({ anchors, paused, stage = "awake", stageProfiles }) {
  const [pulses, setPulses] = useState([]);
  const pulsesRef = useRef([]);
  const nextSpawnAtRef = useRef(0);
  const pulseIdRef = useRef(0);
  const previousAnchorsRef = useRef(anchors);
  const previousSelectionRef = useRef({ hemisphere: "", region: "" });
  const clusterStateRef = useRef({ active: false, hemisphere: "", region: "", remaining: 0 });
  const debugStatsRef = useRef({
    count: 0,
    pulseTypes: {},
    regions: {},
    resetAt: 0,
  });
  const buckets = bucketPointsByRegion(anchors ?? []);
  const stageProfile = stageProfiles?.[stage] ?? STAGE_PULSE_PROFILES[stage] ?? STAGE_PULSE_PROFILES.awake;

  useFrame((state) => {
    const now = state.clock.getElapsedTime();
    const currentAnchors = anchors ?? [];

    if (previousAnchorsRef.current !== anchors) {
      previousAnchorsRef.current = anchors;
      pulsesRef.current = [];
      nextSpawnAtRef.current = 0;
      pulseIdRef.current = 0;
      previousSelectionRef.current = { hemisphere: "", region: "" };
      clusterStateRef.current = { active: false, hemisphere: "", region: "", remaining: 0 };
      if (pulses.length) {
        setPulses([]);
      }
    }

    if (!currentAnchors.length) {
      if (pulsesRef.current.length) {
        pulsesRef.current = [];
        setPulses([]);
      }
      return;
    }

    if (nextSpawnAtRef.current === 0) {
      nextSpawnAtRef.current = now + scheduleNextSpawn(now, stageProfile);
    }

    let nextPulses = pulsesRef.current
      .map((pulse) => ({
        ...pulse,
        lifeProgress: Math.min(1, (now - pulse.spawnedAt) / pulse.lifespan),
      }))
      .filter((pulse) => now - pulse.spawnedAt < pulse.lifespan);

    if (!paused && now >= nextSpawnAtRef.current) {
      const selection = selectPulseSpawnPoint({
        buckets,
        previousSelection: previousSelectionRef.current,
        stageProfile,
        stateRef: clusterStateRef,
      });
      const pulse = buildPulseDescriptor({
        anchor: selection.anchor,
        id: `pulse-${pulseIdRef.current}`,
        pulseType: selection.pulseType,
        pulseTypeShare: selection.pulseTypeShare,
        spawnedAt: now,
        stageProfile,
      });

      nextPulses = [
        ...nextPulses,
        pulse,
      ];
      pulseIdRef.current += 1;
      nextSpawnAtRef.current = scheduleNextSpawn(now, stageProfile);
      previousSelectionRef.current = {
        hemisphere: selection.hemisphere,
        region: selection.region,
      };

      if (DEBUG_PULSE_STATS) {
        if (!debugStatsRef.current.resetAt) {
          debugStatsRef.current.resetAt = now + 1;
        }

        debugStatsRef.current.count += 1;
        debugStatsRef.current.pulseTypes[selection.pulseType] =
          (debugStatsRef.current.pulseTypes[selection.pulseType] ?? 0) + 1;
        debugStatsRef.current.regions[selection.region] =
          (debugStatsRef.current.regions[selection.region] ?? 0) + 1;

        if (now >= debugStatsRef.current.resetAt) {
          console.log("[Sleeply Pulse Debug]", {
            clustering: stageProfile.clustering,
            pulseRate: resolvePulseSpawnRate(stageProfile),
            pulseTypePercentages: debugStatsRef.current.pulseTypes,
            randomness: stageProfile.randomness,
            regionDistribution: debugStatsRef.current.regions,
            spawnCount: debugStatsRef.current.count,
            stage,
            synchronization: stageProfile.synchronization,
          });
          debugStatsRef.current = {
            count: 0,
            pulseTypes: {},
            regions: {},
            resetAt: now + 1,
          };
        }
      }
    }

    pulsesRef.current = nextPulses;
    setPulses(nextPulses);
  });

  return pulses;
}
