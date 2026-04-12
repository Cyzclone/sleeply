export default function Card({ title, children, rightSlot, className = "" }) {
  return (
    <section className={`sl-card ${className}`.trim()}>
      {(title || rightSlot) && (
        <div className="sl-card__header">
          {title ? <h3 className="sl-card__title">{title}</h3> : <div />}
          {rightSlot}
        </div>
      )}
      <div className="sl-card__body">{children}</div>
    </section>
  );
}
