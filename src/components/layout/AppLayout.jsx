import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import MainPanel from "./MainPanel";

export default function AppLayout({
  children,
  mode = "dashboard",
  onOpenProjectInfo,
  onOpenSettings,
  onSetTheme,
  theme,
}) {
  return (
    <div className={`sl-app-shell sl-app-shell--${mode}`.trim()}>
      <Topbar
        mode={mode}
        onOpenProjectInfo={onOpenProjectInfo}
        onOpenSettings={onOpenSettings}
        onSetTheme={onSetTheme}
        theme={theme}
      />
      <MainPanel className={mode === "analysis" ? "sl-main-panel--analysis" : ""}>
        {children}
      </MainPanel>
      <Sidebar mode={mode} />
    </div>
  );
}
