import { useEffect, useMemo, useRef, useState } from "react";
import { normalizeStageWaveMix } from "../utils/mixStageWaves";

const WAVE_KEYS = ["delta", "theta", "alpha", "beta"];
const SHIFT_AMOUNT = 0.01;
const MAX_RELATIVE_SHIFT = 0.03;
const MIN_WAVE_SHARE = 0.01;
const MIN_INTERVAL_MS = 5000;
const MAX_INTERVAL_MS = 10000;

function cloneStageProfiles(stageProfiles) {
  return Object.fromEntries(
    Object.entries(stageProfiles ?? {}).map(([stageKey, profile]) => [
      stageKey,
      {
        ...profile,
        values: normalizeStageWaveMix(profile?.values ?? {}),
      },
    ]),
  );
}

function getRandomInterval() {
  return MIN_INTERVAL_MS + Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS);
}

function nudgeStageMix(currentValues, baseValues) {
  const nextValues = { ...currentValues };
  const shiftCaps = Object.fromEntries(
    WAVE_KEYS.map((waveKey) => {
      const baseValue = baseValues[waveKey] ?? 0;
      const relativeCap = baseValue * MAX_RELATIVE_SHIFT;
      const minimumCap = baseValue <= 0.02 ? 0.01 : 0;

      return [waveKey, Math.max(relativeCap, minimumCap)];
    }),
  );

  const eligibleDonors = WAVE_KEYS.filter((waveKey) => {
    const cap = shiftCaps[waveKey];
    if (cap < SHIFT_AMOUNT) {
      return false;
    }

    const minimumValue = Math.max(MIN_WAVE_SHARE, (baseValues[waveKey] ?? 0) - cap);
    return (currentValues[waveKey] ?? 0) - SHIFT_AMOUNT >= minimumValue;
  });

  const eligibleReceivers = WAVE_KEYS.filter((waveKey) => {
    const cap = shiftCaps[waveKey];
    if (cap < SHIFT_AMOUNT) {
      return false;
    }

    return (currentValues[waveKey] ?? 0) + SHIFT_AMOUNT <= (baseValues[waveKey] ?? 0) + cap;
  });

  if (!eligibleDonors.length || !eligibleReceivers.length) {
    return currentValues;
  }

  const donorPool = eligibleDonors.filter((waveKey) => eligibleReceivers.length > 1 || eligibleReceivers[0] !== waveKey);
  if (!donorPool.length) {
    return currentValues;
  }

  const donor = donorPool[Math.floor(Math.random() * donorPool.length)];
  const receiverPool = eligibleReceivers.filter((waveKey) => waveKey !== donor);
  if (!receiverPool.length) {
    return currentValues;
  }

  const receiver = receiverPool[Math.floor(Math.random() * receiverPool.length)];
  nextValues[donor] -= SHIFT_AMOUNT;
  nextValues[receiver] += SHIFT_AMOUNT;

  return normalizeStageWaveMix(nextValues);
}

export function useStageWaveMixDrift({ currentStage, paused, stageProfiles }) {
  const baseProfiles = useMemo(() => cloneStageProfiles(stageProfiles), [stageProfiles]);
  const [driftedProfiles, setDriftedProfiles] = useState(baseProfiles);
  const timeoutRef = useRef(null);

  useEffect(() => {
    setDriftedProfiles(baseProfiles);
  }, [baseProfiles]);

  useEffect(() => {
    if (!currentStage || paused || !baseProfiles[currentStage]) {
      return undefined;
    }

    timeoutRef.current = window.setTimeout(() => {
      setDriftedProfiles((currentProfiles) => {
        const activeProfile = currentProfiles[currentStage] ?? baseProfiles[currentStage];
        const baseProfile = baseProfiles[currentStage];

        return {
          ...currentProfiles,
          [currentStage]: {
            ...activeProfile,
            values: nudgeStageMix(activeProfile.values, baseProfile.values),
          },
        };
      });
    }, getRandomInterval());

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [baseProfiles, currentStage, paused, driftedProfiles]);

  return driftedProfiles;
}
