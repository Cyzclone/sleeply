import { useEffect } from "react";
import * as THREE from "three";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";
import { classifyBrainRegion } from "../utils/classifyBrainRegion";
import { computeBrainBounds } from "../utils/computeBrainBounds";

const BLOCKED_NAME_PARTS = ["axis", "camera", "empty", "guide", "helper", "label", "light", "text"];
const SURFACE_OFFSET = 0.016;

function isValidBrainSurfaceMesh(mesh) {
  if (!mesh?.isMesh || !mesh.visible || !mesh.geometry?.attributes?.position) {
    return false;
  }

  const triangleCount = mesh.geometry.index
    ? mesh.geometry.index.count / 3
    : mesh.geometry.attributes.position.count / 3;

  if (triangleCount < 100) {
    return false;
  }

  const searchableName = `${mesh.name} ${mesh.parent?.name ?? ""}`.toLowerCase();
  if (BLOCKED_NAME_PARTS.some((part) => searchableName.includes(part))) {
    return false;
  }

  return true;
}

function computeMeshWorldArea(mesh) {
  const geometry = mesh.geometry;
  const position = geometry.attributes.position;
  const index = geometry.index;
  const vertexA = new THREE.Vector3();
  const vertexB = new THREE.Vector3();
  const vertexC = new THREE.Vector3();
  const edgeAB = new THREE.Vector3();
  const edgeAC = new THREE.Vector3();
  const cross = new THREE.Vector3();
  let area = 0;

  const readVertex = (vertexIndex, target) => {
    target.fromBufferAttribute(position, vertexIndex);
    target.applyMatrix4(mesh.matrixWorld);
  };

  if (index) {
    for (let faceIndex = 0; faceIndex < index.count; faceIndex += 3) {
      readVertex(index.getX(faceIndex), vertexA);
      readVertex(index.getX(faceIndex + 1), vertexB);
      readVertex(index.getX(faceIndex + 2), vertexC);
      edgeAB.subVectors(vertexB, vertexA);
      edgeAC.subVectors(vertexC, vertexA);
      cross.crossVectors(edgeAB, edgeAC);
      area += cross.length() * 0.5;
    }

    return area;
  }

  for (let faceIndex = 0; faceIndex < position.count; faceIndex += 3) {
    readVertex(faceIndex, vertexA);
    readVertex(faceIndex + 1, vertexB);
    readVertex(faceIndex + 2, vertexC);
    edgeAB.subVectors(vertexB, vertexA);
    edgeAC.subVectors(vertexC, vertexA);
    cross.crossVectors(edgeAB, edgeAC);
    area += cross.length() * 0.5;
  }

  return area;
}

function buildSurfaceAnchors(meshes, targetCount) {
  if (!meshes.length) {
    return [];
  }

  const meshAreas = meshes.map((mesh) => ({
    area: Math.max(computeMeshWorldArea(mesh), 0.0001),
    mesh,
  }));
  const totalArea = meshAreas.reduce((sum, entry) => sum + entry.area, 0);
  const worldPosition = new THREE.Vector3();
  const worldNormal = new THREE.Vector3();
  const sampledPosition = new THREE.Vector3();
  const sampledNormal = new THREE.Vector3();

  const rawAnchors = meshAreas.flatMap(({ area, mesh }, meshIndex) => {
    const sampler = new MeshSurfaceSampler(mesh).build();
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
    const meshAnchorCount = Math.max(48, Math.round((area / totalArea) * targetCount));

    return Array.from({ length: meshAnchorCount }, (_, anchorIndex) => {
      sampler.sample(sampledPosition, sampledNormal);
      worldPosition.copy(sampledPosition).applyMatrix4(mesh.matrixWorld);
      worldNormal.copy(sampledNormal).applyMatrix3(normalMatrix).normalize();
      worldPosition.addScaledVector(worldNormal, SURFACE_OFFSET);

      return {
        id: `${mesh.uuid}-${meshIndex}-${anchorIndex}`,
        normal: [worldNormal.x, worldNormal.y, worldNormal.z],
        position: [worldPosition.x, worldPosition.y, worldPosition.z],
      };
    });
  });

  const bounds = computeBrainBounds(rawAnchors.map((anchor) => anchor.position));

  return rawAnchors.map((anchor) => ({
    ...anchor,
    ...classifyBrainRegion(anchor.position, bounds),
  }));
}

export function useBrainMapping({ onAnchorsReady, rootRef, targetCount = 7000 }) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return undefined;
    }

    let cancelled = false;
    const frameId = window.requestAnimationFrame(() => {
      const secondFrameId = window.requestAnimationFrame(() => {
        if (cancelled) {
          return;
        }

        let updateRoot = root;
        while (updateRoot.parent) {
          updateRoot = updateRoot.parent;
        }

        updateRoot.updateWorldMatrix(true, true);
        const validMeshes = [];
        const fallbackMeshes = [];

        root.traverse((child) => {
          if (child?.isMesh && child.visible && child.geometry?.attributes?.position) {
            fallbackMeshes.push(child);
          }

          if (isValidBrainSurfaceMesh(child)) {
            validMeshes.push(child);
          }
        });

        const anchors = buildSurfaceAnchors(
          validMeshes.length ? validMeshes : fallbackMeshes,
          targetCount,
        );
        onAnchorsReady?.(anchors);
      });

      return () => window.cancelAnimationFrame(secondFrameId);
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
    };
  }, [onAnchorsReady, rootRef, targetCount]);
}
