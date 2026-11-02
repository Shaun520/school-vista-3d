// 树木与地被：树木由 ez-tree（MIT）程序化生成后实例化，
// 草叶模型取自其 grass.glb，只在草坪区域散布，配合地面噪声材质形成自然地表。
import { useEffect, useMemo } from 'react'
import { useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Tree } from '@dgreenheck/ez-tree'
import { layout } from '../data/layout'
import type { GroundPatch } from '../types/layout'

const GRASS_URL = '/assets/campus/ez/grass.glb'

// 三种树型，分别缩放到校园乔木高度；压低枝干细分以支撑数百棵实例
const TREE_VARIANTS = [
  {
    preset: 'Oak Small',
    seed: 1337,
    height: 11,
    leaves: 32,
    leafSize: 3.6,
    children: { 0: 4, 1: 2, 2: 3 },
  },
  {
    preset: 'Ash Medium',
    seed: 4242,
    height: 13,
    leaves: 26,
    leafSize: 5.0,
    children: { 0: 5, 1: 4, 2: 2 },
  },
  {
    preset: 'Ash Small',
    seed: 909,
    height: 10,
    leaves: 30,
    leafSize: 4.2,
    children: { 0: 4, 1: 3, 2: 2 },
  },
]

interface TreeVariant {
  branches: THREE.BufferGeometry
  leaves: THREE.BufferGeometry
  bark: THREE.MeshStandardMaterial
  leaf: THREE.MeshStandardMaterial
}

function insideRect(
  x: number,
  z: number,
  center: [number, number],
  size: [number, number],
  margin = 0,
) {
  return (
    Math.abs(x - center[0]) <= size[0] / 2 + margin &&
    Math.abs(z - center[1]) <= size[1] / 2 + margin
  )
}

// 草叶只铺在未硬化的绿地上：避开道路、铺装、建筑、操场与水面
function canPlaceGrass(x: number, z: number) {
  for (const road of layout.roads) {
    if (insideRect(x, z, [road.center[0], road.center[2]], road.size, 0.8)) return false
  }
  for (const path of layout.paths) {
    if (insideRect(x, z, [path.center[0], path.center[2]], path.size, 0.6)) return false
  }
  for (const model of layout.models) {
    if (
      insideRect(
        x,
        z,
        [model.position[0], model.position[2]],
        [model.bounds.size[0], model.bounds.size[2]],
        1,
      )
    ) {
      return false
    }
  }
  for (const block of layout.placeholders) {
    if (insideRect(x, z, [block.position[0], block.position[2]], [block.size[0], block.size[2]], 1)) {
      return false
    }
  }
  for (const flower of layout.flowers) {
    if (insideRect(x, z, [flower.center[0], flower.center[1]], flower.size, 0.5)) return false
  }
  for (const plaza of layout.plazas) {
    if (Math.hypot(x - plaza.center[0], z - plaza.center[1]) < plaza.radius + 1) return false
  }

  const playground = layout.playground
  if (
    insideRect(
      x,
      z,
      [playground.center[0], playground.center[1]],
      [playground.size[0], playground.size[1]],
      1,
    )
  ) {
    return false
  }
  if (
    insideRect(
      x,
      z,
      [layout.parking.center[0], layout.parking.center[1]],
      layout.parking.size,
      1,
    )
  ) {
    return false
  }

  const lake = layout.lake
  const lakeX = (x - lake.center[0]) / (lake.size[0] / 2 + lake.bank + 1)
  const lakeZ = (z - lake.center[1]) / (lake.size[1] / 2 + lake.bank + 1)
  if (lakeX * lakeX + lakeZ * lakeZ < 1) return false

  // 东侧河道走廊
  if (x > 183 && x < 216 && z > -147 && z < 0) return false

  return true
}

// 确定性随机，保证每次渲染的草叶分布一致
function scatterGrass() {
  let seed = 20261101
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }

  const spots: [number, number, number][] = []
  layout.lawns.forEach((lawn) => {
    const [width, depth] = lawn.size
    const count = Math.round(width * depth * 0.5)
    for (let i = 0; i < count; i += 1) {
      const x = lawn.center[0] + (rand() - 0.5) * width
      const z = lawn.center[1] + (rand() - 0.5) * depth
      if (!canPlaceGrass(x, z)) continue
      spots.push([x, z, rand()])
    }
  })
  return spots
}

