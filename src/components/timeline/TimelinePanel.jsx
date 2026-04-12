import { useRef } from "react";
import PlaybackControls from "./PlaybackControls";
import TimelineBar from "./TimelineBar";

export default function TimelinePanel({
  bottomTimelineRef,
  controller,
  onChangeSpeed,
  onTogglePlayback,
  playButtonRef,
  speedControlRef,
  timeDisplayRef,
  topTimelineRef,
}) {
  const cycleTrackRef = useRef(null);
  const stageTrackRef = useRef(null);

  function beginDrag(clientX, seekHandler) {
    seekHandler(clientX);

    function handleMove(moveEvent) {
      seekHandler(moveEvent.clientX);
    }

    function handleUp() {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    }

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  }

  function seekNightFromClientX(clientX) {
    const bounds = cycleTrackRef.current?.getBoundingClientRect();

    if (!bounds || bounds.width <= 0) {
      return;
    }

    controller.seekNightRatio((clientX - bounds.left) / bounds.width);
  }

  function seekCycleFromClientX(clientX) {
    const bounds = stageTrackRef.current?.getBoundingClientRect();

    if (!bounds || bounds.width <= 0) {
      return;
    }

    controller.seekCycleRatio((clientX - bounds.left) / bounds.width);
  }

  function handleCyclePointerDown(event) {
    event.preventDefault();
    beginDrag(event.clientX, seekNightFromClientX);
  }

  function handleStagePointerDown(event) {
    event.preventDefault();
    beginDrag(event.clientX, seekCycleFromClientX);
  }

  return (
    <div className="sl-timeline">
      <div
        className={`sl-timeline-stage-area ${
          controller.noSleepMode ? "sl-timeline-stage-area--awake-only" : ""
        }`.trim()}
      >
        {!controller.noSleepMode ? (
          <div className="sl-timeline-hitbox sl-timeline-hitbox--top" ref={cycleTrackRef}>
            <div className="sl-timeline-hitbox__inner" />
          </div>
        ) : null}
        <div className="sl-timeline-hitbox sl-timeline-hitbox--bottom" ref={stageTrackRef}>
          <div className="sl-timeline-hitbox__inner" />
        </div>
        <TimelineBar
          activeBoundaryAwake={
            controller.wakePlaybackState.mode === "awake-start" ||
            controller.wakePlaybackState.mode === "awake-end"
          }
          activeTopSegmentId={controller.activeTopSegmentId}
          currentCycle={controller.currentCycle}
          currentCycleId={controller.currentCycle?.id ?? ""}
          currentCycleProgress={controller.bottomBarProgress}
          cycles={controller.stages}
          displayIndividualTimes={controller.displayIndividualTimes}
          nightProgress={controller.nightProgress}
          noSleepMode={controller.noSleepMode}
          onCyclePointerDown={handleCyclePointerDown}
          onStagePointerDown={handleStagePointerDown}
          topSegments={controller.topSegments}
          bottomTimelineRef={bottomTimelineRef}
          topTimelineRef={topTimelineRef}
        />
      </div>
      <PlaybackControls
        boundaryAwakeLabel={
          controller.wakePlaybackState.mode === "awake-start" ||
          controller.wakePlaybackState.mode === "awake-end"
            ? "Awake"
            : ""
        }
        boundaryAwakeMinutes={controller.wakePlaybackState.progressMinutes}
        boundaryAwakeTotalMinutes={controller.boundaryAwakeMinutes}
        currentMinutes={controller.currentMinutes}
        durationMinutes={controller.totalMinutes}
        isPlaying={controller.isPlaying}
        onChangeSpeed={onChangeSpeed ?? controller.setPlaybackSpeed}
        onTogglePlayback={onTogglePlayback ?? controller.togglePlayback}
        playbackSpeed={controller.playbackSpeed}
        playButtonRef={playButtonRef}
        speedControlRef={speedControlRef}
        timeDisplayRef={timeDisplayRef}
      />
    </div>
  );
}
