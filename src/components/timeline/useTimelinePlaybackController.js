import { useEffect, useMemo, useRef, useState } from "react";

const PLAYBACK_MINUTES_PER_SECOND = 1 / 60;
const BOUNDARY_AWAKE_TOP_PERCENT = 7;
const SLEEP_START_EPSILON_MINUTES = 0.01;

function clampMinutes(value, durationMinutes) {
  return Math.max(0, Math.min(value, durationMinutes));
}

function resolveCurrentStage(currentCycle, currentMinutes) {
  if (!currentCycle) {
    return "awake";
  }

  const activeStage = currentCycle.stages.find((stage) => {
    if (stage.countsTowardCycle === false) {
      return false;
    }

    return (
      currentMinutes >= stage.startMinute &&
      (currentMinutes < stage.endMinute || currentMinutes === currentCycle.endMinute)
    );
  });

  return activeStage?.key ?? "awake";
}

function createWakePlaybackState(mode = "awake-start", progressMinutes = 0) {
  return { mode, progressMinutes };
}

export function useTimelinePlaybackController({
  boundaryAwakeMinutes = 10,
  displayIndividualTimes = true,
  stages,
  totalMinutes,
}) {
  const noSleepMode = stages.length === 0;
  const [currentMinutes, setCurrentMinutes] = useState(0);
  const [bottomProgressOverride, setBottomProgressOverride] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(10);
  const [wakePlaybackState, setWakePlaybackState] = useState(
    createWakePlaybackState(),
  );
  const currentMinutesRef = useRef(0);
  const wakePlaybackStateRef = useRef(createWakePlaybackState());

  function updateCurrentMinutes(valueOrUpdater) {
    setCurrentMinutes((current) => {
      const nextValue =
        typeof valueOrUpdater === "function" ? valueOrUpdater(current) : valueOrUpdater;
      currentMinutesRef.current = nextValue;
      return nextValue;
    });
  }

  function updateWakePlaybackState(valueOrUpdater) {
    setWakePlaybackState((current) => {
      const nextValue =
        typeof valueOrUpdater === "function" ? valueOrUpdater(current) : valueOrUpdater;
      wakePlaybackStateRef.current = nextValue;
      return nextValue;
    });
  }

  useEffect(() => {
    currentMinutesRef.current = currentMinutes;
  }, [currentMinutes]);

  useEffect(() => {
    wakePlaybackStateRef.current = wakePlaybackState;
  }, [wakePlaybackState]);

  useEffect(() => {
    if (!isPlaying) {
      return undefined;
    }

    let frameId = 0;
    let previousTime = performance.now();

    function tick(now) {
      const elapsedSeconds = (now - previousTime) / 1000;
      previousTime = now;
      const elapsedTimelineMinutes =
        elapsedSeconds * PLAYBACK_MINUTES_PER_SECOND * playbackSpeed;

      if (noSleepMode) {
        updateWakePlaybackState((current) => {
          const nextProgress = current.progressMinutes + elapsedTimelineMinutes;

          if (nextProgress < boundaryAwakeMinutes) {
            return createWakePlaybackState("awake-start", nextProgress);
          }

          setIsPlaying(false);
          return createWakePlaybackState("awake-start", boundaryAwakeMinutes);
        });

        frameId = window.requestAnimationFrame(tick);
        return;
      }

      if (wakePlaybackStateRef.current.mode === "awake-start") {
        updateWakePlaybackState((current) => {
          if (current.mode !== "awake-start") {
            return current;
          }

          const nextProgress = current.progressMinutes + elapsedTimelineMinutes;

          if (nextProgress < boundaryAwakeMinutes) {
            return createWakePlaybackState("awake-start", nextProgress);
          }

          updateCurrentMinutes(
            Math.max(nextProgress - boundaryAwakeMinutes, SLEEP_START_EPSILON_MINUTES),
          );
          return createWakePlaybackState("", 0);
        });

        frameId = window.requestAnimationFrame(tick);
        return;
      }

      if (wakePlaybackStateRef.current.mode === "awake-end") {
        updateWakePlaybackState((current) => {
          if (current.mode !== "awake-end") {
            return current;
          }

          const nextProgress = current.progressMinutes + elapsedTimelineMinutes;

          if (nextProgress < boundaryAwakeMinutes) {
            return createWakePlaybackState("awake-end", nextProgress);
          }

          setIsPlaying(false);
          return createWakePlaybackState("awake-end", boundaryAwakeMinutes);
        });

        frameId = window.requestAnimationFrame(tick);
        return;
      }

      setBottomProgressOverride(null);
      updateCurrentMinutes((current) => {
        const next = clampMinutes(current + elapsedTimelineMinutes, totalMinutes);

        if (next >= totalMinutes) {
          updateWakePlaybackState(createWakePlaybackState("awake-end", 0));
          return totalMinutes;
        }

        return next;
      });

      frameId = window.requestAnimationFrame(tick);
    }

    frameId = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(frameId);
  }, [boundaryAwakeMinutes, isPlaying, noSleepMode, playbackSpeed, totalMinutes]);

  const currentCycle =
    stages.find(
      (cycle) =>
        currentMinutes >= cycle.startMinute &&
        (currentMinutes < cycle.endMinute || cycle === stages[stages.length - 1]),
    ) ??
    stages[0] ??
    null;

  const currentStage = useMemo(
    () =>
      noSleepMode
        ? "awake"
        : wakePlaybackState.mode === "awake-start" || wakePlaybackState.mode === "awake-end"
          ? "awake"
          : resolveCurrentStage(currentCycle, currentMinutes),
    [currentCycle, currentMinutes, noSleepMode, wakePlaybackState.mode],
  );

  const nightProgress = useMemo(() => {
    if (!totalMinutes) {
      return 0;
    }

    if (noSleepMode) {
      return wakePlaybackState.progressMinutes / Math.max(boundaryAwakeMinutes, 1);
    }

    const sleepWidth = 100 - BOUNDARY_AWAKE_TOP_PERCENT * 2;

    if (wakePlaybackState.mode === "awake-start") {
      return (
        (wakePlaybackState.progressMinutes / boundaryAwakeMinutes) *
        (BOUNDARY_AWAKE_TOP_PERCENT / 100)
      );
    }

    if (wakePlaybackState.mode === "awake-end") {
      return (
        (BOUNDARY_AWAKE_TOP_PERCENT + sleepWidth) / 100 +
        (wakePlaybackState.progressMinutes / boundaryAwakeMinutes) *
          (BOUNDARY_AWAKE_TOP_PERCENT / 100)
      );
    }

    return (
      (BOUNDARY_AWAKE_TOP_PERCENT + (currentMinutes / totalMinutes) * sleepWidth) /
      100
    );
  }, [boundaryAwakeMinutes, currentMinutes, noSleepMode, totalMinutes, wakePlaybackState]);

  const topSegments = useMemo(() => {
    if (noSleepMode) {
      return [
        {
          id: "boundary-awake-only",
          kind: "boundary",
          label: "Awake",
          offsetPercent: 0,
          percent: 100,
        },
      ];
    }

    let offsetPercent = 0;
    const segments = [
      {
        id: "boundary-awake-start",
        kind: "boundary",
        label: "Awake",
        percent: BOUNDARY_AWAKE_TOP_PERCENT,
        offsetPercent,
      },
    ];

    offsetPercent += BOUNDARY_AWAKE_TOP_PERCENT;
    const sleepWidth = 100 - BOUNDARY_AWAKE_TOP_PERCENT * 2;

    stages.forEach((cycle) => {
      const percent = (cycle.minutes / Math.max(totalMinutes, 1)) * sleepWidth;
      segments.push({
        id: cycle.id,
        kind: "cycle",
        label: displayIndividualTimes ? cycle.labelWithDuration : cycle.label,
        percent,
        offsetPercent,
      });
      offsetPercent += percent;
    });

    segments.push({
      id: "boundary-awake-end",
      kind: "boundary",
      label: "Awake",
      percent: BOUNDARY_AWAKE_TOP_PERCENT,
      offsetPercent,
    });

    return segments;
  }, [displayIndividualTimes, noSleepMode, stages, totalMinutes]);

  const activeTopSegmentId =
    noSleepMode
      ? "boundary-awake-only"
      : wakePlaybackState.mode === "awake-start"
      ? "boundary-awake-start"
      : wakePlaybackState.mode === "awake-end"
        ? "boundary-awake-end"
        : currentCycle?.id ?? "";

  const bottomBarProgress = useMemo(() => {
    if (bottomProgressOverride !== null) {
      return bottomProgressOverride;
    }

    if (noSleepMode) {
      return wakePlaybackState.progressMinutes / Math.max(boundaryAwakeMinutes, 1);
    }

    if (!currentCycle) {
      return 0;
    }

    const progressWithinCycle = clampMinutes(
      currentMinutes - currentCycle.startMinute,
      currentCycle.minutes,
    );

    if (wakePlaybackState.mode === "awake-start" || wakePlaybackState.mode === "awake-end") {
      return wakePlaybackState.progressMinutes / boundaryAwakeMinutes;
    }

    return progressWithinCycle / Math.max(currentCycle.minutes, 1);
  }, [
    boundaryAwakeMinutes,
    bottomProgressOverride,
    currentCycle,
    currentMinutes,
    noSleepMode,
    wakePlaybackState,
  ]);

  function seek(nextMinutes) {
    setBottomProgressOverride(null);
    updateWakePlaybackState(createWakePlaybackState("", 0));
    updateCurrentMinutes(clampMinutes(nextMinutes, totalMinutes));
  }

  function seekNightRatio(ratio) {
    const clampedRatio = Math.max(0, Math.min(ratio, 1));

    if (noSleepMode) {
      setBottomProgressOverride(null);
      updateWakePlaybackState(
        createWakePlaybackState("awake-start", clampedRatio * boundaryAwakeMinutes),
      );
      updateCurrentMinutes(0);
      return;
    }

    const startBoundary = BOUNDARY_AWAKE_TOP_PERCENT / 100;
    const endBoundaryStart = 1 - startBoundary;

    if (clampedRatio <= startBoundary) {
      setBottomProgressOverride(null);
      updateWakePlaybackState(
        createWakePlaybackState(
          "awake-start",
          (clampedRatio / startBoundary) * boundaryAwakeMinutes,
        ),
      );
      updateCurrentMinutes(0);
      return;
    }

    if (clampedRatio >= endBoundaryStart) {
      setBottomProgressOverride(null);
      updateWakePlaybackState(
        createWakePlaybackState(
          "awake-end",
          ((clampedRatio - endBoundaryStart) / startBoundary) * boundaryAwakeMinutes,
        ),
      );
      updateCurrentMinutes(totalMinutes);
      return;
    }

    const sleepRatio =
      (clampedRatio - startBoundary) / Math.max(1 - startBoundary * 2, 0.001);
    seek(sleepRatio * totalMinutes);
  }

  function seekCycleRatio(ratio) {
    const clampedRatio = Math.max(0, Math.min(ratio, 1));

    if (noSleepMode) {
      setBottomProgressOverride(null);
      updateWakePlaybackState(
        createWakePlaybackState("awake-start", clampedRatio * boundaryAwakeMinutes),
      );
      updateCurrentMinutes(0);
      return;
    }

    if (wakePlaybackState.mode === "awake-start") {
      setBottomProgressOverride(null);
      updateWakePlaybackState(
        createWakePlaybackState("awake-start", clampedRatio * boundaryAwakeMinutes),
      );
      updateCurrentMinutes(0);
      return;
    }

    if (wakePlaybackState.mode === "awake-end") {
      setBottomProgressOverride(null);
      updateWakePlaybackState(
        createWakePlaybackState("awake-end", clampedRatio * boundaryAwakeMinutes),
      );
      updateCurrentMinutes(totalMinutes);
      return;
    }

    if (!currentCycle) {
      return;
    }

    seek(currentCycle.startMinute + clampedRatio * currentCycle.minutes);
  }

  function togglePlayback() {
    if (noSleepMode) {
      if (wakePlaybackState.progressMinutes >= boundaryAwakeMinutes) {
        updateWakePlaybackState(createWakePlaybackState("awake-start", 0));
      }

      setIsPlaying((current) => !current);
      return;
    }

    if (currentMinutes >= totalMinutes && wakePlaybackState.mode !== "awake-end") {
      updateCurrentMinutes(0);
      setBottomProgressOverride(null);
      updateWakePlaybackState(createWakePlaybackState("awake-start", 0));
      setIsPlaying(true);
      return;
    }

    if (!isPlaying) {
      setBottomProgressOverride(null);
      if (currentMinutes <= SLEEP_START_EPSILON_MINUTES && !wakePlaybackState.mode) {
        updateWakePlaybackState(createWakePlaybackState("awake-start", 0));
      }
    }

    setIsPlaying((current) => !current);
  }

  function pausePlayback() {
    setIsPlaying(false);
  }

  const hasReachedPlaybackEnd = noSleepMode
    ? wakePlaybackState.progressMinutes >= boundaryAwakeMinutes
    : wakePlaybackState.mode === "awake-end" &&
      wakePlaybackState.progressMinutes >= boundaryAwakeMinutes;
  const hasReachedSleepEnd = noSleepMode
    ? wakePlaybackState.progressMinutes >= boundaryAwakeMinutes
    : currentMinutes >= totalMinutes;

  return {
    activeTopSegmentId,
    bottomBarProgress,
    boundaryAwakeMinutes,
    currentCycle,
    currentMinutes,
    currentStage,
    displayIndividualTimes,
    hasReachedPlaybackEnd,
    hasReachedSleepEnd,
    isPlaying,
    nightProgress,
    noSleepMode,
    playbackSpeed,
    seekCycleRatio,
    seekNightRatio,
    pausePlayback,
    setPlaybackSpeed,
    stages,
    togglePlayback,
    topSegments,
    totalMinutes,
    wakePlaybackState,
  };
}
