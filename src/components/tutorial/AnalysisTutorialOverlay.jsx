import { Lock } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";

const OVERLAY_PADDING = 16;
const HIGHLIGHT_PADDING = 10;
const CARD_GAP = 16;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getRelativeRect(targetNode, containerNode) {
  if (!targetNode || !containerNode) {
    return null;
  }

  const targetRect = targetNode.getBoundingClientRect();
  const containerRect = containerNode.getBoundingClientRect();

  return {
    bottom: targetRect.bottom - containerRect.top,
    centerX: targetRect.left - containerRect.left + targetRect.width / 2,
    centerY: targetRect.top - containerRect.top + targetRect.height / 2,
    height: targetRect.height,
    left: targetRect.left - containerRect.left,
    right: targetRect.right - containerRect.left,
    top: targetRect.top - containerRect.top,
    width: targetRect.width,
  };
}

function rectsOverlap(rectA, rectB, gap = 0) {
  return !(
    rectA.right + gap <= rectB.left ||
    rectA.left >= rectB.right + gap ||
    rectA.bottom + gap <= rectB.top ||
    rectA.top >= rectB.bottom + gap
  );
}

function buildCardRect({
  cardOffsetX = 0,
  cardOffsetY = 0,
  cardSize,
  overlayRect,
  placement,
  targetRect,
}) {
  let left = overlayRect.width / 2 - cardSize.width / 2;
  let top = overlayRect.height / 2 - cardSize.height / 2;

  if (placement === "top") {
    left = targetRect.centerX - cardSize.width / 2;
    top = targetRect.top - cardSize.height - CARD_GAP;
  } else if (placement === "bottom") {
    left = targetRect.centerX - cardSize.width / 2;
    top = targetRect.bottom + CARD_GAP;
  } else if (placement === "left") {
    left = targetRect.left - cardSize.width - CARD_GAP;
    top = targetRect.centerY - cardSize.height / 2;
  } else if (placement === "right") {
    left = targetRect.right + CARD_GAP;
    top = targetRect.centerY - cardSize.height / 2;
  }

  left += cardOffsetX;
  top += cardOffsetY;

  const clampedLeft = clamp(
    left,
    OVERLAY_PADDING,
    overlayRect.width - OVERLAY_PADDING - cardSize.width,
  );
  const clampedTop = clamp(
    top,
    OVERLAY_PADDING,
    overlayRect.height - OVERLAY_PADDING - cardSize.height,
  );

  return {
    bottom: clampedTop + cardSize.height,
    left: clampedLeft,
    right: clampedLeft + cardSize.width,
    top: clampedTop,
  };
}

function resolveTutorialLayout({
  cardNode,
  cardOffsetX,
  cardOffsetY,
  overlayNode,
  placementOrder,
  targetNode,
}) {
  if (!cardNode || !overlayNode || !targetNode) {
    return null;
  }

  const overlayRect = overlayNode.getBoundingClientRect();
  const targetRect = getRelativeRect(targetNode, overlayNode);

  if (!targetRect) {
    return null;
  }

  const highlightRect = {
    bottom: targetRect.bottom + HIGHLIGHT_PADDING,
    left: targetRect.left - HIGHLIGHT_PADDING,
    right: targetRect.right + HIGHLIGHT_PADDING,
    top: targetRect.top - HIGHLIGHT_PADDING,
  };
  const safeHighlightRect = {
    bottom: clamp(highlightRect.bottom, OVERLAY_PADDING, overlayRect.height - OVERLAY_PADDING),
    left: clamp(highlightRect.left, OVERLAY_PADDING, overlayRect.width - OVERLAY_PADDING),
    right: clamp(highlightRect.right, OVERLAY_PADDING, overlayRect.width - OVERLAY_PADDING),
    top: clamp(highlightRect.top, OVERLAY_PADDING, overlayRect.height - OVERLAY_PADDING),
  };
  const cardSize = {
    height: cardNode.offsetHeight || 176,
    width: cardNode.offsetWidth || 248,
  };
  const orderedPlacements = placementOrder?.length
    ? placementOrder
    : ["right", "left", "top", "bottom"];

  const cardRect =
    orderedPlacements
      .map((placement) =>
        buildCardRect({ cardOffsetX, cardOffsetY, cardSize, overlayRect, placement, targetRect }),
      )
      .find((candidateRect) => !rectsOverlap(candidateRect, safeHighlightRect, 12)) ??
    buildCardRect({
      cardOffsetX,
      cardOffsetY,
      cardSize,
      overlayRect,
      placement: orderedPlacements[0],
      targetRect,
    });

  return {
    cardRect,
    highlightRect: safeHighlightRect,
  };
}

export default function AnalysisTutorialOverlay({
  currentStepIndex,
  onComplete,
  onSkipStep,
  stepCompleted,
  step,
  targetRef,
  totalSteps,
}) {
  const overlayRef = useRef(null);
  const cardRef = useRef(null);
  const [layout, setLayout] = useState(null);

  useLayoutEffect(() => {
    function measure() {
      const nextLayout = resolveTutorialLayout({
        cardNode: cardRef.current,
        overlayNode: overlayRef.current,
        cardOffsetX: step?.cardOffsetX,
        cardOffsetY: step?.cardOffsetY,
        placementOrder: step?.placementOrder,
        targetNode: targetRef?.current,
      });

      if (nextLayout) {
        setLayout(nextLayout);
      }
    }

    const frameId = window.requestAnimationFrame(measure);
    const resizeObserver = new ResizeObserver(() => measure());
    const overlayNode = overlayRef.current;
    const cardNode = cardRef.current;
    const targetNode = targetRef?.current;

    if (overlayNode) {
      resizeObserver.observe(overlayNode);
    }

    if (cardNode) {
      resizeObserver.observe(cardNode);
    }

    if (targetNode) {
      resizeObserver.observe(targetNode);
    }

    window.addEventListener("resize", measure);

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [step, targetRef]);

  return (
    <div className="sl-tutorial-overlay" ref={overlayRef}>
      <div
        className="sl-tutorial-card"
        ref={cardRef}
        style={
          layout
            ? {
                left: `${layout.cardRect.left}px`,
                top: `${layout.cardRect.top}px`,
              }
            : undefined
        }
      >
        <span className="sl-tutorial-card__eyebrow">
          {step.eyebrow ?? `Tutorial ${currentStepIndex + 1}/${totalSteps}`}
        </span>
        <h3 className="sl-tutorial-card__title">{step.title}</h3>
        <p className="sl-tutorial-card__body">{step.body}</p>
        {step.hint ? (
          <div
            className={`sl-tutorial-card__statement ${
              stepCompleted ? "is-complete" : ""
            }`.trim()}
          >
            <span className="sl-tutorial-card__statement-text">{step.hint}</span>
          </div>
        ) : null}
        <div className="sl-tutorial-card__actions">
          <button
            className="sl-inline-button sl-inline-button--ghost"
            onClick={onSkipStep}
            type="button"
          >
            Skip
          </button>
          <button
            className={`sl-inline-button ${stepCompleted ? "" : "sl-inline-button--locked"}`.trim()}
            disabled={!stepCompleted}
            onClick={onComplete}
            type="button"
          >
            {!stepCompleted ? <Lock aria-hidden="true" size={13} strokeWidth={2.1} /> : null}
            <span>{currentStepIndex === totalSteps - 1 ? "Finish" : "Next"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
