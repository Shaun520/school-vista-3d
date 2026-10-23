import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { Edges } from '@react-three/drei'
import { layout } from '../data/layout'
import type { PlaceholderBuilding } from '../types/layout'

const WINDOW_COLOR = '#0b1a1c'

function createFacadeTexture(color: string, floors: number, width: number) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.fillStyle = color
  ctx.fillRect(0, 0, 256, 256)

  const rows = Math.max(2, Math.min(10, floors))
  const rowHeight = 256 / rows
  for (let row = 0; row < rows; row += 1) {
    const y = row * rowHeight + rowHeight * 0.2
    const height = rowHeight * 0.48
    ctx.fillStyle = WINDOW_COLOR
    ctx.fillRect(0, y, 256, height)
    ctx.fillStyle = 'rgba(255,255,255,0.06)'
    for (let x = 6; x < 256; x += 26) ctx.fillRect(x, y, 2, height)
    ctx.fillStyle = 'rgba(255,255,255,0.05)'
    ctx.fillRect(0, y + height, 256, 2)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.repeat.set(Math.max(2, Math.round(width / 9)), 1)
  texture.anisotropy = 4
  return texture
}

function PlaceholderMesh({ building }: { building: PlaceholderBuilding }) {
  const [width, height, depth] = building.size
  const texture = useMemo(
    () => createFacadeTexture(building.color, building.floors, width),
    [building.color, building.floors, width],
  )

  useEffect(() => () => texture?.dispose(), [texture])

  return (
    <group position={building.position} rotation-y={building.rotationY}>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          map={texture ?? undefined}
          color={texture ? '#ffffff' : building.color}
          roughness={0.86}
          metalness={0.04}
        />
        <Edges scale={1.002} threshold={18} color={building.roofColor} />
      </mesh>
      <mesh position={[0, height + 0.2, 0]} castShadow>
        <boxGeometry args={[width + 0.7, 0.4, depth + 0.7]} />
        <meshStandardMaterial color={building.roofColor} roughness={0.72} metalness={0.12} />
      </mesh>
      <mesh position={[0, 0.25, 0]} receiveShadow>
        <boxGeometry args={[width + 0.8, 0.5, depth + 0.8]} />
        <meshStandardMaterial color="#16262a" roughness={1} />
      </mesh>
    </group>
  )
}

export function PlaceholderLayer() {
  return (
    <group name="placeholders">
      {layout.placeholders.map((building) => (
        <PlaceholderMesh key={building.id} building={building} />
      ))}
    </group>
  )
}
