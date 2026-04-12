function clamp01(value) {
  return Math.max(0, Math.min(value, 1));
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function createSeededRandom(seed) {
  let state = Math.floor(seed * 100000) >>> 0;

  return function nextRandom() {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function pickBetween(random, min, max) {
  return lerp(min, max, random());
}

function retarget(state, profile, random, key) {
  if (key === "amplitude") {
    state.amplitudeTarget = pickBetween(
      random,
      profile.amplitudeTargetRange[0],
      profile.amplitudeTargetRange[1],
    );
    state.amplitudeDuration = pickBetween(
      random,
      profile.amplitudeRetargetRange[0],
      profile.amplitudeRetargetRange[1],
    );
    state.amplitudeTimer = state.amplitudeDuration;
    return;
  }

  if (key === "frequency") {
    state.frequencyTarget = pickBetween(
      random,
      profile.frequencyOffsetRange[0],
      profile.frequencyOffsetRange[1],
    );
    state.frequencyDuration = pickBetween(
      random,
      profile.frequencyRetargetRange[0],
      profile.frequencyRetargetRange[1],
    );
    state.frequencyTimer = state.frequencyDuration;
    return;
  }

  state.localRhythmTarget = pickBetween(
    random,
    profile.localRhythmRange[0],
    profile.localRhythmRange[1],
  );
  state.localRhythmDuration = pickBetween(
    random,
    profile.localRhythmRetargetRange[0],
    profile.localRhythmRetargetRange[1],
  );
  state.localRhythmTimer = state.localRhythmDuration;
}

export function createWaveGenerator(profile, seed) {
  const random = createSeededRandom(seed);
  const baseFrequency = lerp(profile.minFreqHz, profile.maxFreqHz, profile.identityCenter);
  const state = {
    phase: random() * Math.PI * 2,
    currentCycleIndex: -1,
    currentPeakIndex: -1,
    peakScale: 1,
    periodScale: 1,
    amplitudeValue: pickBetween(
      random,
      profile.amplitudeTargetRange[0],
      profile.amplitudeTargetRange[1],
    ),
    amplitudeTarget: 1,
    amplitudeTimer: 0,
    amplitudeDuration: 1,
    frequencyOffsetValue: pickBetween(
      random,
      profile.frequencyOffsetRange[0],
      profile.frequencyOffsetRange[1],
    ),
    frequencyTarget: 0,
    frequencyTimer: 0,
    frequencyDuration: 1,
    localRhythmValue: pickBetween(
      random,
      profile.localRhythmRange[0],
      profile.localRhythmRange[1],
    ),
    localRhythmTarget: 0,
    localRhythmTimer: 0,
    localRhythmDuration: 1,
    slowPhase: random() * Math.PI * 2,
    microPhase: random() * Math.PI * 2,
    eventBoost: 0,
    eventTimer: 0,
    lastDiagnostics: {
      amplitudeEnvelope: 0,
      effectiveFrequency: baseFrequency,
      jitter: 0,
      phase: 0,
      periodScale: 1,
    },
  };

  const assignPeakScale = () => {
    const useRarePeak =
      profile.rarePeakChance > 0 && random() < profile.rarePeakChance;

    state.peakScale = useRarePeak
      ? pickBetween(
          random,
          profile.rarePeakScaleRange[0],
          profile.rarePeakScaleRange[1],
        )
      : pickBetween(
          random,
          profile.peakScaleRange[0],
          profile.peakScaleRange[1],
        );
  };

  const assignPeriodScale = () => {
    const useRarePeriod =
      profile.rarePeriodChance > 0 && random() < profile.rarePeriodChance;

    state.periodScale = useRarePeriod
      ? pickBetween(
          random,
          profile.rarePeriodScaleRange[0],
          profile.rarePeriodScaleRange[1],
        )
      : pickBetween(
          random,
          profile.periodScaleRange[0],
          profile.periodScaleRange[1],
        );
  };

  retarget(state, profile, random, "amplitude");
  retarget(state, profile, random, "frequency");
  retarget(state, profile, random, "localRhythm");
  assignPeakScale();
  assignPeriodScale();

  return {
    type: profile.type,
    color: profile.color,
    getDiagnostics() {
      return state.lastDiagnostics;
    },
    sample(dt, environment) {
      const stability = environment?.stability ?? 0.6;
      const synchronization = environment?.synchronization ?? 0.6;
      const noiseLevel = environment?.noiseLevel ?? 0.2;

      state.amplitudeTimer -= dt;
      state.frequencyTimer -= dt;
      state.localRhythmTimer -= dt;

      if (state.amplitudeTimer <= 0) {
        retarget(state, profile, random, "amplitude");
      }

      if (state.frequencyTimer <= 0) {
        retarget(state, profile, random, "frequency");
      }

      if (state.localRhythmTimer <= 0) {
        retarget(state, profile, random, "localRhythm");
      }

      state.amplitudeValue = lerp(
        state.amplitudeValue,
        state.amplitudeTarget,
        clamp01(dt / Math.max(state.amplitudeDuration, 0.001)),
      );
      state.frequencyOffsetValue = lerp(
        state.frequencyOffsetValue,
        state.frequencyTarget,
        clamp01(dt / Math.max(state.frequencyDuration, 0.001)),
      );
      state.localRhythmValue = lerp(
        state.localRhythmValue,
        state.localRhythmTarget,
        clamp01(dt / Math.max(state.localRhythmDuration, 0.001)),
      );

      state.slowPhase += dt * (0.45 + random() * 0.08);
      state.microPhase += dt * (3.6 + random() * 0.4);

      if (profile.eventChancePerSecond > 0) {
        if (state.eventTimer > 0) {
          state.eventTimer = Math.max(0, state.eventTimer - dt);
          state.eventBoost = Math.max(0, state.eventBoost - dt * profile.eventDecay);
        } else if (random() < profile.eventChancePerSecond * dt) {
          state.eventTimer = pickBetween(
            random,
            profile.eventDurationRange[0],
            profile.eventDurationRange[1],
          );
          state.eventBoost = pickBetween(
            random,
            profile.eventBoostRange[0],
            profile.eventBoostRange[1],
          );
        }
      }

      const timingDrift =
        Math.sin(state.slowPhase + profile.phase) * state.localRhythmValue +
        Math.sin(state.slowPhase * 0.52 + profile.phase * 0.7) * state.localRhythmValue * 0.5;
      const effectiveFrequency =
        baseFrequency *
        (1 + state.frequencyOffsetValue + timingDrift) *
        (1 / Math.max(state.periodScale, 0.6)) *
        (0.98 + synchronization * 0.03);
      state.phase += Math.PI * 2 * effectiveFrequency * dt;

      const cycleIndex = Math.floor(state.phase / (Math.PI * 2));
      if (cycleIndex !== state.currentCycleIndex) {
        state.currentCycleIndex = cycleIndex;
        assignPeakScale();
      }

      const peakIndex = Math.floor(state.phase / Math.PI);
      if (peakIndex !== state.currentPeakIndex) {
        state.currentPeakIndex = peakIndex;
        assignPeriodScale();
      }

      const primary = Math.sin(state.phase);
      const harmonic = Math.sin(state.phase * 2 + profile.phase * 0.4);
      const undertone = Math.sin(state.phase * 0.5 + profile.phase * 1.1);
      const microVariation =
        Math.sin(state.microPhase + profile.phase) * profile.microVariation +
        Math.cos(state.microPhase * 1.7 + profile.phase * 0.5) *
          profile.microVariation *
          0.4;
      const asymmetry =
        Math.max(primary, 0) *
        Math.sin(state.phase * 0.5 + profile.phase) *
        profile.asymmetry;

      const shapedSignal =
        primary +
        harmonic * profile.shapeBlend +
        undertone * profile.shapeBlend * 0.45 +
        asymmetry +
        microVariation * (0.45 + noiseLevel * 0.35);

      const amplitudeEnvelope =
        profile.baseAmplitude *
        state.amplitudeValue *
        state.peakScale *
        (0.9 + Math.sin(state.slowPhase * 0.7 + profile.phase) * 0.14) *
        (0.95 + stability * 0.04);
      const sample = amplitudeEnvelope * shapedSignal * (1 + state.eventBoost);

      state.lastDiagnostics = {
        effectiveFrequency,
        phase: state.phase,
        amplitudeEnvelope: amplitudeEnvelope * (1 + state.eventBoost),
        jitter: state.localRhythmValue,
        periodScale: state.periodScale,
      };

      return sample;
    },
  };
}
