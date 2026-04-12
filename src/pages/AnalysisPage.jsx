import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Info, Maximize2, Minimize2, Settings } from "lucide-react";
import BrainPanel from "../components/brain/BrainPanel";
import BrainStageDescription from "../components/brain/BrainStageDescription";
import BrainwaveBox from "../components/eeg/BrainwaveBox";
import ProjectInfoPanel from "../components/layout/ProjectInfoPanel";
import SleepScoreCard from "../components/metrics/SleepScoreCard";
import SleepSummaryPanel from "../components/summary/SleepSummaryPanel";
import TimelinePanel from "../components/timeline/TimelinePanel";
import AnalysisTutorialOverlay from "../components/tutorial/AnalysisTutorialOverlay";
import { useTimelinePlaybackController } from "../components/timeline/useTimelinePlaybackController";
import { buildProfileSleepCycles } from "../features/sleep-engine/utils/buildProfileSleepCycles";
import { computeSleepState } from "../features/sleep-engine/utils/computeSleepState";
import { useStageWaveMixDrift } from "../features/wave-engine/hooks/useStageWaveMixDrift";
import { formatAnswerValue } from "../utils/formatAnswerValue";

const SHORT_LABELS = {
  plannedSleepHours: "Sleep",
  naturalSleepHours: "Natural",
  stressLevel: "Stress",
  roomWakeCount: "Wake-ups",
  sleepConsistency: "Routine",
  environmentLevel: "Environment",
  alcoholLevel: "Alcohol",
  caffeineLevel: "Caffeine",
  cannabisLevel: "Cannabis",
};

const WAVE_DESCRIPTIONS = {
  delta: "Slow, restorative deep-sleep activity.",
  theta: "Transitional sleep and dream-rich activity.",
  alpha: "Calm, relaxed wake-like rhythm.",
  beta: "Fast, alert, active brain rhythm.",
};

