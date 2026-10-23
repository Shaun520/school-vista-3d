// 校园与教室共用的 R3F 画布，按模式切换场景内容、灯光与相机约束。
import { Suspense, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { layout } from '../data/layout'
import { useCampusStore } from '../store/useCampusStore'
import { CameraRig } from './CameraRig'
import { ClassroomLayer } from './ClassroomLayer'
import { GreeneryLayer } from './GreeneryLayer'
import { GroundLayer } from './GroundLayer'
import { ModelLayer } from './ModelLayer'
import { PerfProbe } from './PerfProbe'
import { PlaceholderLayer } from './PlaceholderLayer'
import { PoiLayer } from './PoiLayer'

function ToneMappingRig({ exposure }: { exposure: number }) {
  const gl = useThree((state) => state.gl)

  useEffect(() => {
    gl.toneMappingExposure = exposure
  }, [gl, exposure])

  return null
}

export function CampusScene() {
  const mode = useCampusStore((state) => state.mode)
  const classroomCamera = useCampusStore((state) => state.classroomCamera)
  const home = layout.cameras.home
  const isClassroom = mode === 'classroom'

  return (
    <Canvas
      shadows
      resize={{ offsetSize: true }}
      dpr={[1, 1.75]}
      camera={{ fov: 45, near: 0.05, far: 2000, position: home.position }}
      gl={{ antialias: true }}
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
            position={[160, 220, 140]}
            intensity={2.6}
            castShadow
            shadow-mapSize={[2048, 2048]}
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
            <GreeneryLayer />
            <PlaceholderLayer />
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
      <PerfProbe />
    </Canvas>
  )
}
