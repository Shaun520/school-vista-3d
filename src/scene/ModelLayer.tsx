import { useMemo } from 'react'
import * as THREE from 'three'
import { layout } from '../data/layout'
import type { LayoutModel } from '../types/layout'
import { useCampusGLTF } from './useCampusGLTF'

function NormalizedModel({ model }: { model: LayoutModel }) {
  const { scene } = useCampusGLTF(model.url)

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
        child.castShadow = model.castShadow
        child.receiveShadow = true
        if (model.stripNormalMaps) {
          const original = child.material as THREE.MeshStandardMaterial
          const cloned = original.clone()
          cloned.normalMap = null
          cloned.normalScale.set(1, 1)
          child.material = cloned
        }
      }
    })

    return { root, offset }
  }, [scene, model.centerXZ, model.snapToGround, model.castShadow, model.stripNormalMaps])

  return (
    <group position={model.position} rotation-y={model.rotationY}>
      <primitive object={prepared.root} position={prepared.offset} />
    </group>
  )
}

export function ModelLayer() {
  return (
    <group name="exterior">
      {layout.models.map((model) => (
        <NormalizedModel key={model.id} model={model} />
      ))}
    </group>
  )
}
