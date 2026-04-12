import { useEffect, useState } from "react";
import { CURSOR_STORAGE_KEY, DEFAULT_CURSOR_ID } from "../config/cursors";

const STORAGE_KEY = "sleeply-app-settings-v1";

const DEFAULT_SETTINGS = {
  colorPalette: "purple",
  cursorStyle: DEFAULT_CURSOR_ID,
  showProfileDates: true,
  show3DInfoPopups: true,
  displayIndividualTimes: true,
  enableTutorial: true,
};

function readStoredSettings() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const storedCursor = window.localStorage.getItem(CURSOR_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};

    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      cursorStyle: storedCursor || parsed.cursorStyle || DEFAULT_SETTINGS.cursorStyle,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function useAppSettings() {
  const [settings, setSettings] = useState(readStoredSettings);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    window.localStorage.setItem(CURSOR_STORAGE_KEY, settings.cursorStyle);
  }, [settings]);

  function updateSetting(key, value) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  }

  return {
    settings,
    updateSetting,
  };
}
