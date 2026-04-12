import { useEffect, useRef } from "react";
import { EEG_WAVE_PROFILES } from "../../features/wave-engine/constants/waveProfiles";
import { buildCombinedEegSample } from "../../features/wave-engine/utils/buildCombinedEegSample";
import { createWaveGenerator } from "../../features/wave-engine/utils/createWaveGenerator";
import {
  interpolateStageWaveMix,
  normalizeStageWaveMix,
} from "../../features/wave-engine/utils/mixStageWaves";

function createEmptyBuffers(length) {
  return {
    combined: Array.from({ length }, () => 0),
    delta: Array.from({ length }, () => 0),
    theta: Array.from({ length }, () => 0),
    alpha: Array.from({ length }, () => 0),
    beta: Array.from({ length }, () => 0),
  };
}

function pushRollingValue(buffer, nextValue, maxLength) {
  buffer.push(nextValue);
  if (buffer.length > maxLength) {
    buffer.splice(0, buffer.length - maxLength);
  }
}

function resizeCanvasToDisplaySize(canvas) {
  const pixelRatio = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.round(canvas.clientWidth * pixelRatio));
  const height = Math.max(1, Math.round(canvas.clientHeight * pixelRatio));

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  return {
    pixelRatio,
    width: canvas.clientWidth,
    height: canvas.clientHeight,
  };
}

function drawTrace(context, values, color, width, height, options = {}) {
  if (values.length < 2) {
    return;
  }

  const {
    lineWidth = 1.6,
    opacity = 1,
    offset = 0,
    scale = 1,
    shadowBlur = 0,
  } = options;
  const centerY = height / 2 + offset;
  const scaleY = height * 0.16 * scale;
  const stepX = width / Math.max(values.length - 1, 1);

  context.beginPath();
  const firstY = centerY - values[0] * scaleY;
  context.moveTo(0, firstY);

  for (let index = 1; index < values.length; index += 1) {
    const previousX = (index - 1) * stepX;
    const previousY = centerY - values[index - 1] * scaleY;
    const currentX = index * stepX;
    const currentY = centerY - values[index] * scaleY;
    const midpointX = (previousX + currentX) / 2;
    const midpointY = (previousY + currentY) / 2;

    context.quadraticCurveTo(previousX, previousY, midpointX, midpointY);
  }

  const lastIndex = values.length - 1;
  context.lineTo(lastIndex * stepX, centerY - values[lastIndex] * scaleY);

  context.lineWidth = lineWidth;
  context.strokeStyle = color;
  context.globalAlpha = opacity;
  context.shadowBlur = shadowBlur;
  context.stroke();
  context.globalAlpha = 1;
  context.shadowBlur = 0;
}

function drawComponentMode(context, buffers, emphasis, width, height) {
  const profile = EEG_WAVE_PROFILES[emphasis];
  drawTrace(context, buffers[emphasis], profile.color, width, height, {
    lineWidth: 2.4,
    opacity: 0.98,
    scale: 1.7,
    shadowBlur: 4,
  });
}

function drawCombinedMode(context, buffers, emphasis, width, height, textColor) {
  Object.values(EEG_WAVE_PROFILES).forEach((profile) => {
    drawTrace(context, buffers[profile.type], profile.color, width, height, {
      lineWidth: profile.type === emphasis ? 1.6 : 1.05,
      opacity: profile.type === emphasis ? 0.36 : 0.14,
      scale: profile.type === emphasis ? 1.15 : 0.95,
    });
  });

  drawTrace(context, buffers.combined, textColor, width, height, {
    lineWidth: 2.35,
    opacity: 0.98,
    scale: 1.08,
    shadowBlur: 7,
  });
}

function drawStackedMode(context, buffers, width, height) {
  const offsets = {
    delta: -height * 0.24,
    theta: -height * 0.08,
    alpha: height * 0.08,
    beta: height * 0.24,
  };

  Object.values(EEG_WAVE_PROFILES).forEach((profile) => {
    drawTrace(context, buffers[profile.type], profile.color, width, height, {
      lineWidth: 1.65,
      opacity: 0.95,
      offset: offsets[profile.type],
      scale: 0.62,
    });
  });
}

function drawWaveFrame(canvas, buffers, mode, emphasis, textColor) {
  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  const { pixelRatio, width, height } = resizeCanvasToDisplaySize(canvas);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, width, height);
  context.lineCap = "round";
  context.lineJoin = "round";

  if (mode === "stacked") {
    drawStackedMode(context, buffers, width, height);
    return;
  }

  if (mode === "combined") {
    drawCombinedMode(context, buffers, emphasis, width, height, textColor);
    return;
  }

  drawComponentMode(context, buffers, emphasis, width, height);
}

