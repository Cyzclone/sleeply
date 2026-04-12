import TimelineCursor from "./TimelineCursor";

function formatStageLabel(stage, displayIndividualTimes) {
  if (!displayIndividualTimes) {
    return stage.title;
  }

  return `${stage.title} (${Math.round(stage.displayMinutes ?? stage.minutes)} min)`;
}

export default function TimelineBar({
  activeBoundaryAwake,
  activeTopSegmentId,
  bottomTimelineRef,
  currentCycle,
  currentCycleProgress,
  displayIndividualTimes,
  nightProgress,
  noSleepMode = false,
  onCyclePointerDown,
  onStagePointerDown,
  topSegments,
  topTimelineRef,
}) {
  return (
    <div className={`sl-timeline-layers ${noSleepMode ? "sl-timeline-layers--awake-only" : ""}`.trim()}>
      {!noSleepMode ? (
        <div
          className="sl-cycle-track"
          onPointerDown={onCyclePointerDown}
          ref={topTimelineRef}
          role="presentation"
        >
          <div className="sl-cycle-track__segments">
            {topSegments.map((segment) => (
              <div
                className={`sl-cycle-segment ${
                  segment.id === activeTopSegmentId ? "is-active" : ""
                } ${segment.kind === "boundary" ? "sl-cycle-segment--awake" : ""}`.trim()}
                key={segment.id}
                style={{ width: `${segment.percent}%` }}
                title={segment.label}
              >
                <span>{segment.label}</span>
              </div>
            ))}
          </div>
          <TimelineCursor
            className="sl-timeline-cursor--top"
            onPointerDown={onCyclePointerDown}
            progress={nightProgress}
          />
        </div>
      ) : null}

      <div
        className={`sl-stage-track ${noSleepMode ? "sl-stage-track--awake-only" : ""}`.trim()}
        onPointerDown={onStagePointerDown}
        ref={bottomTimelineRef}
        role="presentation"
      >
        <div className="sl-stage-track__segments">
          {activeBoundaryAwake ? (
            <div className="sl-stage-segment sl-stage-segment--wake sl-stage-segment--boundary">
              <span>Awake</span>
            </div>
          ) : (
            currentCycle?.stages.map((stage, index) => (
              <div
                className={`sl-stage-segment sl-stage-segment--${stage.tone}`}
                key={`${currentCycle.id}-${stage.key}-${index}`}
                style={{ width: `${stage.displayPercent ?? stage.percent}%` }}
                title={`${currentCycle.label} - ${stage.title} - ${Math.round(stage.displayMinutes ?? stage.minutes)} min`}
              >
                <span>{formatStageLabel(stage, displayIndividualTimes)}</span>
              </div>
            ))
          )}
        </div>
        <TimelineCursor
          className="sl-timeline-cursor--bottom"
          onPointerDown={onStagePointerDown}
          progress={currentCycleProgress}
        />
      </div>
    </div>
  );
}
