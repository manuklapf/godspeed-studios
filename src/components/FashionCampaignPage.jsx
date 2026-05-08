import React, { useRef, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import * as THREE from "three";
import PageWrapper from "./PageWrapper";

/* ─── Black background ──────────────────────────────────────────── */
function SceneBackground() {
  const { scene } = useThree();
  useEffect(() => {
    scene.background = new THREE.Color(0x000000);
    return () => {
      scene.background = null;
    };
  }, [scene]);
  return null;
}

/* ─── Animated arcade lights (pink + cyan, ported from original) */
function ArcadeLights() {
  const pinkRef = useRef();
  const cyanRef = useRef();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // Cumulative drift matching original setInterval(50ms) at ~60fps (÷3)
    if (pinkRef.current) {
      pinkRef.current.position.x += (Math.sin(t) * 0.02) / 3;
      pinkRef.current.position.z += (Math.cos(t) * 0.02) / 3;
    }
    if (cyanRef.current) {
      cyanRef.current.position.x += (Math.sin(t + Math.PI) * 0.02) / 3;
      cyanRef.current.position.z += (Math.cos(t + Math.PI) * 0.02) / 3;
    }
  });
  return (
    <>
      <pointLight
        ref={pinkRef}
        color={0xff44cc}
        intensity={1}
        distance={20}
        position={[2, 5, 2]}
      />
      <pointLight
        ref={cyanRef}
        color={0x44ccff}
        intensity={1}
        distance={20}
        position={[-2, 5, -2]}
      />
    </>
  );
}

/* ─── Walk up the object tree to find a named ancestor ──────── */
function findNamed(obj, name) {
  let node = obj;
  while (node) {
    if (node.name === name) return node;
    node = node.parent;
  }
  return null;
}

