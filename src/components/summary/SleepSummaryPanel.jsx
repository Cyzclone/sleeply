import Card from "../common/Card";

const STAGE_BAR_META = {
  deep: {
    colorClass: "sl-sleep-summary__bar-fill--deep",
    label: "Deep",
  },
  light: {
    colorClass: "sl-sleep-summary__bar-fill--light",
    label: "Light",
  },
  rem: {
    colorClass: "sl-sleep-summary__bar-fill--rem",
    label: "REM",
  },
};

const WAVE_BAR_META = {
  alpha: {
    colorClass: "sl-sleep-summary__bar-fill--alpha",
    label: "Alpha",
  },
  beta: {
    colorClass: "sl-sleep-summary__bar-fill--beta",
    label: "Beta",
  },
  delta: {
    colorClass: "sl-sleep-summary__bar-fill--delta",
    label: "Delta",
  },
  theta: {
    colorClass: "sl-sleep-summary__bar-fill--theta",
    label: "Theta",
  },
};

const IMPROVEMENT_COPY = {
  alcohol: "Reducing alcohol closer to bedtime would likely protect both continuity and REM sleep.",
  caffeine: "Moving caffeine earlier or lowering the amount would likely make sleep deeper and steadier.",
  cannabis: "A lighter or earlier cannabis effect would help Sleeply keep the night more balanced.",
  drugsCross:
    "Multiple drug effects stacked together here, so reducing them together would likely help the most.",
  naturalSleepNeed:
    "Bringing your actual sleep closer to your natural sleep need would likely improve recovery the most.",
  sleepHours:
    "Adding more sleep time closer to the 8 to 10 hour range would likely improve the whole night the most.",
  environment:
    "A better sleep environment through temperature, noise, or comfort would likely improve continuity.",
  routine: "A steadier routine would likely support smoother cycles and more predictable recovery.",
  stress: "A calmer wind-down and lower stress load would likely make sleep feel more restorative.",
  wakeups: "Reducing overnight wake-ups would likely improve continuity and overall recovery.",
};

function allocatePercents(values) {
  const entries = Object.entries(values ?? {}).map(([key, value]) => {
    const scaled = Math.max(0, (value ?? 0) * 100);
    return {
      floor: Math.floor(scaled),
      key,
      remainder: scaled - Math.floor(scaled),
    };
  });

  let remaining = Math.max(
    0,
    100 - entries.reduce((sum, entry) => sum + entry.floor, 0),
  );

  entries
    .slice()
    .sort((left, right) => {
      if (right.remainder !== left.remainder) {
        return right.remainder - left.remainder;
      }

      return right.floor - left.floor;
    })
    .forEach((entry) => {
      if (remaining <= 0) {
        return;
      }

      entry.floor += 1;
      remaining -= 1;
    });

  return Object.fromEntries(entries.map((entry) => [entry.key, entry.floor]));
}

function formatDurationLabel(minutes) {
  const safeMinutes = Math.max(0, Math.round(minutes ?? 0));
  const hours = Math.floor(safeMinutes / 60);
  const remainder = safeMinutes % 60;

  if (hours && remainder) {
    return `${hours}h ${remainder}m`;
  }

  if (hours) {
    return `${hours}h`;
  }

  return `${remainder}m`;
}

function buildStageMinutes(cycles) {
  const totals = {
    deep: 0,
    light: 0,
    rem: 0,
  };

  cycles.forEach((cycle) => {
    cycle.stages.forEach((stage) => {
      if (stage.key in totals) {
        totals[stage.key] += stage.minutes ?? 0;
      }
    });
  });

  return totals;
}

function buildNightWaveMix({ cycles, noSleepMode, stageProfiles }) {
  if (noSleepMode) {
    return allocatePercents(stageProfiles.awake?.values ?? {});
  }

  const stageMinutes = buildStageMinutes(cycles);
  const totalSleepMinutes = Object.values(stageMinutes).reduce((sum, value) => sum + value, 0);

  if (totalSleepMinutes <= 0) {
    return allocatePercents(stageProfiles.awake?.values ?? {});
  }

  const weightedValues = ["delta", "theta", "alpha", "beta"].reduce(
    (accumulator, waveKey) => ({
      ...accumulator,
      [waveKey]:
        ((stageProfiles.light?.values?.[waveKey] ?? 0) * stageMinutes.light +
          (stageProfiles.deep?.values?.[waveKey] ?? 0) * stageMinutes.deep +
          (stageProfiles.rem?.values?.[waveKey] ?? 0) * stageMinutes.rem) /
        totalSleepMinutes,
    }),
    {},
  );

  return allocatePercents(weightedValues);
}

