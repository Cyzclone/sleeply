function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

function roundStageMinutes(stageDurations, cycleMinutes) {
  const rounded = stageDurations.map((stage) => ({
    ...stage,
    minutes: Math.max(1, Math.round(stage.minutes)),
  }));

  const total = rounded.reduce((sum, stage) => sum + stage.minutes, 0);
  const diff = cycleMinutes - total;

  if (!diff) {
    return rounded;
  }

  const targetIndex = rounded.reduce((bestIndex, stage, index, all) => {
    return stage.minutes > all[bestIndex].minutes ? index : bestIndex;
  }, 0);

  rounded[targetIndex] = {
    ...rounded[targetIndex],
    minutes: Math.max(1, rounded[targetIndex].minutes + diff),
  };

  return rounded;
}

function formatHoursRounded(minutes, decimals = 2) {
  return (minutes / 60).toFixed(decimals);
}

function distributeCycleRemainder(lengths, totalMinutes, minima, maxima) {
  let resolved = [...lengths];
  let diff = totalMinutes - resolved.reduce((sum, value) => sum + value, 0);
  let guard = 0;

  while (diff !== 0 && guard < 500) {
    const direction = diff > 0 ? 1 : -1;
    const candidates = resolved
      .map((value, index) => ({ index, room: direction > 0 ? maxima[index] - value : value - minima[index] }))
      .filter((entry) => entry.room > 0);

    if (!candidates.length) {
      break;
    }

    const target = candidates[guard % candidates.length];
    resolved[target.index] += direction;
    diff -= direction;
    guard += 1;
  }

  return resolved;
}

function buildCycleLengths(totalMinutes, cycleTargets, variance = 0) {
  if (totalMinutes <= cycleTargets.firstCycleMinutes) {
    return [totalMinutes];
  }

  const targetCycleLength = cycleTargets.genericCycleMinutes ?? 92;
  const cycleCount = Math.max(1, Math.round(totalMinutes / Math.max(targetCycleLength, 1)));
  const lengths = [];
  const minima = [];
  const maxima = [];

  for (let index = 0; index < cycleCount; index += 1) {
    const progress = cycleCount === 1 ? 0 : index / (cycleCount - 1);
    const baseTarget =
      index === 0
        ? cycleTargets.firstCycleMinutes
        : cycleTargets.firstCycleMinutes * 0.3 + cycleTargets.laterCycleMinutes * 0.7 * progress + cycleTargets.laterCycleMinutes * (1 - progress);
    const trendTarget =
      index === 0
        ? cycleTargets.firstCycleMinutes
        : cycleTargets.firstCycleMinutes + (cycleTargets.laterCycleMinutes - cycleTargets.firstCycleMinutes) * Math.pow(progress, 0.72);
    const varianceWave = Math.sin(progress * Math.PI * 1.4) * variance * 5;
    const min = index === 0 ? 70 : 90;
    const max = index === 0 ? 100 : 120;
    const desiredLength = clamp(
      Math.round((baseTarget * 0.2 + trendTarget * 0.8) + varianceWave),
      min,
      max,
    );

    lengths.push(desiredLength);
    minima.push(min);
    maxima.push(max);
  }

  return distributeCycleRemainder(lengths, totalMinutes, minima, maxima);
}

