// 教室内场景：按需加载教室 GLB，叠加室内灯光、设备热点与时间联动。
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { layout } from '../data/layout'
import type { ClassroomCameraId } from '../types/layout'
import { useCampusStore } from '../store/useCampusStore'
import { getClassroomLightState } from './classroomLighting'
import { useCampusGLTF } from './useCampusGLTF'
import styles from '../ui/Classroom.module.css'

const LAMP_POSITIONS: Array<[number, number, number]> = [
  [-1.2, 2.72, -0.9],
  [0.8, 2.72, -0.9],
  [2.8, 2.72, -0.9],
  [4.4, 2.72, -0.9],
]

const HOTSPOTS: Array<{
  id: string
  label: string
  position: [number, number, number]
  camera: ClassroomCameraId
}> = [
  { id: 'blackboard', label: '黑板', position: [-2.72, 1.95, -0.05], camera: 'podium' },
  { id: 'projector', label: '投影仪', position: [0.7, 2.75, -0.98], camera: 'seats' },
  { id: 'camera', label: '监控', position: [-2.35, 2.55, -2.95], camera: 'door' },
  { id: 'door', label: '后门', position: [4.25, 1.9, 1.55], camera: 'door' },
]

function ClassroomModel() {
  const model = layout.interiors[0]
  const { scene } = useCampusGLTF(model.url)
  const threeScene = useThree((state) => state.scene)
  const setClassroomReady = useCampusStore((state) => state.setClassroomReady)
  const hour = useCampusStore((state) => state.classroomTime)
  const light = getClassroomLightState(hour)

  useEffect(() => {
    setClassroomReady(true)
  }, [scene, setClassroomReady])

  const prepared = useMemo(() => {
    const root = scene.clone(true)
    root.updateMatrixWorld(true)

    const box = new THREE.Box3().setFromObject(root)
    const center = box.getCenter(new THREE.Vector3())
    const offset: [number, number, number] = [
      model.centerXZ ? -center.x : 0,
      model.snapToGround ? -box.min.y : 0,
      model.centerXZ ? -center.z : 0,
    ]

    root.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = false
        child.receiveShadow = true
      }
    })

    return { root, offset }
  }, [scene, model.centerXZ, model.snapToGround])

  // 模型内置了“guang”阳光光束材质，只在上午可见，午后与夜间整体隐藏。
  useEffect(() => {
    const visible = light.sunlight > 0.01
    threeScene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      const sunbeam = materials.find((material) => material?.name === 'Material')
      if (!sunbeam) return
      object.visible = visible
      sunbeam.transparent = true
      sunbeam.opacity = visible ? Math.min(1, light.sunlight) : 0
      sunbeam.needsUpdate = true
    })
  }, [threeScene, scene, light.sunlight])

  return <primitive object={prepared.root} position={prepared.offset} />
}

function ClassroomLights() {
  const hour = useCampusStore((state) => state.classroomTime)
  const light = getClassroomLightState(hour)
  const sunRef = useRef<THREE.DirectionalLight>(null)

  useEffect(() => {
    const sun = sunRef.current
    if (!sun) return
    sun.target.position.set(1.2, 1.1, -0.9)
    sun.target.updateMatrixWorld()
  }, [])

  return (
    <>
      <ambientLight intensity={light.ambient} color="#cfe1e6" />
      <hemisphereLight args={['#d9e9ff', '#2a1c18', 0.05 + light.daylight * 0.4]} />
      <directionalLight
        ref={sunRef}
        position={[0, 9, -14]}
        intensity={light.sunIntensity}
        color={light.sunColor}
      />
      <directionalLight
        position={[0, 5, 9]}
        intensity={0.06 + light.daylight * 0.18}
        color="#bcd8ff"
      />

      {LAMP_POSITIONS.map((position, index) => (
        <group key={`lamp-${index}`}>
          <pointLight
            position={position}
            intensity={light.lampLevel * 3.2}
            distance={5.6}
            decay={2}
            color="#ffe3ad"
          />
          <mesh position={[position[0], 3.02, position[2]]}>
            <boxGeometry args={[0.16, 0.04, 3.6]} />
            <meshStandardMaterial
              color="#f4ead3"
              emissive="#ffe0a3"
              emissiveIntensity={0.08 + light.lampLevel * 3}
            />
          </mesh>
        </group>
      ))}
    </>
  )
}

function ClassroomHotspots() {
  const setClassroomCamera = useCampusStore((state) => state.setClassroomCamera)
  const showToast = useCampusStore((state) => state.showToast)

  return (
    <>
      {HOTSPOTS.map((hotspot) => (
        <Html
          key={hotspot.id}
          position={hotspot.position}
          center
          zIndexRange={[28, 0]}
        >
          <button
            type="button"
            className={styles.hotspot}
            data-hotspot={hotspot.id}
            onClick={() => {
              setClassroomCamera(hotspot.camera)
              showToast(`已定位：${hotspot.label}`)
            }}
          >
            <i />
            {hotspot.label}
          </button>
        </Html>
      ))}
    </>
  )
}

export function ClassroomLayer() {
  return (
    <group name="classroom-interior">
      <ClassroomModel />
      <ClassroomLights />
      <ClassroomHotspots />
    </group>
  )
}
