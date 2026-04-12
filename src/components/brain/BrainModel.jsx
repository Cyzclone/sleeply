import { useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useBrainMapping } from "../../features/brain-mapping/hooks/useBrainMapping";

function cloneMaterial(material) {
  if (!material?.clone) {
    return material;
  }

  const cloned = material.clone();
  if ("color" in cloned && cloned.color) {
    cloned.color.set("#e3a796");
  }
  if ("emissive" in cloned && cloned.emissive) {
    cloned.emissive.set("#3a1613");
  }
  if ("roughness" in cloned) {
    cloned.roughness = 0.88;
  }
  if ("metalness" in cloned) {
    cloned.metalness = 0.03;
  }

  return cloned;
}

export default function BrainModel({ onAnchorsReady }) {
  const gltf = useGLTF("/models/brain.glb");
  const groupRef = useRef(null);
  const scene = useMemo(() => {
    const cloned = gltf.scene.clone(true);

    cloned.traverse((child) => {
      if (!child.isMesh) {
        return;
      }

      if (Array.isArray(child.material)) {
        child.material = child.material.map(cloneMaterial);
        return;
      }

      child.material = cloneMaterial(child.material);
    });

    return cloned;
  }, [gltf.scene]);

  useBrainMapping({
    onAnchorsReady,
    rootRef: groupRef,
    targetCount: 7000,
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload("/models/brain.glb");
