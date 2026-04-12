export default function TimelineCursor({ className = "", onPointerDown, progress }) {
  return (
    <div
      className={`sl-timeline-cursor ${className}`.trim()}
      onPointerDown={onPointerDown}
      style={{ left: `${Math.max(0, Math.min(progress, 1)) * 100}%` }}
    >
      <div className="sl-timeline-cursor__line" />
      <div className="sl-timeline-cursor__handle" />
    </div>
  );
}
