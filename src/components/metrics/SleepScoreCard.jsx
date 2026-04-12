import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

function formatSignedScore(value) {
  if (value > 0) {
    return `+${value}`;
  }

  return `${value}`;
}

const MAX_FACTORS = 10;
const EDGE_INSET = 14;
const TOP_INSET = 12;
const RIGHT_TOP_INSET = 20;
const BOTTOM_INSET = 10;
const RING_CLEARANCE = 18;
const MIN_SLOT_WIDTH = 78;
const MIN_SLOT_HEIGHT = 34;
const HORIZONTAL_SLOT_GAP = 8;
const VERTICAL_SLOT_GAP = 6;
const SLOT_JITTER = 10;
const SCORE_ANIMATION_MS = 3800;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function easeOutQuart(value) {
  return 1 - Math.pow(1 - value, 4);
}

function shuffleArray(values) {
  const next = [...values];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
}

function buildLabelLines(label) {
  const normalized = String(label ?? "").trim();
  const words = normalized.split(/\s+/).filter(Boolean);

  if (words.length <= 1) {
    return [normalized];
  }

  if (words.length === 2) {
    return words;
  }

  const splitIndex = Math.ceil(words.length / 2);

  return [
    words.slice(0, splitIndex).join(" "),
    words.slice(splitIndex).join(" "),
  ].filter(Boolean);
}

function buildPlacementProfile(factors) {
  const limitedFactors = factors.slice(0, MAX_FACTORS);
  const shuffledIds = shuffleArray(limitedFactors.map((factor) => factor.id));
  const extraOnLeft = Math.random() >= 0.5;
  const leftCount =
    Math.floor(limitedFactors.length / 2) + (limitedFactors.length % 2 && extraOnLeft ? 1 : 0);
  const leftIds = shuffledIds.slice(0, leftCount);

  return Object.fromEntries(
    limitedFactors.map((factor) => [
      factor.id,
      {
        delayMs: 420 + Math.round(Math.random() * 760),
        side: leftIds.includes(factor.id) ? "left" : "right",
        xJitter: Math.round(Math.random() * SLOT_JITTER),
        yWeights: Array.from({ length: 6 }, () => 0.4 + Math.random()),
      },
    ]),
  );
}

function buildSideRect({ orbitRect, ringRect, side }) {
  const ringLeft = ringRect.left - orbitRect.left;
  const ringRight = ringRect.right - orbitRect.left;
  const topInset = side === "right" ? RIGHT_TOP_INSET : TOP_INSET;

  if (side === "left") {
    return {
      bottom: orbitRect.height - BOTTOM_INSET,
      left: EDGE_INSET,
      right: ringLeft - RING_CLEARANCE,
      top: topInset,
    };
  }

  return {
    bottom: orbitRect.height - BOTTOM_INSET,
    left: ringRight + RING_CLEARANCE,
    right: orbitRect.width - EDGE_INSET,
    top: topInset,
  };
}

function resolveColumnCount({ factorCount, sideHeight, sideWidth }) {
  const maxColumns = Math.min(3, factorCount);

  for (let columnCount = maxColumns; columnCount >= 1; columnCount -= 1) {
    const rowCount = Math.ceil(factorCount / columnCount);
    const slotWidth =
      (sideWidth - HORIZONTAL_SLOT_GAP * (columnCount - 1)) / columnCount;
    const slotHeight =
      (sideHeight - VERTICAL_SLOT_GAP * (rowCount - 1)) / rowCount;

    if (slotWidth >= MIN_SLOT_WIDTH && slotHeight >= MIN_SLOT_HEIGHT) {
      return columnCount;
    }
  }

  return Math.min(2, factorCount);
}