export function useEegBuffer({
  debugMode = "component",
  diagnosticsEnabled = false,
  emphasis,
  renderState,
}) {
  const canvasRef = useRef(null);
  const buffersRef = useRef(createEmptyBuffers(360));
  const mixRef = useRef(normalizeStageWaveMix(renderState.mix));
  const generatorsRef = useRef({
    delta: createWaveGenerator(EEG_WAVE_PROFILES.delta, 13.2),
    theta: createWaveGenerator(EEG_WAVE_PROFILES.theta, 41.8),
    alpha: createWaveGenerator(EEG_WAVE_PROFILES.alpha, 77.1),
    beta: createWaveGenerator(EEG_WAVE_PROFILES.beta, 105.4),
  });
  const timeRef = useRef(0);
  const diagnosticsTimerRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    let frameId = 0;
    let previousTime = performance.now();
    let sampleCarry = 0;

    function tick(now) {
      const elapsedSeconds = Math.min((now - previousTime) / 1000, 0.04);
      previousTime = now;

      const targetMix = normalizeStageWaveMix(renderState.mix);
      const smoothing = 1 - Math.exp(-elapsedSeconds * 4.2);
      mixRef.current = interpolateStageWaveMix(mixRef.current, targetMix, smoothing);

      if (!renderState.paused) {
        timeRef.current += elapsedSeconds;
        diagnosticsTimerRef.current += elapsedSeconds;

        const width = canvas.clientWidth || 240;
        const nextBufferLength = Math.max(360, Math.round(width * 2.2));
        const sampleRate = Math.max(260, Math.round(width * 1.85));
        const sampleInterval = 1 / sampleRate;
        sampleCarry += elapsedSeconds;
        let latestDiagnostics = null;

        while (sampleCarry >= sampleInterval) {
          sampleCarry -= sampleInterval;
          const sampleTime = timeRef.current - sampleCarry;
          const sample = buildCombinedEegSample(
            generatorsRef.current,
            mixRef.current,
            sampleInterval,
            sampleTime,
            renderState,
          );

          latestDiagnostics = sample.diagnostics;
          if (!buffersRef.current.combined.length || buffersRef.current.combined.every((value) => value === 0)) {
            buffersRef.current.combined = Array.from({ length: nextBufferLength }, () => sample.combined);
            buffersRef.current.delta = Array.from({ length: nextBufferLength }, () => sample.components.delta);
            buffersRef.current.theta = Array.from({ length: nextBufferLength }, () => sample.components.theta);
            buffersRef.current.alpha = Array.from({ length: nextBufferLength }, () => sample.components.alpha);
            buffersRef.current.beta = Array.from({ length: nextBufferLength }, () => sample.components.beta);
          } else {
            pushRollingValue(buffersRef.current.combined, sample.combined, nextBufferLength);
            pushRollingValue(buffersRef.current.delta, sample.components.delta, nextBufferLength);
            pushRollingValue(buffersRef.current.theta, sample.components.theta, nextBufferLength);
            pushRollingValue(buffersRef.current.alpha, sample.components.alpha, nextBufferLength);
            pushRollingValue(buffersRef.current.beta, sample.components.beta, nextBufferLength);
          }
        }

        if (
          diagnosticsEnabled &&
          latestDiagnostics &&
          diagnosticsTimerRef.current >= 1
        ) {
          diagnosticsTimerRef.current = 0;
          console.log("[Sleeply EEG diagnostics]", {
            mode: debugMode,
            mix: {
              delta: Number(mixRef.current.delta.toFixed(3)),
              theta: Number(mixRef.current.theta.toFixed(3)),
              alpha: Number(mixRef.current.alpha.toFixed(3)),
              beta: Number(mixRef.current.beta.toFixed(3)),
            },
            diagnostics: Object.fromEntries(
              Object.entries(latestDiagnostics).map(([key, value]) => [
                key,
                {
                  effectiveFrequency: Number(value.effectiveFrequency.toFixed(2)),
                  phase: Number(value.phase.toFixed(2)),
                  amplitudeEnvelope: Number(value.amplitudeEnvelope.toFixed(3)),
                  jitter: Number(value.jitter.toFixed(3)),
                },
              ]),
            ),
          });
        }
      }

      const textColor =
        getComputedStyle(canvas).getPropertyValue("--text").trim() || "#222234";
      drawWaveFrame(canvas, buffersRef.current, debugMode, emphasis, textColor);
      frameId = window.requestAnimationFrame(tick);
    }

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [debugMode, diagnosticsEnabled, emphasis, renderState]);

  return canvasRef;
}
