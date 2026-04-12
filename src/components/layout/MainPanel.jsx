export default function MainPanel({ children, className = "" }) {
  return <main className={`sl-main-panel ${className}`.trim()}>{children}</main>;
}
