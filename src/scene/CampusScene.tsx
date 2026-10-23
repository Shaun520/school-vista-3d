import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { layout } from '../data/layout'
import { CameraRig } from './CameraRig'
import { GreeneryLayer } from './GreeneryLayer'
import { GroundLayer } from './GroundLayer'
import { ModelLayer } from './ModelLayer'
import { PerfProbe } from './PerfProbe'
import { PlaceholderLayer } from './PlaceholderLayer'
import { PoiLayer } from './PoiLayer'

export function CampusScene() {
  const home = layout.cameras.home

  return (
    <Canvas
      shadows
      resize={{ offsetSize: true }}
      dpr={[1, 1.75]}
      camera={{ fov: 45, near: 0.5, far: 2000, position: home.position }}
      gl={{ antialias: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.28
      }}
    >
      <color attach="background" args={['#081316']} />
      <fog attach="fog" args={['#081316', 420, 1100]} />

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

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        maxPolarAngle={Math.PI / 2.05}
        minDistance={20}
        maxDistance={700}
        target={home.target}
      />
      <CameraRig />
      <PerfProbe />
    </Canvas>
  )
}
