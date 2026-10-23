// 相机机位控制：室外预设与教室机位共用一套平滑过渡逻辑。
import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { layout } from '../data/layout'
import { useCampusStore } from '../store/useCampusStore'

interface ControlsLike {
  target: THREE.Vector3
  update: () => void
}

export function CameraRig() {
  const camera = useThree((state) => state.camera)
  const controls = useThree((state) => state.controls) as ControlsLike | null
  const mode = useCampusStore((state) => state.mode)
  const preset = useCampusStore((state) => state.cameraPreset)
  const classroomCamera = useCampusStore((state) => state.classroomCamera)
  const moveId = useCampusStore((state) => state.cameraMoveId)
  const targetPosition = useRef(new THREE.Vector3())
  const targetLookAt = useRef(new THREE.Vector3())
  const moving = useRef(false)
  const previousMode = useRef<string | null>(null)

  useEffect(() => {
    const config =
      mode === 'classroom'
        ? layout.interiorCameras[classroomCamera]
        : layout.cameras[preset]
    if (!config) return

    const perspective = camera as THREE.PerspectiveCamera
    perspective.near = mode === 'classroom' ? 0.05 : 0.5
    perspective.far = mode === 'classroom' ? 240 : 2000
    perspective.updateProjectionMatrix()

    targetPosition.current.set(...config.position)
    targetLookAt.current.set(...config.target)

    const modeChanged = previousMode.current !== mode
    previousMode.current = mode

    if (modeChanged || !controls) {
      camera.position.copy(targetPosition.current)
      camera.lookAt(targetLookAt.current)
      if (controls) {
        controls.target.copy(targetLookAt.current)
        controls.update()
      }
      moving.current = false
    } else {
      moving.current = true
    }
  }, [camera, controls, mode, preset, classroomCamera, moveId])

  useFrame((_, delta) => {
    if (!moving.current) return

    const t = 1 - Math.exp(-6 * Math.min(delta, 0.05))
    camera.position.lerp(targetPosition.current, t)

    if (controls) {
      controls.target.lerp(targetLookAt.current, t)
      controls.update()
    }

    const arrived = camera.position.distanceTo(targetPosition.current) < 0.01
    const targetArrived = !controls || controls.target.distanceTo(targetLookAt.current) < 0.01
    if (arrived && targetArrived) moving.current = false
  })

  return null
}
