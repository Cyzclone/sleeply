export const STAGE_DESCRIPTION_PROFILES = {
  awake: {
    items: [
      { label: "Beta + alpha", text: "Orange and green pulses lead.", tone: "beta" },
      { label: "Whole brain", text: "Activity stays broad, slightly posterior.", tone: "neutral" },
      { label: "Fast timing", text: "Small pulses, little clustering.", tone: "neutral" },
    ],
    summary: "Active, alert, and organized across the brain.",
    title: "Awake",
  },
  deep: {
    items: [
      { label: "Delta lead", text: "Blue pulses dominate.", tone: "delta" },
      { label: "Frontal bias", text: "Front regions stay strongest.", tone: "neutral" },
      { label: "Slow rhythm", text: "Larger, synchronized patterns.", tone: "neutral" },
    ],
    summary: "Highly synchronized and restorative, with slow global activity.",
    title: "Deep Sleep",
  },
  light: {
    items: [
      { label: "Theta rise", text: "Pink pulses become more common.", tone: "theta" },
      { label: "Central lean", text: "Slight focus through the middle.", tone: "neutral" },
      { label: "Soft drift", text: "Order loosens without going chaotic.", tone: "neutral" },
    ],
    summary: "Transitioning into sleep with slower, softer structure.",
    title: "Light Sleep",
  },
  rem: {
    items: [
      { label: "Theta + beta", text: "Pink and orange pulses stand out.", tone: "theta" },
      { label: "Posterior shift", text: "Temporal and back regions grow stronger.", tone: "neutral" },
      { label: "Hippocampus theta", text: "Look for stronger pink activity near the temporal memory system.", tone: "theta" },
    ],
    summary: "Internally active and dream-heavy, with unstable order.",
    title: "REM Sleep",
  },
};
