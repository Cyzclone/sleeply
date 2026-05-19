import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Center, OrbitControls } from "@react-three/drei";
import BrainModel from "./BrainModel";
import PulseLayer from "./PulseLayer";

const ZOOM_SYNC_EPSILON = 0.01;

function BrainScene({
  currentStage,
  debugAnchors,
  onZoomChange,
  paused,
  rotationRequest,
  stageProfiles,
  visualState,
  zoomDistance,
  zoomRange,
}) {
  const [anchors, setAnchors] = useState([]);
  const controlsRef = useRef(null);
  const isSyncingZoomRef = useRef(false);
  const zoomFrameRef = useRef(0);
  const { camera } = useThree();

  const lighting = useMemo(() => {
    const ambientIntensity = 1 + (visualState?.visualCalmness ?? 0.5) * 0.8;
    const primaryLight = 1.5 + (visualState?.pulseDensity ?? 0.4) * 1.1;
    const fillLight = 0.9 + (visualState?.pulseCoherence ?? 0.5) * 0.8;
    const modelScale = 1.43;
    const modelTilt = 0.04 + (visualState?.visualDisruption ?? 0.2) * 0.12;

    return {
      ambientIntensity,
      fillLight,
      modelScale,
      modelTilt,
      primaryLight,
    };
  }, [visualState]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) {
      return;
    }

    const currentDistance = controls.getDistance();

    if (Math.abs(currentDistance - zoomDistance) < ZOOM_SYNC_EPSILON) {
      return;
    }

    isSyncingZoomRef.current = true;
    camera.position.setLength(zoomDistance);
    camera.updateProjectionMatrix();
    controlsRef.current?.update();
  }, [camera, zoomDistance]);

  useEffect(() => () => {
    if (zoomFrameRef.current) {
      window.cancelAnimationFrame(zoomFrameRef.current);
    }
  }, []);

  useEffect(() => {
    if (!rotationRequest || !controlsRef.current) {
      return;
    }

    controlsRef.current.rotateLeft(rotationRequest.horizontal);
    controlsRef.current.rotateUp(rotationRequest.vertical);
    controlsRef.current.update();
  }, [rotationRequest]);

  function handleControlsChange() {
    if (isSyncingZoomRef.current) {
      isSyncingZoomRef.current = false;
      return;
    }

    if (zoomFrameRef.current) {
      window.cancelAnimationFrame(zoomFrameRef.current);
    }

    zoomFrameRef.current = window.requestAnimationFrame(() => {
      const nextDistance = controlsRef.current?.getDistance?.() ?? camera.position.length();
      onZoomChange(Math.min(zoomRange.max, Math.max(zoomRange.min, nextDistance)));
      zoomFrameRef.current = 0;
    });
  }

  return (
    <>
      <ambientLight intensity={lighting.ambientIntensity} />
      <directionalLight intensity={lighting.primaryLight} position={[4, 6, 6]} />
      <directionalLight intensity={lighting.fillLight} position={[-4, -2, 5]} />
      <Suspense fallback={null}>
        <Center>
          <group rotation={[lighting.modelTilt, -0.2, 0]} scale={lighting.modelScale}>
            <BrainModel onAnchorsReady={setAnchors} />
          </group>
        </Center>
        <PulseLayer
          anchors={anchors}
          debugAnchors={debugAnchors}
          paused={paused}
          stage={currentStage}
          stageProfiles={stageProfiles}
        />
      </Suspense>
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        enablePan={false}
        maxDistance={zoomRange.max}
        minDistance={zoomRange.min}
        onChange={handleControlsChange}
        ref={controlsRef}
      />
    </>
  );
}

export default function BrainCanvas({
  currentStage,
  debugAnchors,
  onZoomChange,
  paused,
  rotationRequest,
  stageProfiles,
  visualState,
  zoomDistance,
}) {
  const zoomRange = useMemo(
    () => ({
      max: 9,
      min: 1.45,
    }),
    [],
  );

  return (
    <Canvas camera={{ position: [0, 0, 3.95], fov: 24 }} gl={{ alpha: true }}>
      <BrainScene
        currentStage={currentStage}
        debugAnchors={debugAnchors}
        onZoomChange={onZoomChange}
        paused={paused}
        rotationRequest={rotationRequest}
        stageProfiles={stageProfiles}
        visualState={visualState}
        zoomDistance={zoomDistance}
        zoomRange={zoomRange}
      />
    </Canvas>
  );
}
