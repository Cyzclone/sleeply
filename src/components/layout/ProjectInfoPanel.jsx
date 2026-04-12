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
            <strong>3D Brain Model</strong>
            <p>Versal. (2014). Brain Areas [3D model]. Sketchfab.</p>
          </section>
        </div>
      </Card>
    </div>
  );
}