function layoutSideFactors({
  centerX,
  centerY,
  factors,
  orbitRect,
  placementProfile,
  ringRect,
  side,
}) {
  if (!factors.length) {
    return {};
  }

  const sideRect = buildSideRect({ orbitRect, ringRect, side });
  const sideWidth = sideRect.right - sideRect.left;
  const sideHeight = sideRect.bottom - sideRect.top;

  if (sideWidth <= 32 || sideHeight <= 32) {
    return Object.fromEntries(
      factors.map((factor) => [
        factor.id,
        {
          hidden: true,
          left: "0px",
          top: "0px",
        },
      ]),
    );
  }

  const resolved = {};
  const factorCount = factors.length;
  const columnCount = resolveColumnCount({
    factorCount,
    sideHeight,
    sideWidth,
  });
  const rowCount = Math.max(1, Math.ceil(factorCount / columnCount));
  const slotWidth = Math.max(
    MIN_SLOT_WIDTH,
    (sideWidth - HORIZONTAL_SLOT_GAP * (columnCount - 1)) / columnCount,
  );
  const slotHeight = Math.max(
    MIN_SLOT_HEIGHT,
    (sideHeight - VERTICAL_SLOT_GAP * (rowCount - 1)) / rowCount,
  );
  const slots = shuffleArray(
    Array.from({ length: rowCount * columnCount }, (_, index) => ({
      columnIndex: index % columnCount,
      rowIndex: Math.floor(index / columnCount),
    })),
  );

  factors.forEach((factor, factorIndex) => {
    const placementHint = placementProfile[factor.id];
    const slot = slots[factorIndex];

    if (!slot) {
      resolved[factor.id] = {
        hidden: true,
        left: "0px",
        top: "0px",
      };
      return;
    }

    const slotLeft =
      sideRect.left + slot.columnIndex * (slotWidth + HORIZONTAL_SLOT_GAP);
    const slotTop =
      sideRect.top + slot.rowIndex * (slotHeight + VERTICAL_SLOT_GAP);
    const horizontalJitter = (Math.random() - 0.5) * 2 * Math.min(SLOT_JITTER, 4);
    const verticalJitter = (Math.random() - 0.5) * 2 * Math.min(SLOT_JITTER, 3);
    const finalCenterX = clamp(
      slotLeft + slotWidth / 2 + horizontalJitter,
      sideRect.left + slotWidth / 2,
      sideRect.right - slotWidth / 2,
    );
    const finalCenterY = clamp(
      slotTop + slotHeight / 2 + verticalJitter,
      sideRect.top + slotHeight / 2,
      sideRect.bottom - slotHeight / 2,
    );
    resolved[factor.id] = {
      delayMs: placementHint?.delayMs ?? 0,
      enterX: `${centerX - finalCenterX}px`,
      enterY: `${centerY - finalCenterY}px`,
      hidden: false,
      left: `${finalCenterX}px`,
      top: `${finalCenterY}px`,
      width: `${Math.min(Math.max(factor.width, MIN_SLOT_WIDTH), slotWidth)}px`,
    };
  });

  return resolved;
}

function resolveFactorPositions({ factorMeasurements, orbitRect, placementProfile, ringRect }) {
  if (!orbitRect || !ringRect) {
    return {};
  }

  const centerX = ringRect.left - orbitRect.left + ringRect.width / 2;
  const centerY = ringRect.top - orbitRect.top + ringRect.height / 2;
  const limitedFactors = factorMeasurements.slice(0, MAX_FACTORS);
  const leftFactors = [];
  const rightFactors = [];

  limitedFactors.forEach((factor) => {
    if (placementProfile[factor.id]?.side === "right") {
      rightFactors.push(factor);
      return;
    }

    leftFactors.push(factor);
  });

  return {
    ...layoutSideFactors({
      factors: leftFactors,
      centerX,
      centerY,
      orbitRect,
      placementProfile,
      ringRect,
      side: "left",
    }),
    ...layoutSideFactors({
      factors: rightFactors,
      centerX,
      centerY,
      orbitRect,
      placementProfile,
      ringRect,
      side: "right",
    }),
  };
}

