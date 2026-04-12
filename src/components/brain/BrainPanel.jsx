// The 3D renderer is a pulse-based visualization on the brain surface, not the 2D waveform renderer.
import { useCallback, useState } from "react";
import BrainCanvas from "./BrainCanvas";

const MIN_ZOOM_DISTANCE = 1.45;
const MAX_ZOOM_DISTANCE = 9;

export default function BrainPanel({
  currentStage,
  onTutorialBrainInteract,
  onTutorialZoomInteract,
  panelRef,
  paused,
  stageProfiles,
  visualState,
  zoomControlRef,
}) {
  const [zoomDistance, setZoomDistance] = useState(3.95);
  const [rotationRequest, setRotationRequest] = useState(null);
  const handleZoomChange = useCallback((nextZoomDistance) => {
    setZoomDistance((currentZoomDistance) =>
      Math.abs(currentZoomDistance - nextZoomDistance) < 0.001
        ? currentZoomDistance
        : nextZoomDistance,
    );
  }, []);
  const sliderValue = MAX_ZOOM_DISTANCE + MIN_ZOOM_DISTANCE - zoomDistance;

  function handleKeyDown(event) {
    const keyToRotation = {
      ArrowDown: { horizontal: 0, vertical: -0.16 },
      ArrowLeft: { horizontal: 0.18, vertical: 0 },
      ArrowRight: { horizontal: -0.18, vertical: 0 },
      ArrowUp: { horizontal: 0, vertical: 0.16 },
    };
    const nextRotation = keyToRotation[event.key];

    if (!nextRotation) {
      return;
    }

    event.preventDefault();
    setRotationRequest({
      ...nextRotation,
      token: `${event.key}-${Date.now()}`,
    });
  }

  function handlePointerDown(event) {
    event.currentTarget.focus();

    if (!onTutorialBrainInteract) {
      return;
    }

    const startX = event.clientX;
    const startY = event.clientY;

    function handleMove(moveEvent) {
      const deltaX = Math.abs(moveEvent.clientX - startX);
      const deltaY = Math.abs(moveEvent.clientY - startY);

      if (deltaX + deltaY < 10) {
        return;
      }

      onTutorialBrainInteract();
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    }

    function handleUp() {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    }

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  }

  return (
    <div
      aria-label="3D brain visualization"
      className="sl-brain-panel"
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onWheel={onTutorialZoomInteract}
      ref={panelRef}
      tabIndex={0}
    >
      <BrainCanvas
        currentStage={currentStage}
        debugAnchors={false}
        onZoomChange={handleZoomChange}
        paused={paused}
        rotationRequest={rotationRequest}
        stageProfiles={stageProfiles}
        visualState={visualState}
        zoomDistance={zoomDistance}
      />
      <div
        aria-label="3D zoom"
        className="sl-brain-panel__zoom"
        ref={zoomControlRef}
        role="group"
      >
        <span className="sl-brain-panel__zoom-label">Zoom</span>
        <input
          aria-label="Adjust 3D zoom"
          className="sl-brain-panel__zoom-slider"
          max={MAX_ZOOM_DISTANCE}
          min={MIN_ZOOM_DISTANCE}
          onChange={(event) =>
            {
              handleZoomChange(
                MAX_ZOOM_DISTANCE + MIN_ZOOM_DISTANCE - Number(event.target.value),
              );
              onTutorialZoomInteract?.();
            }
          }
          step="0.01"
          type="range"
          value={sliderValue}
        />
      </div>
    </div>
  );
}