/* ─── The model — with animations, glass, and interactions ──── */
function GashaponModel({ controlsRef }) {
  const { scene: gltfScene, animations } = useGLTF("/gashapon_updated.glb");
  const hdrTexture = useLoader(RGBELoader, "/warehouse_02_1k.hdr");
  const { scene: r3fScene, camera } = useThree();
  const groupRef = useRef();
  const mixerRef = useRef(null);
  const actionsRef = useRef({});
  const turnerGlowRef = useRef(null);
  const planeGlowRef = useRef(null);
  const turnerClickedRef = useRef(false);
  const planeAnimStartedRef = useRef(false);
  const isHoveringRef = useRef(false);
  const lookTargetRef = useRef(new THREE.Vector3());
  const cameraFocusRef = useRef(null);

  const focusCameraOnPaper = () => {
    const paper = gltfScene.getObjectByName("Plane");
    if (!paper) return;

    gltfScene.updateMatrixWorld(true);

    const focusBox = new THREE.Box3().setFromObject(paper);
    if (focusBox.isEmpty()) return;

    const focusCenter = focusBox.getCenter(new THREE.Vector3());
    const worldQuat = paper.getWorldQuaternion(new THREE.Quaternion());
    const paperNormal = new THREE.Vector3(0, 0, 1)
      .applyQuaternion(worldQuat)
      .normalize();
    const toCamera = new THREE.Vector3().subVectors(
      camera.position,
      focusCenter,
    );
    const approachDirection = paperNormal.clone();
    if (approachDirection.dot(toCamera) < 0)
      approachDirection.multiplyScalar(-1);
    approachDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
    const pitchAxis = new THREE.Vector3()
      .crossVectors(new THREE.Vector3(0, 1, 0), approachDirection)
      .normalize();
    approachDirection.applyAxisAngle(pitchAxis, THREE.MathUtils.degToRad(35));

    const worldSize = focusBox.getSize(new THREE.Vector3());
    let paperWidth = Math.max(worldSize.x, 0.001);
    let paperHeight = Math.max(worldSize.y, 0.001);
    if (paper instanceof THREE.Mesh && paper.geometry) {
      paper.geometry.computeBoundingBox();
      const bounds = paper.geometry.boundingBox;
      if (bounds) {
        const localSize = bounds.getSize(new THREE.Vector3());
        const worldScale = paper.getWorldScale(new THREE.Vector3());
        paperWidth = Math.max(localSize.x * worldScale.x, 0.001);
        paperHeight = Math.max(localSize.y * worldScale.y, 0.001);
      }
    }

    const verticalFov = THREE.MathUtils.degToRad(camera.fov);
    const horizontalFov =
      2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
    const coverDistance =
      Math.min(
        (paperHeight * 0.5) / Math.tan(verticalFov / 2),
        (paperWidth * 0.5) / Math.tan(horizontalFov / 2),
      ) *
      0.96 *
      200;

    cameraFocusRef.current = {
      position: focusCenter
        .clone()
        .addScaledVector(approachDirection, Math.max(coverDistance, 0.05)),
      target: focusCenter,
    };

    if (controlsRef.current) controlsRef.current.enabled = false;
  };

  useEffect(() => {
    if (!gltfScene || !groupRef.current) return;

    /* ── HDR environment (matches original RGBELoader setup) ─ */
    hdrTexture.mapping = THREE.EquirectangularRefractionMapping;
    r3fScene.environment = hdrTexture;
    r3fScene.environmentIntensity = 0.6;

    /* ── Auto-centre & scale ──────────────────────────────── */
    const box = new THREE.Box3().setFromObject(gltfScene);
    const centre = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 3.2 / maxDim;
    groupRef.current.scale.setScalar(scale);
    groupRef.current.position.set(
      -centre.x * scale,
      -centre.y * scale + 0.1,
      -centre.z * scale,
    );

    /* ── Glass material (MeshPhysicalMaterial, matches original) */
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.25,
      roughness: 0.1,
      transmission: 1,
      //   transparent:        true,
      //   opacity:            1,
      ior: 0,
      reflectivity: 0,
      thickness: 1.5,
      //   envMap:             hdrTexture,
      envMapIntensity: 0.25,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      //   side:               THREE.DoubleSide,
    });

    const clearTop = gltfScene.getObjectByName("clearTop");
    const clearCase = gltfScene.getObjectByName("clearCase");
    if (clearTop instanceof THREE.Mesh) {
      clearTop.material = glassMaterial;
      clearTop.material.needsUpdate = true;
      clearTop.geometry.computeVertexNormals();
    }
    if (clearCase instanceof THREE.Mesh) {
      clearCase.material = glassMaterial;
      clearCase.material.needsUpdate = true;
      clearCase.geometry.computeVertexNormals();
    }

    /* ── Glow meshes — hidden by default ─────────────────── */
    const tGlow = gltfScene.getObjectByName("TurnerGlow");
    const pGlow = gltfScene.getObjectByName("PlaneGlow");
    turnerGlowRef.current = tGlow ?? null;
    planeGlowRef.current = pGlow ?? null;
    if (tGlow) tGlow.visible = false;
    if (pGlow) pGlow.visible = false;

    /* ── AnimationMixer ───────────────────────────────────── */
    if (!animations?.length) return;

    const mixer = new THREE.AnimationMixer(gltfScene);
    mixerRef.current = mixer;

    animations.forEach((clip) => {
      const action = mixer.clipAction(clip);
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
      actionsRef.current[clip.name] = action;
    });

    // After PlaneAction finishes, frame the paper front-on.
    const onFinished = (e) => {
      if (e.action === actionsRef.current["PlaneAction"]) {
        focusCameraOnPaper();
      }
    };
    mixer.addEventListener("finished", onFinished);

    return () => {
      mixer.removeEventListener("finished", onFinished);
      mixer.stopAllAction();
      document.body.style.cursor = "default";
      r3fScene.environment = null;
      r3fScene.environmentIntensity = 1;
    };
  }, [gltfScene, r3fScene, animations, hdrTexture]);

  /* ── Per-frame: tick mixer, rotation, cube cam update ────── */
  useFrame((_, delta) => {
    if (mixerRef.current) mixerRef.current.update(delta);

    if (cameraFocusRef.current) {
      const focus = cameraFocusRef.current;
      const lerpAlpha = 1 - Math.exp(-delta * 5);

      camera.position.lerp(focus.position, lerpAlpha);
      lookTargetRef.current.lerp(focus.target, lerpAlpha);

      if (controlsRef.current) {
        controlsRef.current.target.copy(lookTargetRef.current);
        controlsRef.current.update();
      } else {
        camera.lookAt(lookTargetRef.current);
      }

      if (
        camera.position.distanceToSquared(focus.position) < 0.0001 &&
        lookTargetRef.current.distanceToSquared(focus.target) < 0.0001
      ) {
        camera.position.copy(focus.position);
        lookTargetRef.current.copy(focus.target);
        if (controlsRef.current) {
          controlsRef.current.target.copy(focus.target);
          controlsRef.current.enabled = true;
          controlsRef.current.update();
        } else {
          camera.lookAt(focus.target);
        }
        cameraFocusRef.current = null;
      }
    }

    if (
      !turnerClickedRef.current &&
      !isHoveringRef.current &&
      groupRef.current
    ) {
      groupRef.current.rotation.y += delta * 0.04;
    }
  });

  /* ── Pointer hover ───────────────────────────────────────── */
  const handlePointerMove = (e) => {
    e.stopPropagation();
    isHoveringRef.current = true;
    const onTurner = !!findNamed(e.object, "Turner");
    const onPlane = !!findNamed(e.object, "Plane");

    if (onTurner && !turnerClickedRef.current) {
      if (turnerGlowRef.current) turnerGlowRef.current.visible = true;
      if (planeGlowRef.current) planeGlowRef.current.visible = false;
      document.body.style.cursor = "pointer";
    } else if (onPlane && turnerClickedRef.current) {
      if (planeGlowRef.current) planeGlowRef.current.visible = true;
      document.body.style.cursor = "pointer";
    } else {
      if (turnerGlowRef.current) turnerGlowRef.current.visible = false;
      if (planeGlowRef.current) planeGlowRef.current.visible = false;
      document.body.style.cursor = "default";
    }
  };

  const handlePointerLeave = () => {
    isHoveringRef.current = false;
    if (turnerGlowRef.current) turnerGlowRef.current.visible = false;
    if (planeGlowRef.current) planeGlowRef.current.visible = false;
    document.body.style.cursor = "default";
  };

  /* ── Click ───────────────────────────────────────────────── */
  const handleClick = (e) => {
    e.stopPropagation();
    const a = actionsRef.current;

    // ── Turner crank → trigger vending sequence
    if (findNamed(e.object, "Turner") && !turnerClickedRef.current) {
      turnerClickedRef.current = true;
      if (turnerGlowRef.current) turnerGlowRef.current.visible = false;
      a["TurnerAction"]?.reset().play();
      a["PlaneAction"]?.reset().play();
      a["PriceballActionTop"]?.reset().play();
      a["PriceballActionBottom"]?.reset().play();
    }

    // ── Plane (ticket) → burst particles
    if (
      findNamed(e.object, "Plane") &&
      turnerClickedRef.current &&
      !planeAnimStartedRef.current
    ) {
      planeAnimStartedRef.current = true;
      if (planeGlowRef.current) planeGlowRef.current.visible = false;
      for (let x = 20; x <= 34; x++) {
        a[`particle.0${x}Action`]?.reset().play();
      }
    }
  };

  return (
    <group ref={groupRef}>
      <primitive
        object={gltfScene}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
      />
    </group>
  );
}

