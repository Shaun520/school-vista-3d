import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { layout } from '../data/layout'
import { CameraRig } from './CameraRig'
import { GroundLayer } from './GroundLayer'
import { ModelLayer } from './ModelLayer'
import { PerfProbe } from './PerfProbe'
import { PoiLayer } from './PoiLayer'

export function CampusScene() {
  const home = layout.cameras.home

  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ fov: 45, near: 0.5, far: 2000, position: home.position }}
      gl={{ antialias: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.28
      }}
    >
      <color attach="background" args={['#081316']} />
      <fog attach="fog" args={['#081316', 320, 900]} />

      <ambientLight intensity={0.9} />
      <hemisphereLight args={['#cfe9ff', '#1c2b26', 0.9]} />
      <directionalLight
        position={[140, 190, 110]}
        intensity={2.6}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-260}
        shadow-camera-right={260}
        shadow-camera-top={260}
        shadow-camera-bottom={-260}
        shadow-camera-near={1}
        shadow-camera-far={800}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[-160, 120, -120]} intensity={0.65} />

      <Suspense fallback={null}>
        <GroundLayer />
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
