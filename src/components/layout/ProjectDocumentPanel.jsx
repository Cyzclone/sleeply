import Card from "../common/Card";

export default function ProjectDocumentPanel({ onClose }) {
  return (
    <div className="sl-settings-overlay" onClick={onClose} role="presentation">
      <Card
        className="sl-settings-panel sl-project-document-panel"
        rightSlot={
          <button className="sl-inline-button" onClick={onClose} type="button">
            Close
          </button>
        }
        title="Purpose"
      >
        <div
          className="sl-project-info-panel__body"
          onClick={(event) => event.stopPropagation()}
          role="presentation"
        >
          <section className="sl-project-info-panel__section">
            <strong>Project Summary</strong>
            <p>
              Sleeply is an interactive sleep simulator that turns questionnaire answers
              into a synchronized timeline, brainwave view, sleep score, and 3D brain
              visualization.
            </p>
          </section>
          <section className="sl-project-info-panel__section">
            <strong>Purpose</strong>
            <p>
              Its goal is mostly to entertain while also inspiring curiosity, thought,
              and learning. Users are able to see how sleep stages, habits, and conditions can shape a
              night of sleep.
            </p>
          </section>
        </div>
      </Card>
    </div>
  );
}
