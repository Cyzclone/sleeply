import BrainWaveCanvas from "./BrainWaveCanvas";

export default function BrainwaveBox({
  description,
  infoRef,
  label,
  onInfoHover,
  percent,
  renderState,
  tone,
}) {
  return (
    <div className={`sl-wave-box sl-wave-box--${tone}`.trim()}>
      <div className="sl-wave-box__header">
        <span>{label} {percent}%</span>
        <div className="sl-wave-box__info-wrap">
          <span
            aria-hidden="true"
            className="sl-wave-box__info"
            onFocus={onInfoHover}
            onMouseEnter={onInfoHover}
            ref={infoRef}
          >
            i
          </span>
          <div className="sl-wave-box__tooltip" role="tooltip">
            {description}
          </div>
        </div>
      </div>
      <div className="sl-wave-box__plot">
        <BrainWaveCanvas
          emphasis={tone}
          renderState={renderState}
        />
      </div>
    </div>
  );
}
