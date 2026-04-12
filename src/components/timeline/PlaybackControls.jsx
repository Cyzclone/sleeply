import CustomSelect from "../common/CustomSelect";

function formatClock(minutes) {
  const safeSeconds = Math.max(0, Math.round(minutes * 60));
  const hours = Math.floor(safeSeconds / 3600);
  const mins = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return `${hours}:${String(mins).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

const SPEED_OPTIONS = [1, 2, 5, 10, 25, 50, 100, 250, 500, 1000];

export default function PlaybackControls({
  boundaryAwakeLabel,
  boundaryAwakeMinutes = 0,
  boundaryAwakeTotalMinutes = 0,
  currentMinutes,
  durationMinutes,
  isPlaying,
  onChangeSpeed,
  onTogglePlayback,
  playButtonRef,
  playbackSpeed,
  speedControlRef,
  timeDisplayRef,
}) {
  return (
    <div className="sl-playback-controls">
      <div className="sl-playback-controls__left" ref={speedControlRef}>
        <label className="sl-playback-controls__speed">
          <span>Speed</span>
          <CustomSelect
            ariaLabel="Playback speed"
            className="sl-playback-controls__speed-select"
            menuClassName="sl-playback-controls__speed-menu"
            onChange={(value) => onChangeSpeed(Number(value))}
            options={SPEED_OPTIONS.map((speed) => ({
              label: `${speed}x`,
              value: String(speed),
            }))}
            value={String(playbackSpeed)}
          />
        </label>
      </div>
      <button
        aria-label={isPlaying ? "Pause timeline" : "Resume timeline"}
        className="sl-inline-button sl-playback-controls__button"
        onClick={onTogglePlayback}
        ref={playButtonRef}
        type="button"
      >
        <span
          aria-hidden="true"
          className={`sl-playback-controls__icon ${
            isPlaying ? "is-pause" : "is-play"
          }`.trim()}
        />
      </button>
      <div className="sl-playback-controls__time" ref={timeDisplayRef}>
        {boundaryAwakeLabel ? (
          <span className="sl-playback-controls__awake-time">
            {boundaryAwakeLabel} {formatClock(boundaryAwakeMinutes)}/{formatClock(boundaryAwakeTotalMinutes)}
          </span>
        ) : (
          <span>{formatClock(currentMinutes)}/{formatClock(durationMinutes)}</span>
        )}
      </div>
    </div>
  );
}
