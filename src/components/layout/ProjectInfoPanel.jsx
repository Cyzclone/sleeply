import Card from "../common/Card";

export default function ProjectInfoPanel({ onClose }) {
  return (
    <div className="sl-settings-overlay" onClick={onClose} role="presentation">
      <Card
        className="sl-settings-panel sl-project-info-panel"
        rightSlot={
          <button className="sl-inline-button" onClick={onClose} type="button">
            Close
          </button>
        }
        title="About Sleeply"
      >
        <div className="sl-project-info-panel__body" onClick={(event) => event.stopPropagation()} role="presentation">
          <section className="sl-project-info-panel__section">
            <strong>Project</strong>
            <p>Created by Simon Green Thompson for BitCamp 2026.</p>
          </section>
          <section className="sl-project-info-panel__section">
            <strong>What Sleeply is</strong>
            <p>
              Sleeply is an interactive sleep simulator that turns self-reported answers
              into a synchronized sleep timeline, brainwave view, sleep score, and 3D
              brain visualization.
            </p>
          </section>
          <section className="sl-project-info-panel__section">
            <strong>Why self-reported data matters</strong>
            <p>
              The idea behind the project is to emphasize that human experience and
              self-reported data still have an important place in understanding health.
              The way we sleep, feel, and live can reveal patterns that help us reflect
              on our habits and make meaningful changes in our lives.
            </p>
          </section>
          <section className="sl-project-info-panel__section">
            <strong>How to read the simulation</strong>
            <p>
              Sleeply cannot directly measure your brainwaves, but its estimates are
              meant to be fairly representative at a broad level because human sleep-stage
              brainwave patterns are generally similar across people. The project is best
              understood as an educational and reflective model rather than a direct
              clinical measurement.
            </p>
          </section>
          <section className="sl-project-info-panel__section">
            <strong>3D Brain Model</strong>
            <p>Versal. (2014). Brain Areas [3D model]. Sketchfab.</p>
          </section>
        </div>
      </Card>
    </div>
  );
}
