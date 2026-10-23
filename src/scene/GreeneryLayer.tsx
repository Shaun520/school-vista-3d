import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { layout } from '../data/layout'
import type { GroundPatch } from '../types/layout'

function Patch({
  patch,
  material,
  y,
}: {
  patch: GroundPatch
  material: THREE.Material
  y: number
}) {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, patch.rotationY ?? 0]}
      position={[patch.center[0], y, patch.center[1]]}
      receiveShadow
      material={material}
    >
      <planeGeometry args={patch.size} />
    </mesh>
  )
}

export function GreeneryLayer() {
  const trunkRef = useRef<THREE.InstancedMesh>(null)
  const canopyRef = useRef<THREE.InstancedMesh>(null)

  const lawnMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#1b4a34', roughness: 1 }),
    [],
  )
  const flowerMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#b06a86', roughness: 0.9 }),
    [],
  )
  const trunkGeometry = useMemo(() => new THREE.CylinderGeometry(0.22, 0.32, 2.6, 6), [])
  const trunkMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#5b4631', roughness: 1 }),
    [],
  )
  const canopyGeometry = useMemo(() => new THREE.IcosahedronGeometry(2.2, 1), [])
  const canopyMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#2f7a52',
        roughness: 1,
        flatShading: true,
      }),
    [],
  )

  useEffect(
    () => () => {
      lawnMaterial.dispose()
      flowerMaterial.dispose()
      trunkGeometry.dispose()
      trunkMaterial.dispose()
      canopyGeometry.dispose()
      canopyMaterial.dispose()
    },
    [
      lawnMaterial,
      flowerMaterial,
      trunkGeometry,
      trunkMaterial,
      canopyGeometry,
      canopyMaterial,
    ],
  )

  useLayoutEffect(() => {
    const trunk = trunkRef.current
    const canopy = canopyRef.current
    if (!trunk || !canopy) return

    const dummy = new THREE.Object3D()

    layout.trees.forEach(([x, z], index) => {
      const scale = 0.85 + (((index * 37) % 11) / 11) * 0.4
      const rotation = (index * 1.7) % Math.PI

      dummy.position.set(x, 1.3 * scale, z)
      dummy.rotation.set(0, rotation, 0)
      dummy.scale.setScalar(scale)
      dummy.updateMatrix()
      trunk.setMatrixAt(index, dummy.matrix)

      dummy.position.set(x, 3.4 * scale, z)
      dummy.scale.set(scale * 1.05, scale * 1.15, scale * 1.05)
      dummy.updateMatrix()
      canopy.setMatrixAt(index, dummy.matrix)
    })

    trunk.instanceMatrix.needsUpdate = true
    canopy.instanceMatrix.needsUpdate = true
    trunk.computeBoundingSphere()
    canopy.computeBoundingSphere()
  }, [])

  const treeCount = layout.trees.length

  return (
    <group name="greenery">
      {layout.lawns.map((patch, index) => (
        <Patch
          key={`lawn-${index}`}
          patch={patch}
          material={lawnMaterial}
          y={0.012}
        />
      ))}

      {layout.flowers.map((patch, index) => (
        <Patch
          key={`flower-${index}`}
          patch={patch}
          material={flowerMaterial}
          y={0.045}
        />
      ))}

      <instancedMesh
        ref={trunkRef}
        args={[trunkGeometry, trunkMaterial, treeCount]}
        castShadow
        frustumCulled={false}
      />
      <instancedMesh
        ref={canopyRef}
        args={[canopyGeometry, canopyMaterial, treeCount]}
        castShadow
        frustumCulled={false}
      />
    </group>
  )
}
