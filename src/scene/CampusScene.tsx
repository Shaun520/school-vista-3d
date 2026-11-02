// 校园与教室共用的 R3F 画布，按模式切换场景内容、灯光与相机约束。
import { Suspense, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import {
  ADAPTIVE_QUALITY,
  PROFILES,
  resolveRenderDpr,
  resolveRenderTier,
} from '../config/resolution'
import { layout } from '../data/layout'
import { useCampusStore } from '../store/useCampusStore'
import { getViewport, subscribeViewport } from '../utils/viewport'
import { CameraRig } from './CameraRig'
import { ClassroomLayer } from './ClassroomLayer'
import { GreeneryLayer } from './GreeneryLayer'
import { GroundLayer } from './GroundLayer'
import { ModelLayer } from './ModelLayer'
import { PerfProbe } from './PerfProbe'
import { PlaceholderLayer } from './PlaceholderLayer'
import { PlaygroundLayer } from './PlaygroundLayer'
import { PoiLayer } from './PoiLayer'
import { WaterLayer } from './WaterLayer'

function ToneMappingRig({ exposure }: { exposure: number }) {
  const gl = useThree((state) => state.gl)

  useEffect(() => {
    gl.toneMappingExposure = exposure
  }, [gl, exposure])

  return null
}

type AdaptiveDirection = 'up' | 'down'

// 按真实帧率做两级反馈：持续掉帧降一档渲染比例，恢复后再升回一档。
function AdaptiveQualityProbe({
  enabled,
  onChange,
}: {
  enabled: boolean
  onChange: (direction: AdaptiveDirection) => void
}) {
  const age = useRef(0)
  const elapsed = useRef(0)
  const frames = useRef(0)
  const cooldown = useRef(0)

  useFrame((_, delta) => {
    if (!enabled || document.visibilityState !== 'visible') {
      elapsed.current = 0
      frames.current = 0
      return
    }

    // 跳过模型加载与 shader 编译阶段，避免启动瞬间误降画质。
    age.current += delta
    if (age.current < ADAPTIVE_QUALITY.warmupSeconds) return

    elapsed.current += delta
    frames.current += 1
    cooldown.current = Math.max(0, cooldown.current - delta)

    if (elapsed.current < ADAPTIVE_QUALITY.sampleSeconds) return

    const fps = frames.current / elapsed.current
    elapsed.current = 0
    frames.current = 0

    if (cooldown.current > 0) return

    if (fps < ADAPTIVE_QUALITY.declineFps) {
      cooldown.current = ADAPTIVE_QUALITY.cooldownSeconds
      onChange('down')
    } else if (fps > ADAPTIVE_QUALITY.inclineFps) {
      cooldown.current = ADAPTIVE_QUALITY.cooldownSeconds
      onChange('up')
    }
  })

  return null
}

export function CampusScene() {
  const mode = useCampusStore((state) => state.mode)
  const classroomCamera = useCampusStore((state) => state.classroomCamera)
  const quality = useCampusStore((state) => state.settings.quality)
  const shadows = useCampusStore((state) => state.settings.shadows)
  const adaptive = useCampusStore((state) => state.settings.adaptive)
  const viewport = useSyncExternalStore(subscribeViewport, getViewport, getViewport)
  const renderTier = resolveRenderTier(viewport.width, viewport.height, viewport.dpr)
  const profile = PROFILES[renderTier]
  const [adaptiveLevel, setAdaptiveLevel] = useState(0)

  useEffect(() => {
    setAdaptiveLevel(0)
  }, [renderTier, adaptive])

  const adaptiveScale = ADAPTIVE_QUALITY.scales[adaptiveLevel]
  const renderDpr = resolveRenderDpr(
    viewport.width,
    viewport.height,
    viewport.dpr,
    profile,
    quality,
    adaptiveScale,
  )
  const shadowMapSize = quality ? profile.shadowMapSize : Math.min(profile.shadowMapSize, 1024)
  const home = layout.cameras.home
  const isClassroom = mode === 'classroom'

  const changeAdaptiveLevel = (direction: AdaptiveDirection) => {
    setAdaptiveLevel((level) =>
      direction === 'down'
        ? Math.min(ADAPTIVE_QUALITY.scales.length - 1, level + 1)
        : Math.max(0, level - 1),
    )
  }

  return (
    <Canvas
      shadows={shadows}
      resize={{ offsetSize: true }}
      dpr={renderDpr}
      camera={{ fov: 45, near: 0.05, far: 2000, position: home.position }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.28
      }}
    >
      <color attach="background" args={[isClassroom ? '#050b0c' : '#081316']} />
      {isClassroom ? null : <fog attach="fog" args={['#081316', 420, 1100]} />}

      {isClassroom ? (
        <Suspense fallback={null}>
          <ClassroomLayer />
        </Suspense>
      ) : (
        <>
          <ambientLight intensity={0.9} />
          <hemisphereLight args={['#cfe9ff', '#1c2b26', 0.9]} />
          <directionalLight
            key={`shadow-${shadowMapSize}`}
            position={[160, 220, 140]}
            intensity={2.6}
            castShadow={shadows}
            shadow-mapSize={[shadowMapSize, shadowMapSize]}
            shadow-camera-left={-320}
            shadow-camera-right={320}
            shadow-camera-top={320}
            shadow-camera-bottom={-320}
            shadow-camera-near={1}
            shadow-camera-far={900}
            shadow-normalBias={0.02}
          />
          <directionalLight position={[-160, 120, -120]} intensity={0.65} />

          <Suspense fallback={null}>
            <GroundLayer />
            <WaterLayer />
            <GreeneryLayer />
            <PlaceholderLayer />
            <PlaygroundLayer />
            <ModelLayer />
            <PoiLayer />
          </Suspense>
        </>
      )}

      <OrbitControls
        key={mode}
        makeDefault
        enableDamping
        dampingFactor={0.08}
        enablePan={!isClassroom}
        minDistance={isClassroom ? 0.5 : 20}
        maxDistance={isClassroom ? 8 : 700}
        minPolarAngle={isClassroom ? Math.PI / 2.4 : 0}
        maxPolarAngle={isClassroom ? Math.PI / 1.85 : Math.PI / 2.05}
        rotateSpeed={isClassroom ? 0.6 : 1}
        target={
          isClassroom
            ? layout.interiorCameras[classroomCamera].target
            : home.target
        }
      />
      <CameraRig />
      <ToneMappingRig exposure={isClassroom ? 1.04 : 1.28} />
      <AdaptiveQualityProbe enabled={adaptive} onChange={changeAdaptiveLevel} />
      <PerfProbe dpr={renderDpr} adaptiveLevel={adaptiveLevel} />
    </Canvas>
  )
}
