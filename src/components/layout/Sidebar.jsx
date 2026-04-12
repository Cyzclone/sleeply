export default function Sidebar({ mode = "dashboard" }) {
  if (mode === "analysis") {
    return null;
  }

  return (
    <>
      <div className="sl-ambient-orb sl-ambient-orb--one" aria-hidden="true" />
      <div className="sl-ambient-orb sl-ambient-orb--two" aria-hidden="true" />
      <div className="sl-ambient-haze" aria-hidden="true" />
      <div className="sl-ambient-stars" aria-hidden="true" />
    </>
  );
}