/* ─── 3D Scene ──────────────────────────────────────────────── */
function WarehouseScene() {
  const controlsRef = useRef(null);

  return (
    <>
      <SceneBackground />
      <ArcadeLights />

      <Suspense fallback={null}>
        <GashaponModel controlsRef={controlsRef} />
      </Suspense>

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom={false}
        minDistance={0.1}
        maxDistance={10}
        minPolarAngle={Math.PI * 0.15}
        maxPolarAngle={Math.PI * 0.72}
        dampingFactor={0.08}
        enableDamping
      />
    </>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function FashionCampaignPage() {
  return (
    <PageWrapper>
      <section className="fc-page">
        <header className="fc-header">
          <span className="fc-tag">Case Study</span>
          <h1 className="fc-title">
            Fashion
            <br />
            Campaign
          </h1>
          <p className="fc-subtitle">
            A conceptual campaign exploring texture, form, and identity through
            3D art direction and physical-digital object design.
          </p>
          <p className="fc-year">2024</p>
        </header>

        <div className="fc-viewer-wrap">
          <div className="fc-viewer-label">
            <span className="fc-viewer-eyebrow">Interactive Object</span>
            <h2 className="fc-viewer-title">Gashapon</h2>
            <p className="fc-viewer-desc">Click the crank · drag to orbit</p>
          </div>

          <div className="fc-canvas-wrap">
            <Canvas
              camera={{ position: [0, 1.2, 5], fov: 42, near: 0.1, far: 200 }}
              gl={{
                antialias: true,
                alpha: false,
                powerPreference: "high-performance",
                toneMapping: THREE.ACESFilmicToneMapping,
                toneMappingExposure: 1.0,
              }}
              dpr={[1, 1.5]}
            >
              <WarehouseScene />
            </Canvas>
          </div>
        </div>

        <div className="fc-body">
          <div className="fc-body-inner">
            <span className="fc-section-eyebrow">Concept</span>
            <h2 className="fc-section-title">Object as Character</h2>
            <p className="fc-section-text">
              The gashapon machine is a cultural artefact — equal parts vending
              machine, lottery, and collectible showcase. This campaign reframes
              it as a hero object: isolated, lit harshly under warehouse
              fluorescents, stripped of its usual context to reveal its
              sculptural quality.
            </p>
            <p className="fc-section-text">
              The tension between the object's playful origins and the severity
              of the industrial setting is the visual thesis: mass-produced
              things, made strange by attention.
            </p>
          </div>
        </div>
      </section>
    </PageWrapper>
  );
}