export default function SleepScoreCard({ calculateButtonRef, factors = [], onCalculate, score }) {
  const orbitRef = useRef(null);
  const ringRef = useRef(null);
  const factorRefs = useRef({});
  const [factorPositions, setFactorPositions] = useState({});
  const [displayScore, setDisplayScore] = useState(0);
  const [revealState, setRevealState] = useState("idle");
  const placementProfile = useMemo(() => buildPlacementProfile(factors), [factors]);
  const factorSignature = useMemo(
    () => `${score}:${factors.map((factor) => `${factor.id}:${factor.value}`).join("|")}`,
    [factors, score],
  );

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setRevealState("idle");
      setDisplayScore(0);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [factorSignature]);

  useEffect(() => {
    if (revealState !== "animating") {
      return undefined;
    }

    const startScore = Math.round(Math.random() * 100);
    const startTime = performance.now();
    let frameId = 0;

    function tick(now) {
      const progress = clamp((now - startTime) / SCORE_ANIMATION_MS, 0, 1);
      const eased = easeOutQuart(progress);
      const baseValue = startScore + (score - startScore) * eased;
      const waveA = Math.sin(progress * Math.PI * 8.2 + 0.3);
      const waveB = Math.cos(progress * Math.PI * 4.1 + 0.8);
      const noiseAmplitude = (1 - eased) * 18;
      const animatedValue = clamp(
        Math.round(baseValue + waveA * noiseAmplitude + waveB * noiseAmplitude * 0.42),
        0,
        100,
      );

      setDisplayScore(progress >= 1 ? score : animatedValue);

      if (progress >= 1) {
        setRevealState("revealed");
        return;
      }

      frameId = window.requestAnimationFrame(tick);
    }

    frameId = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(frameId);
  }, [revealState, score]);

  function handleCalculate() {
    if (revealState !== "idle") {
      return;
    }

    setRevealState("animating");
    onCalculate?.();
  }

  useLayoutEffect(() => {
    function measure() {
      if (!orbitRef.current || !ringRef.current) {
        return;
      }

      const factorMeasurements = factors
        .slice(0, MAX_FACTORS)
        .map((factor) => {
          const node = factorRefs.current[factor.id];
          const measuredWidth = Math.max(
            node?.offsetWidth ?? 0,
            node?.scrollWidth ?? 0,
            68,
          );
          const width = Math.max(MIN_SLOT_WIDTH, measuredWidth + 2);
          const height = Math.max(MIN_SLOT_HEIGHT, node?.offsetHeight ?? 34);

          return {
            height,
            id: factor.id,
            width,
          };
        });

      setFactorPositions(
        resolveFactorPositions({
          factorMeasurements,
          orbitRect: orbitRef.current.getBoundingClientRect(),
          placementProfile,
          ringRect: ringRef.current.getBoundingClientRect(),
        }),
      );
    }

    measure();

    const orbitNode = orbitRef.current;
    const ringNode = ringRef.current;
    const resizeObserver = new ResizeObserver(() => measure());

    if (orbitNode) {
      resizeObserver.observe(orbitNode);
    }

    if (ringNode) {
      resizeObserver.observe(ringNode);
    }

    factors.slice(0, MAX_FACTORS).forEach((factor) => {
      const node = factorRefs.current[factor.id];
      if (node) {
        resizeObserver.observe(node);
      }
    });

    window.addEventListener("resize", measure);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [factors, placementProfile, score]);

  return (
    <section className="sl-score-card">
      <div
        className={`sl-score-card__info-wrap ${
          revealState === "idle" ? "is-hidden" : ""
        }`.trim()}
      >
        <span aria-hidden="true" className="sl-score-card__info">
          i
        </span>
        <div className="sl-score-card__tooltip">
          Sleep Score is calculated through Sleeply&apos;s sleep algorithim, the numbers
          displayed are only some of the sleep factors.
        </div>
      </div>
      <div className="sl-score-orbit" ref={orbitRef}>
        {revealState === "idle" ? (
          <button
            className="sl-button sl-button--secondary sl-score-card__cta"
            onClick={handleCalculate}
            ref={calculateButtonRef}
            type="button"
          >
            Calculate Sleep Score
          </button>
        ) : null}
        {factors.slice(0, MAX_FACTORS).map((factor) => (
          <div
            className={`sl-score-factor ${
              factor.value === 0
                ? "is-neutral"
                : factor.value > 0
                  ? "is-positive"
                  : "is-negative"
            } ${
              revealState === "idle" || factorPositions[factor.id]?.hidden
                ? "is-idle"
                : "is-visible"
            }`.trim()}
            key={factor.id}
            ref={(node) => {
              factorRefs.current[factor.id] = node;
            }}
            style={
              factorPositions[factor.id]
                ? factorPositions[factor.id].hidden
                  ? { left: 0, opacity: 0, top: 0 }
                  : {
                      ...factorPositions[factor.id],
                      "--sl-factor-delay": `${factorPositions[factor.id].delayMs ?? 0}ms`,
                      "--sl-factor-enter-x": factorPositions[factor.id].enterX ?? "0px",
                      "--sl-factor-enter-y": factorPositions[factor.id].enterY ?? "0px",
                    }
                : { left: 0, opacity: 0, top: 0 }
            }
          >
            <span className="sl-score-factor__label">
              {buildLabelLines(factor.label).map((line) => (
                <span className="sl-score-factor__label-line" key={`${factor.id}-${line}`}>
                  {line}
                </span>
              ))}
            </span>
            <strong className="sl-score-factor__value">
              {formatSignedScore(factor.value)}
            </strong>
          </div>
        ))}
        <div
          className={`sl-score-ring ${
            revealState === "idle" ? "is-idle" : "is-visible"
          }`.trim()}
          ref={ringRef}
        >
          <div className="sl-score-ring__inner">
            <span>Sleep Score</span>
            <strong>{displayScore}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
