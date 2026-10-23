import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import type { Vector3 } from 'three'
import { layout } from '../data/layout'
import { useCampusStore } from '../store/useCampusStore'

interface ControlsLike {
  target: Vector3
  update: () => void
}

export function CameraRig() {
  const camera = useThree((state) => state.camera)
  const controls = useThree((state) => state.controls) as ControlsLike | null
  const preset = useCampusStore((state) => state.cameraPreset)
  const moveId = useCampusStore((state) => state.cameraMoveId)

  useEffect(() => {
    const config = layout.cameras[preset]
    if (!config) return
    camera.position.set(...config.position)
    if (controls) {
      controls.target.set(...config.target)
      controls.update()
    }
  }, [camera, controls, preset, moveId])

  return null
}