export function buildProfileSleepCycles(answers) {
  if (answers.noSleepMode || (answers.totalSleepMinutes ?? 0) <= 0) {
    return {
      cycles: [],
      totalMinutes: Math.max(60, Math.round(answers.boundaryAwakeMinutes ?? 60)),
    };
  }

  const totalMinutes = Math.max(5, Math.round(answers.totalSleepMinutes ?? 480));
  const cycleLengths = buildCycleLengths(
    totalMinutes,
    answers.cycleTargets ?? {
      firstCycleMinutes: 84,
      genericCycleMinutes: 92,
      laterCycleMinutes: 98,
    },
    answers.cycleLengthVariance ?? 0,
  );
  const cycleCount = cycleLengths.length;
  const cycleLabelDecimals = cycleCount >= 7 ? 1 : 2;
  const cycles = [];
  let elapsedMinutes = 0;

  for (let index = 0; index < cycleCount; index += 1) {
    const isLastCycle = index === cycleCount - 1;
    const cycleMinutes = cycleLengths[index] ?? (isLastCycle ? totalMinutes - elapsedMinutes : 90);

    const cycleProgress = cycleCount === 1 ? 0 : index / (cycleCount - 1);
    const shortCycleFactor = clamp(cycleMinutes / 90, 0, 1);
    const stageTargets = answers.stageDurationTargets ?? {
      deep: 0.24,
      light: 0.46,
      rem: 0.3,
    };
    const extraCyclePenalty = cycleCount > 6 ? Math.max(0, index - 4) * 0.05 : 0;

    const lightWeight = clamp(
      stageTargets.light * (0.9 + (answers.fragmentation ?? 0) * 0.26 + extraCyclePenalty),
      0.18,
      0.58,
    );
    const deepWeight = clamp(
      stageTargets.deep *
        (0.9 + (answers.earlyDeepBoost ?? 0) * (1 - cycleProgress) * 0.95 - cycleProgress * 0.72 - extraCyclePenalty * 1.8),
      0.04,
      0.46,
    );
    const remWeight = clamp(
      stageTargets.rem *
        (0.82 + (answers.lateRemExpansion ?? 0) * (0.55 + cycleProgress * 0.95) + Math.max(0, index - 1) * 0.06 - (1 - shortCycleFactor) * 0.38),
      0,
      0.34,
    );

    const totalWeight = lightWeight + deepWeight + remWeight;
    const stageDurations = roundStageMinutes(
      [
        {
          key: "light",
          label: "L",
          title: "Light",
          tone: "theta",
          countsTowardCycle: true,
          minutes: (lightWeight / totalWeight) * cycleMinutes,
        },
        {
          key: "deep",
          label: "D",
          title: "Deep",
          tone: "delta",
          countsTowardCycle: true,
          minutes: (deepWeight / totalWeight) * cycleMinutes,
        },
        {
          key: "rem",
          label: "R",
          title: "REM",
          tone: "beta",
          countsTowardCycle: true,
          minutes:
            remWeight <= 0.01
              ? 0
              : (remWeight / totalWeight) * cycleMinutes,
        },
      ],
      cycleMinutes,
    ).filter((stage) => stage.minutes > 0);

    let cycleElapsed = elapsedMinutes;
    const sleepStages = stageDurations.map((stage) => {
      const startMinute = cycleElapsed;
      cycleElapsed += stage.minutes;

      return {
        ...stage,
        startMinute,
        endMinute: cycleElapsed,
        percent: (stage.minutes / cycleMinutes) * 100,
      };
    });

    const stages = sleepStages.map((stage) => ({
      ...stage,
      displayMinutes: stage.minutes,
      percent: (stage.minutes / cycleMinutes) * 100,
      displayPercent: (stage.minutes / cycleMinutes) * 100,
    }));
    const coreMinutes = sleepStages.reduce(
      (sum, stage) => sum + (stage.countsTowardCycle === false ? 0 : stage.minutes),
      0,
    );

    cycles.push({
      id: `cycle-${index + 1}`,
      index,
      label: `Cycle ${index + 1}`,
      labelWithDuration: `Cycle ${index + 1} (${formatHoursRounded(cycleMinutes, cycleLabelDecimals)}h)`,
      coreMinutes,
      minutes: cycleMinutes,
      percent: (cycleMinutes / totalMinutes) * 100,
      startMinute: elapsedMinutes,
      endMinute: cycleElapsed,
      stages,
    });

    elapsedMinutes = cycleElapsed;
  }

  return {
    cycles,
    totalMinutes,
  };
}