function buildImprovementItems(scoreFactors, overallSleepScore) {
  const sortedNegativeFactors = scoreFactors
    .filter((factor) => factor.value < 0)
    .sort((left, right) => Math.abs(right.value) - Math.abs(left.value));

  if (!sortedNegativeFactors.length) {
    if (overallSleepScore >= 99) {
      return [
        {
          id: "perfect-night",
          title: "Perfect sleep",
          text: "This simulation landed at essentially perfect sleep, so there are no meaningful areas to improve here.",
        },
      ];
    }

    return [
      {
        id: "steady-night",
        title: "Strong overall night",
        text: "This was already a strong simulation. The main gains now come from protecting time slept and keeping the routine steady.",
      },
    ];
  }

  if (sortedNegativeFactors.length <= 2) {
    const topFactor = sortedNegativeFactors[0];

    return [
      {
        id: topFactor.id,
        title: topFactor.label,
        text: IMPROVEMENT_COPY[topFactor.id] ?? "This factor is still pulling the night downward.",
      },
    ];
  }

  const improvementItems = [];
  let hasCrossDrugItem = false;

  sortedNegativeFactors.forEach((factor) => {
    if (improvementItems.length >= 3) {
      return;
    }

    if (
      hasCrossDrugItem &&
      (factor.id === "alcohol" || factor.id === "caffeine" || factor.id === "cannabis")
    ) {
      return;
    }

    if (factor.id === "drugsCross") {
      hasCrossDrugItem = true;
    }

    improvementItems.push({
      id: factor.id,
      title: factor.label,
      text: IMPROVEMENT_COPY[factor.id] ?? "This factor is still pulling the night downward.",
    });
  });

  return improvementItems;
}

export default function SleepSummaryPanel({
  cycles,
  noSleepMode,
  onClose,
  score,
  sleepState,
}) {
  const stageMinutes = buildStageMinutes(cycles);
  const totalSleepMinutes = Object.values(stageMinutes).reduce((sum, value) => sum + value, 0);
  const stageBars = ["light", "deep", "rem"].map((stageKey) => ({
    ...STAGE_BAR_META[stageKey],
    minutes: stageMinutes[stageKey],
    percent: totalSleepMinutes > 0 ? Math.round((stageMinutes[stageKey] / totalSleepMinutes) * 100) : 0,
    stageKey,
  }));
  const waveMix = buildNightWaveMix({
    cycles,
    noSleepMode,
    stageProfiles: sleepState.stageProfiles,
  });
  const waveBars = ["delta", "theta", "alpha", "beta"].map((waveKey) => ({
    ...WAVE_BAR_META[waveKey],
    percent: waveMix[waveKey] ?? 0,
    waveKey,
  }));
  const improvements = buildImprovementItems(
    score.scoreFactors ?? [],
    score.overallSleepScore ?? 0,
  );
  const keyFacts = [
    {
      label: "Sleep score",
      value: `${score.overallSleepScore}`,
    },
    {
      label: "Total sleep",
      value: noSleepMode ? "0m" : formatDurationLabel(totalSleepMinutes),
    },
    {
      label: "Cycles",
      value: `${cycles.length}`,
    },
  ];

  return (
    <div className="sl-settings-overlay" onClick={onClose} role="presentation">
      <div onClick={(event) => event.stopPropagation()} role="presentation">
        <Card
          className="sl-settings-panel sl-sleep-summary-panel"
          rightSlot={
            <button className="sl-inline-button sl-inline-button--ghost" onClick={onClose} type="button">
              Close
            </button>
          }
          title="Sleep Summary"
        >
          <div className="sl-sleep-summary-panel__content" role="presentation">
          <section className="sl-sleep-summary-panel__section">
            <h4 className="sl-sleep-summary-panel__section-title">Key facts</h4>
            <div className="sl-sleep-summary-panel__facts">
              {keyFacts.map((fact) => (
                <div className="sl-sleep-summary-panel__fact" key={fact.label}>
                  <span>{fact.label}</span>
                  <strong>{fact.value}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="sl-sleep-summary-panel__section">
            <h4 className="sl-sleep-summary-panel__section-title">Sleep stage distribution</h4>
            {noSleepMode ? (
              <p className="sl-sleep-summary-panel__note">
                No sleep stages were simulated during this session because the profile stayed awake throughout.
              </p>
            ) : null}
            <div className="sl-sleep-summary-panel__bars">
              {stageBars.map((bar) => (
                <div className="sl-sleep-summary__bar-row" key={bar.stageKey}>
                  <div className="sl-sleep-summary__bar-meta">
                    <strong>{bar.label}</strong>
                    <span>{formatDurationLabel(bar.minutes)}</span>
                  </div>
                  <div className="sl-sleep-summary__bar-track">
                    <div
                      className={`sl-sleep-summary__bar-fill ${bar.colorClass}`.trim()}
                      style={{ width: `${bar.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="sl-sleep-summary-panel__section">
            <h4 className="sl-sleep-summary-panel__section-title">Brainwave distribution</h4>
            <div className="sl-sleep-summary-panel__bars">
              {waveBars.map((bar) => (
                <div className="sl-sleep-summary__bar-row" key={bar.waveKey}>
                  <div className="sl-sleep-summary__bar-meta">
                    <strong>{bar.label}</strong>
                    <span>{bar.percent}%</span>
                  </div>
                  <div className="sl-sleep-summary__bar-track">
                    <div
                      className={`sl-sleep-summary__bar-fill ${bar.colorClass}`.trim()}
                      style={{ width: `${bar.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="sl-sleep-summary-panel__section">
            <h4 className="sl-sleep-summary-panel__section-title">Areas to improve sleep</h4>
            <div className="sl-sleep-summary-panel__improvements">
              {improvements.map((item) => (
                <article className="sl-sleep-summary-panel__improvement" key={item.id}>
                  <strong>{item.title}</strong>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </section>
          </div>
        </Card>
      </div>
    </div>
  );
}
