export const BASE_STAGE_WAVE_PROFILES = {
  awake: {
    panelLabel: "Awake",
    values: {
      delta: 0.02,
      theta: 0.08,
      alpha: 0.35,
      beta: 0.55,
    },
  },
  light: {
    panelLabel: "Light Sleep",
    values: {
      delta: 0.1,
      theta: 0.55,
      alpha: 0.2,
      beta: 0.15,
    },
  },
  deep: {
    panelLabel: "Deep Sleep",
    values: {
      delta: 0.8,
      theta: 0.15,
      alpha: 0.03,
      beta: 0.02,
    },
  },
  rem: {
    panelLabel: "REM Sleep",
    values: {
      delta: 0.05,
      theta: 0.35,
      alpha: 0.15,
      beta: 0.45,
    },
  },
};
