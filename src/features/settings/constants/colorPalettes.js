export const COLOR_OPTIONS = [
  { value: "purple", label: "Purple (Classic)" },
  { value: "simple", label: "Simple" },
  { value: "red", label: "Red" },
  { value: "orange", label: "Orange" },
  { value: "yellow", label: "Yellow" },
  { value: "green", label: "Green" },
  { value: "blue", label: "Blue" },
  { value: "tan", label: "Tan" },
  { value: "grey", label: "Grey" },
];

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  const safeHex =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : normalized;

  const value = Number.parseInt(safeHex, 16);

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function getRelativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const channel = (value) => {
    const normalized = value / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function getReadableTextColor(backgroundHex) {
  return getRelativeLuminance(backgroundHex) > 0.42 ? "#111111" : "#f8f8fd";
}

const PALETTES = {
  purple: {
    light: {
      text: "#222234",
      background: "#f6f5fb",
      primary: "#5f30c5",
      secondary: "#cfc6f5",
      accent: "#8f6df0",
    },
    dark: {
      text: "#f8f8fd",
      background: "#2a2641",
      primary: "#c2b6f8",
      secondary: "#7565c0",
      accent: "#622df5",
    },
  },
  simple: {
    light: {
      text: "#111111",
      background: "#ffffff",
      primary: "#2f2f2f",
      secondary: "#ececec",
      accent: "#7a7a7a",
    },
    dark: {
      text: "#ffffff",
      background: "#050505",
      primary: "#f3f3f3",
      secondary: "#2c2c2c",
      accent: "#bdbdbd",
    },
  },
  red: {
    light: {
      text: "#222234",
      background: "#f6f5fb",
      primary: "#c53f4f",
      secondary: "#f5c9d2",
      accent: "#f06d86",
    },
    dark: {
      text: "#f8f8fd",
      background: "#2a2641",
      primary: "#f8bac5",
      secondary: "#c06679",
      accent: "#f54268",
    },
  },
  orange: {
    light: {
      text: "#222234",
      background: "#f6f5fb",
      primary: "#c56730",
      secondary: "#f5d8c6",
      accent: "#f09a5d",
    },
    dark: {
      text: "#f8f8fd",
      background: "#2a2641",
      primary: "#f8cfb3",
      secondary: "#c07e52",
      accent: "#f57f2d",
    },
  },
  yellow: {
    light: {
      text: "#222234",
      background: "#f6f5fb",
      primary: "#b89424",
      secondary: "#f4e7b8",
      accent: "#e9be38",
    },
    dark: {
      text: "#f8f8fd",
      background: "#2a2641",
      primary: "#f5e4a3",
      secondary: "#ad9348",
      accent: "#dfb61f",
    },
  },
  green: {
    light: {
      text: "#222234",
      background: "#f6f5fb",
      primary: "#2f9a63",
      secondary: "#c5efd8",
      accent: "#5fd490",
    },
    dark: {
      text: "#f8f8fd",
      background: "#2a2641",
      primary: "#b9f0cd",
      secondary: "#4c9c71",
      accent: "#24d06c",
    },
  },
  blue: {
    light: {
      text: "#222234",
      background: "#f6f5fb",
      primary: "#2f63c5",
      secondary: "#c8d8f5",
      accent: "#5d97f0",
    },
    dark: {
      text: "#f8f8fd",
      background: "#2a2641",
      primary: "#b8cdf8",
      secondary: "#4e72c0",
      accent: "#2d71f5",
    },
  },
  tan: {
    light: {
      text: "#35281f",
      background: "#f7efe4",
      primary: "#a56a3d",
      secondary: "#ecd3bd",
      accent: "#c78e5b",
    },
    dark: {
      text: "#fff7ef",
      background: "#2f241c",
      primary: "#ebc9ac",
      secondary: "#7d5a41",
      accent: "#d89a64",
    },
  },
  grey: {
    light: {
      text: "#22252b",
      background: "#f3f4f6",
      primary: "#5f6672",
      secondary: "#d8dce2",
      accent: "#8d96a4",
    },
    dark: {
      text: "#f5f7fa",
      background: "#191b1f",
      primary: "#d3d8e0",
      secondary: "#4c525c",
      accent: "#9ca5b4",
    },
  },
};

export function resolveAppPalette(theme, colorName) {
  const palette = PALETTES[colorName] ?? PALETTES.purple;
  const base = palette[theme] ?? palette.light;
  const textOnPrimary = getReadableTextColor(base.primary);
  const textOnSecondary = getReadableTextColor(base.secondary);
  const textOnAccent = getReadableTextColor(base.accent);
  const textOnStrong =
    getRelativeLuminance(base.primary) <= getRelativeLuminance(base.accent)
      ? textOnPrimary
      : textOnAccent;

  return {
    ...base,
    panel: base.background,
    "panel-2": base.secondary,
    border: base.primary,
    muted: base.text,
    "muted-strong": base.text,
    shadow: `0 0 0 2px ${base.secondary}`,
    ring: base.accent,
    "accent-soft": base.secondary,
    "text-on-primary": textOnPrimary,
    "text-on-secondary": textOnSecondary,
    "text-on-accent": textOnAccent,
    "text-on-strong": textOnStrong,
  };
}
