import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { usePulseEngine } from "../../features/pulse-engine/hooks/usePulseEngine";

const DEBUG_POINT_LIMIT = 220;
const HIPPOCAMPUS_HIGHLIGHT_COLOR = "#EC4899";

function PulseSprite({ pulse }) {
  const progress = pulse.lifeProgress;
  const opacity = Math.max(0, 1 - progress) * (pulse.brightness ?? 1);
  const coreScale = pulse.size * (0.94 + progress * 0.28);
  const glowScale = pulse.size * (1.16 + progress * 0.48);
  const quaternion = useMemo(() => {
    const normal = new THREE.Vector3(...pulse.normal).normalize();
    return new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      normal,
    );
  }, [pulse.normal]);

  return (
    <group position={pulse.position} quaternion={quaternion}>
      <mesh position={[0, 0, 0.001]} renderOrder={12} scale={[glowScale, glowScale, 1]}>
        <circleGeometry args={[1, 28]} />
        <meshBasicMaterial
          color={pulse.color}
          depthWrite={false}
          opacity={opacity * 0.22}
          toneMapped={false}
          transparent
        />
      </mesh>
      <mesh
        position={[0, 0, 0.002]}
        renderOrder={13}
        scale={[coreScale, coreScale, 1]}
      >
        <circleGeometry args={[1, 28]} />
        <meshBasicMaterial
          color={pulse.color}
          depthWrite={false}
          opacity={Math.min(1, 0.82 * opacity)}
          toneMapped={false}
          transparent
        />
      </mesh>
      <mesh
        position={[0, 0, 0.003]}
        renderOrder={14}
        scale={[coreScale * 0.46, coreScale * 0.46, 1]}
      >
        <circleGeometry args={[1, 20]} />
        <meshBasicMaterial
          color={pulse.color}
          depthWrite={false}
          opacity={Math.min(1, 0.95 * opacity)}
          toneMapped={false}
          transparent
        />
      </mesh>
    </group>
  );
}

function DebugAnchorPoints({ anchors }) {
  const positions = useMemo(() => {
    const subset = anchors.filter((_, index) => index % Math.ceil(anchors.length / DEBUG_POINT_LIMIT) === 0);
    const values = new Float32Array(subset.length * 3);

    subset.forEach((anchor, index) => {
      values[index * 3] = anchor.position[0];
      values[index * 3 + 1] = anchor.position[1];
      values[index * 3 + 2] = anchor.position[2];
    });

    return values;
  }, [anchors]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          array={positions}
          attach="attributes-position"
          count={positions.length / 3}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial color="#ffffff" size={0.032} sizeAttenuation toneMapped={false} />
    </points>
  );
}

function HippocampusMarker({ marker }) {
  const groupRef = useRef(null);
  const glowRef = useRef(null);
  const coreRef = useRef(null);
  const quaternion = useMemo(() => {
    const normal = new THREE.Vector3(...marker.normal).normalize();
    return new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      normal,
    );
  }, [marker.normal]);

  useFrame(({ clock }) => {
    const pulse = 0.5 + 0.5 * Math.sin(clock.elapsedTime * 1.9 + marker.phase);
    const scale = 0.055 + pulse * 0.02;

    if (groupRef.current) {
      groupRef.current.scale.setScalar(scale);
    }

    if (glowRef.current) {
      glowRef.current.opacity = 0.1 + pulse * 0.07;
    }

    if (coreRef.current) {
      coreRef.current.opacity = 0.22 + pulse * 0.14;
    }
  });

  return (
    <group position={marker.position} quaternion={quaternion} ref={groupRef}>
      <mesh position={[0, 0, 0.001]} renderOrder={15} scale={[1.8, 1.8, 1]}>
        <circleGeometry args={[1, 28]} />
        <meshBasicMaterial
          color={HIPPOCAMPUS_HIGHLIGHT_COLOR}
          depthWrite={false}
          ref={glowRef}
          toneMapped={false}
          transparent
        />
      </mesh>
      <mesh position={[0, 0, 0.002]} renderOrder={16} scale={[0.92, 0.92, 1]}>
        <circleGeometry args={[1, 24]} />
        <meshBasicMaterial
          color={HIPPOCAMPUS_HIGHLIGHT_COLOR}
          depthWrite={false}
          ref={coreRef}
          toneMapped={false}
          transparent
        />
      </mesh>
    </group>
  );
}

function HippocampusHighlight({ anchors, stage }) {
  const markers = useMemo(() => {
    if (stage !== "rem") {
      return [];
    }

    const hippocampusAnchors = anchors.filter((anchor) => anchor.isHippocampus);
    if (!hippocampusAnchors.length) {
      return [];
    }

    const targetCount = Math.min(14, hippocampusAnchors.length);
    const step = hippocampusAnchors.length / targetCount;

    return Array.from({ length: targetCount }, (_, index) => {
      const anchor = hippocampusAnchors[Math.floor(index * step)];
      return {
        id: `${anchor.id}-hippocampus`,
        normal: anchor.normal,
        phase: index * 0.75,
        position: anchor.position,
      };
    });
  }, [anchors, stage]);

  if (!markers.length) {
    return null;
  }

  return (
    <group renderOrder={15}>
      {markers.map((marker) => (
        <HippocampusMarker key={marker.id} marker={marker} />
      ))}
    </group>
  );
}

export default function PulseLayer({ anchors, debugAnchors, paused, stage, stageProfiles }) {
  const pulses = usePulseEngine({ anchors, paused, stage, stageProfiles });

  return (
    <group renderOrder={10}>
      {debugAnchors && anchors.length > 0 && <DebugAnchorPoints anchors={anchors} />}
      <HippocampusHighlight anchors={anchors} stage={stage} />
      {pulses.map((pulse) => (
        <PulseSprite key={pulse.id} pulse={pulse} />
      ))}
    </group>
  );
}
