import { FileText, Info, Moon, Settings, SunMedium } from "lucide-react";

export default function Topbar({
  mode = "dashboard",
  onOpenProjectDocument,
  onOpenProjectInfo,
  onOpenSettings,
  onSetTheme,
  theme,
}) {
  if (mode === "analysis") {
    return null;
  }

  return (
    <header className="sl-topbar">
      <div className="sl-topbar__side sl-topbar__side--left">
        <button
          aria-label="Project info"
          className="sl-icon-control sl-icon-control--topbar"
          onClick={onOpenProjectInfo}
          type="button"
        >
          <Info aria-hidden="true" size={30} strokeWidth={2.1} />
        </button>
        <button
          aria-label="Project document"
          className="sl-icon-control sl-icon-control--topbar"
          onClick={onOpenProjectDocument}
          type="button"
        >
          <FileText aria-hidden="true" size={30} strokeWidth={2.1} />
        </button>
      </div>
      <div className="sl-topbar__side sl-topbar__side--right">
        <button
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="sl-icon-control sl-icon-control--topbar sl-icon-control--theme"
          onClick={() => onSetTheme(theme === "dark" ? "light" : "dark")}
          type="button"
        >
          {theme === "dark" ? (
            <SunMedium aria-hidden="true" size={30} strokeWidth={2.1} />
          ) : (
            <Moon aria-hidden="true" size={30} strokeWidth={2.1} />
          )}
        </button>
        <button
          aria-label="Settings"
          className="sl-icon-control sl-icon-control--topbar"
          onClick={onOpenSettings}
          type="button"
        >
          <Settings aria-hidden="true" size={30} strokeWidth={2.1} />
        </button>
      </div>
    </header>
  );
}