function allocateWavePercents(values) {
  const entries = Object.entries(values ?? {}).map(([key, value]) => {
    const scaled = Math.max(0, (value ?? 0) * 100);
    return {
      key,
      floor: Math.floor(scaled),
      remainder: scaled - Math.floor(scaled),
    };
  });

  const floorTotal = entries.reduce((sum, entry) => sum + entry.floor, 0);
  let remaining = Math.max(0, 100 - floorTotal);

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

function PanelHeader({ collapsed, label }) {
  return (
    <div className={`sl-panel-heading ${collapsed ? "is-collapsed" : ""}`.trim()}>
      <span>{label}</span>
    </div>
  );
}

function PanelExpandButton({ active, expandLabel, collapseLabel, onClick, panelClassName = "" }) {
  const Icon = active ? Minimize2 : Maximize2;

  return (
    <button
      aria-label={active ? collapseLabel : expandLabel}
      className={`sl-panel-expand-button ${panelClassName} ${active ? "is-active" : ""}`.trim()}
      onClick={onClick}
      type="button"
    >
      <Icon aria-hidden="true" className="sl-panel-expand-button__icon" size={15} strokeWidth={2.2} />
    </button>
  );
}

export default function AnalysisPage({
  awakeOnlyMinutesOverride,
  appSettings,
  onBack,
  onOpenSettings,
  onUpdateSetting,
  profile,
  questions,
}) {
  const [expandedPanel, setExpandedPanel] = useState("");
  const [showSleepSummary, setShowSleepSummary] = useState(false);
  const [showProjectInfo, setShowProjectInfo] = useState(false);
  const [tutorialActive, setTutorialActive] = useState(false);
  const [tutorialStepIndex, setTutorialStepIndex] = useState(0);
  const [completedTutorialSteps, setCompletedTutorialSteps] = useState({});
  const previousExpandedPanelRef = useRef("");
  const betaInfoRef = useRef(null);
  const bottomTimelineRef = useRef(null);
  const brainPanelRef = useRef(null);
  const playButtonRef = useRef(null);
  const scoreButtonRef = useRef(null);
  const speedControlRef = useRef(null);
  const toolbarRef = useRef(null);
  const timeDisplayRef = useRef(null);
  const topTimelineRef = useRef(null);
  const visualizationPanelRef = useRef(null);
  const zoomControlRef = useRef(null);
  const hasShownSleepSummaryForEndRef = useRef(false);

  const sleepState = useMemo(
    () => computeSleepState(profile.answers, { awakeOnlyMinutes: awakeOnlyMinutesOverride }),
    [awakeOnlyMinutesOverride, profile.answers],
  );
  const { cycles, totalMinutes } = useMemo(
    () => buildProfileSleepCycles(sleepState.timeline),
    [sleepState.timeline],
  );
  const timelineController = useTimelinePlaybackController({
    boundaryAwakeMinutes: sleepState.timeline.boundaryAwakeMinutes,
    displayIndividualTimes: appSettings?.displayIndividualTimes ?? true,
    stages: cycles,
    totalMinutes,
  });
  const currentStage = timelineController.currentStage;
  const timelinePlaying = timelineController.isPlaying;
  const driftedStageProfiles = useStageWaveMixDrift({
    currentStage,
    paused: !timelinePlaying,
    stageProfiles: sleepState.stageProfiles,
  });
  const currentWaveProfile =
    driftedStageProfiles[currentStage] ?? driftedStageProfiles.awake ?? sleepState.stageProfiles.awake;
  const eegRenderState = useMemo(
    () => ({
      mix: currentWaveProfile.values,
      noiseLevel: sleepState.waves.noiseLevel,
      stability: sleepState.waves.signalStability,
      synchronization: sleepState.waves.waveSynchronization,
      paused: !timelinePlaying,
    }),
    [
      currentWaveProfile.values,
      sleepState.waves.noiseLevel,
      sleepState.waves.signalStability,
      sleepState.waves.waveSynchronization,
      timelinePlaying,
    ],
  );
  const waveEntries = useMemo(
    () => {
      const percents = allocateWavePercents(currentWaveProfile.values);

      return [
        {
          label: "Delta",
          description: WAVE_DESCRIPTIONS.delta,
          tone: "delta",
          value: currentWaveProfile.values.delta,
          percent: percents.delta ?? 0,
        },
        {
          label: "Theta",
          description: WAVE_DESCRIPTIONS.theta,
          tone: "theta",
          value: currentWaveProfile.values.theta,
          percent: percents.theta ?? 0,
        },
        {
          label: "Alpha",
          description: WAVE_DESCRIPTIONS.alpha,
          tone: "alpha",
          value: currentWaveProfile.values.alpha,
          percent: percents.alpha ?? 0,
        },
        {
          label: "Beta",
          description: WAVE_DESCRIPTIONS.beta,
          tone: "beta",
          value: currentWaveProfile.values.beta,
          percent: percents.beta ?? 0,
        },
      ].sort((left, right) => right.value - left.value);
    },
    [currentWaveProfile],
  );
  const tutorialSteps = useMemo(() => {
    const visualizationSteps = [];

    if (!timelineController.noSleepMode) {
      visualizationSteps.push({
        body: "This upper timeline gives you the big-picture view from the opening Awake period into each sleep cycle.",
        hint: "Move the top timeline until Cycle 1 is active.",
        id: "top-timeline",
        placementOrder: ["top", "left", "right", "bottom"],
        targetKey: "topTimeline",
        title: "Top timeline",
      });
    }

    visualizationSteps.push(
      {
        body: timelineController.noSleepMode
          ? "Because this profile has no sleep duration, this lower timeline stays Awake the whole time and lets you move through the awake-only session."
          : "This lower timeline shows where Light, Deep, and REM sit inside the currently selected cycle.",
        hint: "Drag the bottom timeline to unlock Next.",
        id: "bottom-timeline",
        placementOrder: ["top", "right", "left", "bottom"],
        targetKey: "bottomTimeline",
        title: "Bottom timeline",
      },
      {
        body: "This control changes playback speed. 1x means real time, so one second here equals one second of simulated time.",
        hint: "Pick a speed to unlock Next.",
        id: "speed",
        placementOrder: ["right", "top", "left", "bottom"],
        targetKey: "speedControl",
        title: "Playback speed",
      },
      {
        body: "You can rotate the brain with your mouse and zoom with either the wheel or the zoom control in the corner.",
        hint: "Rotate or zoom the brain to unlock Next.",
        id: "brain",
        placementOrder: ["left", "right", "bottom", "top"],
        targetKey: "brainPanel",
        title: "Move the brain",
      },
      {
        body: "The colored pulses on the brain represent different types of brainwave activity. We’ll learn which color matches each brainwave type in the next part.",
        hint: "Press play to unlock Next.",
        id: "play",
        placementOrder: ["right", "top", "bottom", "left"],
        targetKey: "playButton",
        title: "Play",
      },
    );

    const homescreenSteps = [
      {
        body: "This icon returns you from fullscreen 3D back to the full analysis layout.",
        hint: "Click the top-right fullscreen icon to continue.",
        cardOffsetX: 300,
        cardOffsetY: -92,
        id: "minimize-visualization",
        placementOrder: ["top", "right", "left", "bottom"],
        targetKey: "visualizationPanel",
        title: "Back to the full view",
      },
      {
        body: "These cards show the live balance of delta, theta, alpha, and beta activity for the current sleep stage.",
        hint: "Hover over the info icon next to Beta to continue.",
        cardOffsetX: 12,
        cardOffsetY: -72,
        id: "brainwaves-info",
        placementOrder: ["right", "top", "bottom", "left"],
        targetKey: "scoreButton",
        title: "Brainwaves",
      },
      {
        body: "This button reveals Sleeply's score animation and factor breakdown.",
        hint: "Press Calculate Sleep Score to continue.",
        cardOffsetY: 86,
        id: "calculate-score",
        placementOrder: ["bottom", "right", "left", "top"],
        targetKey: "scoreButton",
        title: "Calculate sleep score",
      },
      {
        body: "These buttons live at the bottom left: Back returns home, Settings opens your controls, and Project Info gives credits and attribution.",
        hint: "Open Settings to unlock Finish.",
        id: "bottom-buttons",
        placementOrder: ["top", "right", "left", "bottom"],
        targetKey: "toolbar",
        title: "Bottom left controls",
      },
    ];

    const visualizationTotal = visualizationSteps.length;
    const homescreenTotal = homescreenSteps.length;

    return [
      ...visualizationSteps.map((step, index) => ({
        ...step,
        eyebrow: `3D Visualization Tutorial ${index + 1}/${visualizationTotal}`,
      })),
      ...homescreenSteps.map((step, index) => ({
        ...step,
        eyebrow: `Homescreen Tutorial ${index + 1}/${homescreenTotal}`,
      })),
    ];
  }, [timelineController.noSleepMode]);

  useEffect(() => {
    if (!appSettings?.enableTutorial || tutorialActive) {
      return;
    }

    previousExpandedPanelRef.current = expandedPanel;
    timelineController.pausePlayback();
    const frameId = window.requestAnimationFrame(() => {
      setExpandedPanel("visualization");
      setTutorialStepIndex(0);
      setTutorialActive(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [appSettings?.enableTutorial, expandedPanel, timelineController, tutorialActive]);

  useEffect(() => {
    if (tutorialActive) {
      return;
    }

    if (timelineController.hasReachedSleepEnd) {
      if (!hasShownSleepSummaryForEndRef.current) {
        hasShownSleepSummaryForEndRef.current = true;
        const frameId = window.requestAnimationFrame(() => {
          setShowSleepSummary(true);
        });

        return () => window.cancelAnimationFrame(frameId);
      }

      return;
    }

    hasShownSleepSummaryForEndRef.current = false;
  }, [timelineController.hasReachedSleepEnd, tutorialActive]);

  function markTutorialStepComplete(stepId) {
    setCompletedTutorialSteps((current) => {
      if (!stepId || current[stepId]) {
        return current;
      }

      return {
        ...current,
        [stepId]: true,
      };
    });
  }

  const currentTutorialStep = tutorialSteps[tutorialStepIndex];
  const currentTutorialStepComplete = currentTutorialStep
    ? Boolean(completedTutorialSteps[currentTutorialStep.id])
    : false;
  const currentTutorialTargetRef =
    currentTutorialStep?.targetKey === "topTimeline"
      ? topTimelineRef
      : currentTutorialStep?.targetKey === "bottomTimeline"
        ? bottomTimelineRef
        : currentTutorialStep?.targetKey === "speedControl"
          ? speedControlRef
          : currentTutorialStep?.targetKey === "brainPanel"
            ? brainPanelRef
            : currentTutorialStep?.targetKey === "playButton"
              ? playButtonRef
              : currentTutorialStep?.targetKey === "toolbar"
                ? toolbarRef
              : currentTutorialStep?.targetKey === "visualizationPanel"
                ? visualizationPanelRef
                : currentTutorialStep?.targetKey === "betaInfo"
                  ? betaInfoRef
                  : currentTutorialStep?.targetKey === "scoreButton"
                    ? scoreButtonRef
                    : null;

  useEffect(() => {
    if (!tutorialActive || !currentTutorialStep) {
      return;
    }

    if (currentTutorialStep.id === "top-timeline") {
      if (timelineController.activeTopSegmentId === "cycle-1") {
        const frameId = window.requestAnimationFrame(() => {
          markTutorialStepComplete("top-timeline");
        });

        return () => window.cancelAnimationFrame(frameId);
      }

      return;
    }

    if (currentTutorialStep.id === "minimize-visualization") {
      if (expandedPanel !== "visualization") {
        const frameId = window.requestAnimationFrame(() => {
          markTutorialStepComplete("minimize-visualization");
        });

        return () => window.cancelAnimationFrame(frameId);
      }

      return;
    }

    if (currentTutorialStep.id !== "bottom-timeline") {
      return;
    }

    const targetNode = currentTutorialTargetRef?.current;

    if (!targetNode) {
      return;
    }

    let startPoint = null;

    function handlePointerDown(event) {
      startPoint = {
        x: event.clientX,
        y: event.clientY,
      };
    }

    function handlePointerMove(event) {
      if (!startPoint) {
        return;
      }

      const deltaX = Math.abs(event.clientX - startPoint.x);
      const deltaY = Math.abs(event.clientY - startPoint.y);

      if (deltaX + deltaY < 8) {
        return;
      }

      markTutorialStepComplete(currentTutorialStep.id);
      startPoint = null;
    }

    function handlePointerUp() {
      startPoint = null;
    }

    targetNode.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      targetNode.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [
    currentTutorialStep,
    currentTutorialTargetRef,
    expandedPanel,
    timelineController.activeTopSegmentId,
    tutorialActive,
  ]);

  function closeTutorial() {
    setTutorialActive(false);
    setTutorialStepIndex(0);
    setCompletedTutorialSteps({});
    setExpandedPanel(previousExpandedPanelRef.current);
    onUpdateSetting?.("enableTutorial", false);
  }

  function handleTutorialNext() {
    if (!currentTutorialStepComplete) {
      return;
    }

    if (tutorialStepIndex >= tutorialSteps.length - 1) {
      closeTutorial();
      return;
    }

    setTutorialStepIndex((current) => current + 1);
  }

  function handleTutorialSkipStep() {
    if (tutorialStepIndex >= tutorialSteps.length - 1) {
      closeTutorial();
      return;
    }

    setTutorialStepIndex((current) => current + 1);
  }

  function handleTutorialSpeedChange(nextSpeed) {
    timelineController.setPlaybackSpeed(nextSpeed);

    if (tutorialActive && currentTutorialStep?.id === "speed") {
      markTutorialStepComplete("speed");
    }
  }

  function handleTutorialTogglePlayback() {
    timelineController.togglePlayback();

    if (tutorialActive && currentTutorialStep?.id === "play") {
      markTutorialStepComplete("play");
    }
  }

  function handleTutorialBrainInteract() {
    if (tutorialActive && currentTutorialStep?.id === "brain") {
      markTutorialStepComplete("brain");
    }
  }

  function handleTutorialBrainwaveInfoHover() {
    if (tutorialActive && currentTutorialStep?.id === "brainwaves-info") {
      markTutorialStepComplete("brainwaves-info");
    }
  }

  function handleTutorialCalculateScore() {
    if (tutorialActive && currentTutorialStep?.id === "calculate-score") {
      markTutorialStepComplete("calculate-score");
    }
  }

  function handleOpenSettings() {
    if (tutorialActive && currentTutorialStep?.id === "bottom-buttons") {
      markTutorialStepComplete("bottom-buttons");
    }
    timelineController.pausePlayback();
    onOpenSettings();
  }

  function handleToggleProjectInfo() {
    setShowProjectInfo((current) => {
      if (!current) {
        timelineController.pausePlayback();
      }

      return !current;
    });
  }

  return (
    <section
      className="sl-analysis-layout"
      style={{
        gridTemplateColumns:
          expandedPanel === "brainwaves"
            ? "140px minmax(0, 1fr)"
            : expandedPanel === "visualization"
              ? "140px minmax(0, 1fr)"
              : "140px minmax(0, 1fr) 320px",
      }}
    >
      <div className="sl-analysis-left-rail">
        <div
          className="sl-analysis-left-stack"
          style={{
            gridTemplateRows: "minmax(0, 1fr)",
          }}
        >
        <aside className="sl-analysis-panel sl-analysis-panel--left">
          <PanelHeader collapsed={false} label="Sleep Conditions" />
          <div
            className="sl-analysis-panel__body sl-analysis-panel__body--conditions"
            style={{ gridTemplateRows: `repeat(${questions.length}, minmax(0, 1fr))` }}
          >
            {questions.map((question) => (
              <div className="sl-condition-row" key={question.id}>
                <span>{SHORT_LABELS[question.id] ?? question.label}</span>
                <strong>{formatAnswerValue(question, profile.answers[question.id])}</strong>
              </div>
            ))}
          </div>
        </aside>
        </div>
        <div className="sl-analysis-toolbar" ref={toolbarRef}>
          <button
            aria-label="Back"
            className="sl-icon-control sl-icon-control--analysis"
            onClick={onBack}
            type="button"
          >
            <ArrowLeft aria-hidden="true" size={20} strokeWidth={2.2} />
          </button>
          <button
            aria-label="Settings"
            className="sl-icon-control sl-icon-control--analysis"
            onClick={handleOpenSettings}
            type="button"
          >
            <Settings aria-hidden="true" size={20} strokeWidth={2.1} />
          </button>
          <button
            aria-label="Project info"
            className="sl-icon-control sl-icon-control--analysis"
            onClick={handleToggleProjectInfo}
            type="button"
          >
            <Info aria-hidden="true" size={20} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {expandedPanel !== "brainwaves" ? (
        <div
          className="sl-analysis-center"
          style={{
            gridTemplateRows:
              expandedPanel === "visualization"
                ? "minmax(0, 1fr)"
                : "166px minmax(0, 1fr)",
          }}
        >
          {expandedPanel !== "visualization" && (
            <section className="sl-analysis-box sl-analysis-box--top">
              <SleepScoreCard
                calculateButtonRef={scoreButtonRef}
                factors={sleepState.score.scoreFactors}
                onCalculate={handleTutorialCalculateScore}
                score={sleepState.score.overallSleepScore}
              />
            </section>
          )}

          <section
            className={`sl-analysis-box sl-analysis-box--bottom ${
              expandedPanel === "visualization" ? "is-expanded" : ""
            }`.trim()}
            ref={visualizationPanelRef}
          >
            <div className="sl-analysis-box__header sl-analysis-box__header--fixed">
              <span>3D Visualization</span>
              <PanelExpandButton
                active={expandedPanel === "visualization"}
                collapseLabel="Shrink 3D Visualization"
                expandLabel="Expand 3D Visualization"
                onClick={() =>
                  setExpandedPanel((current) =>
                    current === "visualization" ? "" : "visualization",
                  )
                }
              />
            </div>
            <div className="sl-analysis-visualization">
              <BrainStageDescription
                currentStage={currentStage}
                resetKey={`${timelineController.activeTopSegmentId}-${currentStage}`}
                showPopups={(appSettings?.show3DInfoPopups ?? true) && !tutorialActive}
              >
                <BrainPanel
                  currentStage={currentStage}
                  onTutorialBrainInteract={handleTutorialBrainInteract}
                  onTutorialZoomInteract={handleTutorialBrainInteract}
                  panelRef={brainPanelRef}
                  paused={!timelinePlaying}
                  stageProfiles={sleepState.visual3d.stageProfiles}
                  visualState={sleepState.visual3d}
                  zoomControlRef={zoomControlRef}
                />
              </BrainStageDescription>
              <TimelinePanel
                bottomTimelineRef={bottomTimelineRef}
                controller={timelineController}
                onChangeSpeed={handleTutorialSpeedChange}
                onTogglePlayback={handleTutorialTogglePlayback}
                playButtonRef={playButtonRef}
                speedControlRef={speedControlRef}
                timeDisplayRef={timeDisplayRef}
                topTimelineRef={topTimelineRef}
              />
            </div>
          </section>
        </div>
      ) : null}

      {expandedPanel !== "visualization" ? (
        <aside
        className={`sl-analysis-panel sl-analysis-panel--right ${
          expandedPanel === "brainwaves" ? "is-expanded" : ""
        }`.trim()}
      >
        <PanelHeader
          collapsed={false}
          label={`Brainwaves (${currentWaveProfile.panelLabel})`}
        />
        <PanelExpandButton
          active={expandedPanel === "brainwaves"}
          collapseLabel="Shrink Brainwaves"
          expandLabel="Expand Brainwaves"
          onClick={() =>
            setExpandedPanel((current) => (current === "brainwaves" ? "" : "brainwaves"))
          }
          panelClassName="sl-panel-expand-button--panel"
        />
        <div
          className={`sl-analysis-panel__content ${
            expandedPanel === "brainwaves" ? "sl-analysis-panel__content--expanded" : ""
          }`.trim()}
        >
          <div
            className={`sl-wave-stack ${
              expandedPanel === "brainwaves" ? "sl-wave-stack--expanded" : ""
            }`.trim()}
          >
            {waveEntries.map((wave) => (
              <BrainwaveBox
                description={wave.description}
                infoRef={wave.tone === "beta" ? betaInfoRef : undefined}
                key={wave.label}
                label={wave.label}
                onInfoHover={wave.tone === "beta" ? handleTutorialBrainwaveInfoHover : undefined}
                percent={wave.percent}
                renderState={eegRenderState}
                tone={wave.tone}
                value={wave.value}
              />
            ))}
          </div>
          {expandedPanel === "brainwaves" && (
            <TimelinePanel
              bottomTimelineRef={bottomTimelineRef}
              controller={timelineController}
              onChangeSpeed={handleTutorialSpeedChange}
              onTogglePlayback={handleTutorialTogglePlayback}
              playButtonRef={playButtonRef}
              speedControlRef={speedControlRef}
              timeDisplayRef={timeDisplayRef}
              topTimelineRef={topTimelineRef}
            />
          )}
        </div>
      </aside>
      ) : null}
      {tutorialActive && tutorialSteps[tutorialStepIndex] ? (
        <AnalysisTutorialOverlay
          currentStepIndex={tutorialStepIndex}
          onComplete={handleTutorialNext}
          onSkipStep={handleTutorialSkipStep}
          stepCompleted={currentTutorialStepComplete}
          step={tutorialSteps[tutorialStepIndex]}
          targetRef={currentTutorialTargetRef}
          totalSteps={tutorialSteps.length}
        />
      ) : null}
      {showSleepSummary ? (
        <SleepSummaryPanel
          cycles={cycles}
          noSleepMode={timelineController.noSleepMode}
          onClose={() => setShowSleepSummary(false)}
          score={sleepState.score}
          sleepState={sleepState}
        />
      ) : null}
      {showProjectInfo ? <ProjectInfoPanel onClose={() => setShowProjectInfo(false)} /> : null}
    </section>
  );
}
