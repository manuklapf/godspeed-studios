import React, { useRef, useEffect, Suspense, useState } from "react";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import * as THREE from "three";
import PageWrapper from "./PageWrapper";
import MuteButton from "./MuteButton";
import CanvasOverlay from "./CanvasOverlay";
import { useMuted } from "../hooks/useMuted";
import { findNamed } from "../utils/threeUtils";
import { fashionCampaignPlanes } from "../data/fashionCampaignPlanes";

/* ─── Audio crossfade helper ────────────────────────────────────── */
function fadeAudio(audio, targetVol, durationMs = 800) {
  if (!audio) return;
  const startVol = audio.volume;
  const steps = 20;
  const stepTime = durationMs / steps;
  const delta = (targetVol - startVol) / steps;
  let step = 0;
  const id = setInterval(() => {
    step++;
    audio.volume = Math.max(0, Math.min(1, startVol + delta * step));
    if (step >= steps) {
      clearInterval(id);
      if (targetVol === 0) audio.pause();
    }
  }, stepTime);
}

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

/* ─── The model — with animations, glass, and interactions ──── */
function GashaponModel({
  controlsRef,
  onPlaneFinished,
  onTurnerClicked,
  mutedRef,
  muted,
  resetRef,
}) {
  const { scene: gltfScene, animations } = useGLTF("/gashapon.glb");
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
  const selectedPlaneConfigRef = useRef(null);
  const audioRef = useRef(null);
  const modelCenterRef = useRef(new THREE.Vector3());
  const onPlaneFinishedRef = useRef(onPlaneFinished);
  useEffect(() => {
    onPlaneFinishedRef.current = onPlaneFinished;
  }, [onPlaneFinished]);
  const onTurnerClickedRef = useRef(onTurnerClicked);
  useEffect(() => {
    onTurnerClickedRef.current = onTurnerClicked;
  }, [onTurnerClicked]);

  // Keep audio element in sync with the mute button
  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
  }, [muted]);

  // Expose reset function so the overlay button can restart the interaction.
  if (resetRef) {
    resetRef.current = () => {
      if (mixerRef.current) mixerRef.current.stopAllAction();
      turnerClickedRef.current = false;
      planeAnimStartedRef.current = false;
      selectedPlaneConfigRef.current = null;
      cameraFocusRef.current = null;
      if (audioRef.current) {
        fadeAudio(audioRef.current, 0, 600);
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
          }
        }, 620);
      }
      // Restore camera to its initial position and look target.
      camera.position.set(0, 1.2, 6);
      if (controlsRef.current) {
        controlsRef.current.target.copy(modelCenterRef.current);
        controlsRef.current.enabled = true;
        controlsRef.current.update();
      } else {
        camera.lookAt(modelCenterRef.current);
      }
    };
  }

  const focusCameraOnPaper = (planeName) => {
    const paper = gltfScene.getObjectByName(planeName);
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
    // If the pitch tilted the approach downward, reverse it so the camera
    // always arrives from above the paper rather than from below.
    if (approachDirection.y < 0) {
      approachDirection.applyAxisAngle(
        pitchAxis,
        THREE.MathUtils.degToRad(120),
      );
    }

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

    audioRef.current = new Audio();
    audioRef.current.preload = "none";

    /* ── HDR environment (matches original RGBELoader setup) ─ */
    hdrTexture.mapping = THREE.EquirectangularRefractionMapping;
    r3fScene.environment = hdrTexture;
    r3fScene.environmentIntensity = 0.6;

    /* ── Auto-centre & scale ──────────────────────────────── */
    const box = new THREE.Box3().setFromObject(gltfScene);
    const centre = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 2.8 / maxDim;
    groupRef.current.scale.setScalar(scale);
    groupRef.current.position.set(
      -centre.x * scale,
      -centre.y * scale + 0.1,
      -centre.z * scale + 0.3,
    );
    groupRef.current.updateMatrixWorld(true);

    const modelCenter = new THREE.Box3()
      .setFromObject(groupRef.current)
      .getCenter(new THREE.Vector3());
    modelCenterRef.current.copy(modelCenter);
    camera.position.set(0, 1.2, 6);
    camera.lookAt(modelCenter);
    if (controlsRef.current) {
      controlsRef.current.target.copy(modelCenter);
      controlsRef.current.update();
    }

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

    // After the selected plane action finishes, frame that plane and play its audio.
    const onFinished = (e) => {
      const selectedPlaneConfig = selectedPlaneConfigRef.current;
      if (!selectedPlaneConfig) return;

      if (e.action === actionsRef.current[selectedPlaneConfig.actionName]) {
        focusCameraOnPaper(selectedPlaneConfig.planeName);
        onPlaneFinishedRef.current?.();

        const danceAction = actionsRef.current["DanceLoop"];
        if (danceAction) {
          danceAction.setLoop(THREE.LoopRepeat, Infinity);
          danceAction.reset().play();
        }
      }
    };
    mixer.addEventListener("finished", onFinished);

    return () => {
      mixer.removeEventListener("finished", onFinished);
      mixer.stopAllAction();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
      document.body.style.cursor = "default";
      r3fScene.environment = null;
      r3fScene.environmentIntensity = 1;
    };
  }, [gltfScene, r3fScene, animations, hdrTexture, camera, controlsRef]);

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
      // 8.5.26: disabled paper plane hover state
      // } else if (onPlane && turnerClickedRef.current) {
      //   if (planeGlowRef.current) planeGlowRef.current.visible = true;
      //   document.body.style.cursor = "pointer";
    } else {
      if (turnerGlowRef.current) turnerGlowRef.current.visible = false;
      // if (planeGlowRef.current) planeGlowRef.current.visible = false;
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
      const selectedPlaneConfig =
        fashionCampaignPlanes[
          Math.floor(Math.random() * fashionCampaignPlanes.length)
        ] ?? null;

      console.log("Selected plane config:", selectedPlaneConfig);

      if (
        !selectedPlaneConfig ||
        !a[selectedPlaneConfig.actionName] ||
        !a[selectedPlaneConfig.danceActionName]
      )
        return;

      turnerClickedRef.current = true;
      onTurnerClickedRef.current?.();
      if (turnerGlowRef.current) turnerGlowRef.current.visible = false;
      selectedPlaneConfigRef.current = selectedPlaneConfig;

      if (!mutedRef.current)
        new Audio("/audio/turn.mp3").play().catch(() => {});

      // Start plane audio immediately on turner click (lazy-loaded here)
      if (audioRef.current && selectedPlaneConfig.audioSrc) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.muted = mutedRef.current;
        audioRef.current.src = selectedPlaneConfig.audioSrc;
        audioRef.current.volume = 0;
        audioRef.current.play().catch(() => {});
        fadeAudio(audioRef.current, 1, 1000);
      }

      a["TurnerAction"]?.reset().play();
      fashionCampaignPlanes.forEach(({ actionName }) => {
        a[actionName]?.stop();
      });
      selectedPlaneConfig?.actionName &&
        a[selectedPlaneConfig.actionName]?.reset().play();
      selectedPlaneConfig?.danceActionName &&
        a[selectedPlaneConfig.danceActionName]?.reset().play();
      a["PriceballActionTop"]?.reset().play();
      a["PriceballActionBottom"]?.reset().play();
    }

    // 8.5.26: disabled burst star particles
    // // ── Plane (ticket) → burst particles
    // if (
    //   findNamed(e.object, "Plane") &&
    //   turnerClickedRef.current &&
    //   !planeAnimStartedRef.current
    // ) {
    //   planeAnimStartedRef.current = true;
    //   if (planeGlowRef.current) planeGlowRef.current.visible = false;
    //   for (let x = 20; x <= 34; x++) {
    //     a[`particle.0${x}Action`]?.reset().play();
    //   }
    // }
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
function WarehouseScene({
  onPlaneFinished,
  onTurnerClicked,
  mutedRef,
  muted,
  resetRef,
}) {
  const controlsRef = useRef(null);

  return (
    <>
      <SceneBackground />
      <ArcadeLights />

      <Suspense fallback={null}>
        <GashaponModel
          controlsRef={controlsRef}
          onPlaneFinished={onPlaneFinished}
          onTurnerClicked={onTurnerClicked}
          mutedRef={mutedRef}
          muted={muted}
          resetRef={resetRef}
        />
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
  const [showNextBtn, setShowNextBtn] = useState(false);
  const [turnerClicked, setTurnerClicked] = useState(false);
  const { muted, setMuted, mutedRef } = useMuted();
  const resetModelRef = useRef(null);
  const menuAudioRef = useRef(null);

  // Lazy-load menu music — crossfade with plane audio based on mute + turnerClicked
  useEffect(() => {
    if (!muted && !turnerClicked) {
      if (!menuAudioRef.current) {
        const audio = new Audio();
        audio.src = "/audio/menu.mp3";
        audio.loop = true;
        audio.preload = "none";
        menuAudioRef.current = audio;
      }
      menuAudioRef.current.volume = 0;
      menuAudioRef.current.play().catch(() => {});
      fadeAudio(menuAudioRef.current, 1, 800);
    } else if (menuAudioRef.current) {
      fadeAudio(menuAudioRef.current, 0, 600);
    }
  }, [muted, turnerClicked]);

  useEffect(() => {
    return () => {
      if (menuAudioRef.current) {
        menuAudioRef.current.pause();
        menuAudioRef.current.src = "";
      }
    };
  }, []);

  const handleNextClick = () => {
    resetModelRef.current?.();
    setShowNextBtn(false);
    setTurnerClicked(false);
  };

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
        </header>

        <div className="fc-viewer-wrap">
          <div className="fc-viewer-label">
            <h2 className="fc-viewer-title">Gashapon</h2>
            <p className="fc-viewer-desc">Click the crank · drag to orbit</p>
          </div>
          <div className="fc-canvas-wrap">
            <Canvas
              camera={{
                position: [0, 1.2, 6],
                fov: 42,
                near: 0.1,
                far: 200,
              }}
              gl={{
                antialias: true,
                alpha: false,
                powerPreference: "high-performance",
                toneMapping: THREE.ACESFilmicToneMapping,
                toneMappingExposure: 1.0,
              }}
              dpr={[1, 1.5]}
            >
              <WarehouseScene
                onPlaneFinished={() => setShowNextBtn(true)}
                onTurnerClicked={() => setTurnerClicked(true)}
                mutedRef={mutedRef}
                muted={muted}
                resetRef={resetModelRef}
              />
            </Canvas>
            <MuteButton muted={muted} onToggle={() => setMuted((m) => !m)} />
            {!turnerClicked && !showNextBtn && (
              <CanvasOverlay
                text="↻ Click crank to draw your character"
                pulse
              />
            )}
            {showNextBtn && (
              <CanvasOverlay text="↺ Draw again" onClick={handleNextClick} />
            )}
          </div>
        </div>

        <div className="fc-body">
          <div className="fc-body-inner">
            <span className="fc-section-eyebrow">Concept</span>
            <h2 className="fc-section-title">Draw Your Tattoo</h2>
            <p className="fc-section-text">
              The gashapon machine is reimagined as a tattoo oracle. Turn the
              crank, and chance decides your character. Each capsule holds a
              design you might wear permanently.
            </p>
            <p className="fc-section-text">
              The campaign sits at the intersection of collectible culture and
              body art. The machine becomes the artist, the wearer becomes the
              canvas, and commitment is the only rule.
            </p>
          </div>
        </div>
      </section>
    </PageWrapper>
  );
}
