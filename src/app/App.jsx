import { useEffect, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import ProjectInfoPanel from "../components/layout/ProjectInfoPanel";
import SettingsPanel from "../components/layout/SettingsPanel";
import { getCursorById } from "../config/cursors";
import { resolveAppPalette } from "../features/settings/constants/colorPalettes";
import { setCursor } from "../utils/setCursor";
import AnalysisPage from "../pages/AnalysisPage";
import DashboardPage from "../pages/DashboardPage";
import { useAppSettings } from "../hooks/useAppSettings";
import { useProfiles } from "../hooks/useProfiles";
import "../styles/index.css";
import "./app.css";

export default function App() {
  const [theme, setTheme] = useState("light");
  const [activeProfileId, setActiveProfileId] = useState("");
  const [loadedProfileState, setLoadedProfileState] = useState({
    awakeOnlyMinutes: null,
    profileId: "",
  });
  const [isProjectInfoOpen, setIsProjectInfoOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { settings, updateSetting } = useAppSettings();
  const profileState = useProfiles();
  const loadedProfile =
    profileState.profiles.find((profile) => profile.id === loadedProfileState.profileId) ?? null;

  useEffect(() => {
    const root = document.documentElement;
    const palette = resolveAppPalette(theme, settings.colorPalette);

    root.dataset.theme = theme;
    Object.entries(palette).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
  }, [settings.colorPalette, theme]);

  useEffect(() => {
    setCursor(getCursorById(settings.cursorStyle));
  }, [settings.cursorStyle]);

  useEffect(() => {
    const pointerPosition = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    };

    function isEditableElement(element) {
      if (!(element instanceof HTMLElement)) {
        return false;
      }

      if (element.isContentEditable) {
        return true;
      }

      const tagName = element.tagName;
      return tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT";
    }

    function getScrollableAncestor(startElement, axis = "y") {
      let current = startElement instanceof HTMLElement ? startElement : null;

      while (current) {
        const style = window.getComputedStyle(current);
        const canScrollY =
          (style.overflowY === "auto" || style.overflowY === "scroll") &&
          current.scrollHeight > current.clientHeight;
        const canScrollX =
          (style.overflowX === "auto" || style.overflowX === "scroll") &&
          current.scrollWidth > current.clientWidth;

        if ((axis === "y" && canScrollY) || (axis === "x" && canScrollX)) {
          return current;
        }

        current = current.parentElement;
      }

      return null;
    }

    function getPointerElement() {
      return document.elementFromPoint(pointerPosition.x, pointerPosition.y);
    }

    function getVisibleScrollableFallback(axis = "y") {
      const candidates = Array.from(
        document.querySelectorAll(".sl-settings-overlay, .sl-settings-panel .sl-card__body, .sl-question-list, .sl-profiles-list, .sl-main-panel"),
      );

      return candidates.find((candidate) => getScrollableAncestor(candidate, axis) === candidate) ?? null;
    }

    function handlePointerMove(event) {
      pointerPosition.x = event.clientX;
      pointerPosition.y = event.clientY;
    }

    function handleArrowScroll(event) {
      if (!event.key.startsWith("Arrow")) {
        return;
      }

      const activeElement = document.activeElement;
      if (isEditableElement(activeElement)) {
        return;
      }

      if (activeElement instanceof HTMLElement && activeElement.closest(".sl-brain-panel")) {
        return;
      }

      const axis = event.key === "ArrowLeft" || event.key === "ArrowRight" ? "x" : "y";
      const scrollTarget =
        getScrollableAncestor(activeElement, axis) ||
        getScrollableAncestor(getPointerElement(), axis) ||
        getVisibleScrollableFallback(axis) ||
        getScrollableAncestor(document.scrollingElement, axis);

      if (!(scrollTarget instanceof HTMLElement)) {
        return;
      }

      const verticalStep = 54;
      const horizontalStep = 54;
      let handled = true;

      if (event.key === "ArrowUp") {
        scrollTarget.scrollBy({ top: -verticalStep, behavior: "auto" });
      } else if (event.key === "ArrowDown") {
        scrollTarget.scrollBy({ top: verticalStep, behavior: "auto" });
      } else if (event.key === "ArrowLeft") {
        scrollTarget.scrollBy({ left: -horizontalStep, behavior: "auto" });
      } else if (event.key === "ArrowRight") {
        scrollTarget.scrollBy({ left: horizontalStep, behavior: "auto" });
      } else {
        handled = false;
      }

      if (handled) {
        event.preventDefault();
      }
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("keydown", handleArrowScroll);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("keydown", handleArrowScroll);
    };
  }, []);

  return (
    <div className="sl-app">
      <AppLayout
        mode={loadedProfile ? "analysis" : "dashboard"}
        onOpenProjectInfo={() => setIsProjectInfoOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSetTheme={setTheme}
        theme={theme}
      >
        {loadedProfile ? (
          <AnalysisPage
            awakeOnlyMinutesOverride={loadedProfileState.awakeOnlyMinutes}
            appSettings={settings}
            onBack={() => setLoadedProfileState({ awakeOnlyMinutes: null, profileId: "" })}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onUpdateSetting={updateSetting}
            profile={loadedProfile}
            questions={profileState.questions}
          />
        ) : (
          <DashboardPage
            activeProfileId={activeProfileId}
            appSettings={settings}
            onLoadProfile={(profileId, awakeOnlyMinutes = null) =>
              setLoadedProfileState({ awakeOnlyMinutes, profileId })
            }
            onSelectProfile={setActiveProfileId}
            {...profileState}
          />
        )}
      </AppLayout>
      {isSettingsOpen && (
        <SettingsPanel
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          updateSetting={updateSetting}
        />
      )}
      {isProjectInfoOpen && (
        <ProjectInfoPanel onClose={() => setIsProjectInfoOpen(false)} />
      )}
    </div>
  );
}