function createTreeVariant(definition: (typeof TREE_VARIANTS)[number]): TreeVariant {
  const tree = new Tree()
  tree.loadPreset(definition.preset)

  const options = tree.options
  options.seed = definition.seed
  options.branch.levels = 3
  options.branch.children = definition.children
  options.branch.sections = { 0: 5, 1: 4, 2: 3, 3: 2 }
  options.branch.segments = { 0: 6, 1: 4, 2: 3, 3: 2 }
  options.leaves.count = definition.leaves
  options.leaves.size = definition.leafSize
  options.leaves.billboard = 'Single'
  tree.generate()

  const branches = tree.branchesMesh.geometry.clone()
  const leaves = tree.leavesMesh.geometry.clone()

  // 统一缩放到目标树高，树根落在 y=0
  branches.computeBoundingBox()
  const box = branches.boundingBox as THREE.Box3
  const scale = definition.height / (box.max.y - box.min.y)
  branches.translate(0, -box.min.y, 0)
  branches.scale(scale, scale, scale)
  leaves.scale(scale, scale, scale)
  branches.computeBoundingSphere()
  leaves.computeBoundingSphere()

  const barkSource = tree.branchesMesh.material as THREE.MeshPhongMaterial
  const leafSource = tree.leavesMesh.material as THREE.MeshPhongMaterial

  const bark = new THREE.MeshStandardMaterial({
    map: barkSource.map,
    normalMap: barkSource.normalMap,
    color: barkSource.color,
    roughness: 0.92,
    metalness: 0,
  })
  const leaf = new THREE.MeshStandardMaterial({
    map: leafSource.map,
    color: '#ffffff',
    alphaTest: 0.42,
    side: THREE.DoubleSide,
    roughness: 1,
    metalness: 0,
  })

  tree.branchesMesh.geometry.dispose()
  tree.leavesMesh.geometry.dispose()
  barkSource.dispose()
  leafSource.dispose()

  return { branches, leaves, bark, leaf }
}

function buildGrass(gltf: GLTF) {
  const source = gltf.scene.children[0] as THREE.Mesh
  const material = new THREE.MeshStandardMaterial({
    map: (source.material as THREE.MeshStandardMaterial).map,
    color: '#7d9c59',
    alphaTest: 0.35,
    side: THREE.DoubleSide,
    roughness: 1,
    metalness: 0,
  })

  const spots = scatterGrass()
  const mesh = new THREE.InstancedMesh(source.geometry, material, spots.length)
  const dummy = new THREE.Object3D()
  const tint = new THREE.Color()

  spots.forEach(([x, z, random], index) => {
    const height = 0.35 + random * 0.2
    dummy.position.set(x, -0.06, z)
    dummy.rotation.set(0, random * Math.PI * 2, 0)
    dummy.scale.set(height * 0.8, height, height * 0.8)
    dummy.updateMatrix()
    mesh.setMatrixAt(index, dummy.matrix)

    tint.setRGB(0.85 + random * 0.15, 0.95 + random * 0.05, 0.8 + random * 0.2)
    mesh.setColorAt(index, tint)
  })

  mesh.instanceMatrix.needsUpdate = true
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  mesh.receiveShadow = true
  mesh.frustumCulled = false
  return mesh
}

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
  const grassGltf = useLoader(GLTFLoader, GRASS_URL)
  const flowerMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#9c7f8a', roughness: 0.9 }),
    [],
  )

  const grassMesh = useMemo(() => buildGrass(grassGltf), [grassGltf])

  const treeGroups = useMemo(() => {
    const variants = TREE_VARIANTS.map(createTreeVariant)
    const placements: [number, number][][] = variants.map(() => [])

    layout.trees.forEach(([x, z], index) => {
      placements[(index * 7) % variants.length].push([x, z])
    })

    const dummy = new THREE.Object3D()
    const tint = new THREE.Color()

    return variants.map((variant, variantIndex) => {
      const spots = placements[variantIndex]
      const barkMesh = new THREE.InstancedMesh(variant.branches, variant.bark, spots.length)
      const leafMesh = new THREE.InstancedMesh(variant.leaves, variant.leaf, spots.length)

      spots.forEach(([x, z], index) => {
        const hash = ((index * 59 + variantIndex * 31) % 100) / 100
        dummy.position.set(x, 0, z)
        dummy.rotation.set(0, hash * Math.PI * 2, 0)
        dummy.scale.setScalar(0.85 + hash * 0.3)
        dummy.updateMatrix()
        barkMesh.setMatrixAt(index, dummy.matrix)
        leafMesh.setMatrixAt(index, dummy.matrix)

        tint.setRGB(0.9 + hash * 0.1, 0.94 + hash * 0.06, 0.82 + hash * 0.12)
        leafMesh.setColorAt(index, tint)
      })

      barkMesh.instanceMatrix.needsUpdate = true
      leafMesh.instanceMatrix.needsUpdate = true
      if (leafMesh.instanceColor) leafMesh.instanceColor.needsUpdate = true
      barkMesh.castShadow = true
      barkMesh.receiveShadow = true
      leafMesh.castShadow = true
      barkMesh.frustumCulled = false
      leafMesh.frustumCulled = false

      const group = new THREE.Group()
      group.add(barkMesh, leafMesh)
      return group
    })
  }, [])

  useEffect(
    () => () => {
      flowerMaterial.dispose()
      grassMesh.material.dispose()
      grassMesh.dispose()
      treeGroups.forEach((group) => {
        group.traverse((object) => {
          if (object instanceof THREE.InstancedMesh) {
            object.geometry.dispose()
            ;(object.material as THREE.Material).dispose()
            object.dispose()
          }
        })
      })
    },
    [flowerMaterial, grassMesh, treeGroups],
  )

  return (
    <group name="greenery">
      {layout.flowers.map((patch, index) => (
        <Patch
          key={`flower-${index}`}
          patch={patch}
          material={flowerMaterial}
          y={0.045}
        />
      ))}

      <primitive object={grassMesh} />
      {treeGroups.map((group) => (
        <primitive key={group.uuid} object={group} />
      ))}
    </group>
  )
}
