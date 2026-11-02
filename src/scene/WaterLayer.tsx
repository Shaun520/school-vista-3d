// 河道与湖面按 layout 数据程序化生成：河道含水面、石岸与人行桥，
// 湖面为椭圆水面 + 环形石岸，两者共用同一套水材质，两端收窄避免生硬断口。
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { layout } from '../data/layout'
import type { Lake, River } from '../types/layout'

const WATER_Y = 0.08
const BANK_Y = 0.1
const SAMPLES = 120
const UV_TILE = 7.5

const COLORS = {
  water: '#397b83',
  ripple: '#5fa5ad',
  bank: '#566b63',
  deck: '#6d5a42',
  rail: '#4a5f58',
}

interface Frame {
  point: THREE.Vector3
  normal: THREE.Vector3
  taper: number
}

function rippleTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = COLORS.water
    ctx.fillRect(0, 0, 128, 128)
    ctx.strokeStyle = COLORS.ripple
    for (let i = 0; i < 18; i += 1) {
      const y = (i * 128) / 18
      ctx.globalAlpha = 0.14 + ((i * 13) % 7) / 30
      ctx.lineWidth = 1 + (i % 3) * 0.6
      ctx.beginPath()
      for (let x = -8; x <= 136; x += 8) {
        const wave = Math.sin((x + i * 23) / 22) * 1.8
        if (x === -8) ctx.moveTo(x, y + wave)
        else ctx.lineTo(x, y + wave)
      }
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.anisotropy = 4
  return texture
}

function buildFrames(river: River) {
  const curve = new THREE.CatmullRomCurve3(
    river.points.map(([x, z]) => new THREE.Vector3(x, 0, z)),
    false,
    'catmullrom',
    0.5,
  )

  const frames: Frame[] = []
  for (let i = 0; i <= SAMPLES; i += 1) {
    const t = i / SAMPLES
    const point = curve.getPointAt(t)
    const tangent = curve.getTangentAt(t)
    tangent.y = 0
    tangent.normalize()

    // 两端 9% 长度内平滑收窄到接近闭合，避免水面被硬切断
    const fade = Math.min(t / 0.09, (1 - t) / 0.09, 1)
    frames.push({
      point,
      normal: new THREE.Vector3(-tangent.z, 0, tangent.x),
      taper: 0.06 + 0.94 * Math.max(0, fade),
    })
  }

  return { curve, frames }
}

// 沿中心线生成条带；A 边始终位于 B 边的西北侧（法线指向 -x），保证面朝上
function buildStrip(
  frames: Frame[],
  offsetA: number,
  offsetB: number,
  y: number,
  uRepeat: number,
) {
  const positions: number[] = []
  const uvs: number[] = []
  const vertices: THREE.Vector3[] = []
  let distance = 0

  frames.forEach((frame, index) => {
    if (index > 0) distance += frame.point.distanceTo(frames[index - 1].point)

    const a = frame.point.clone().addScaledVector(frame.normal, offsetA * frame.taper)
    const b = frame.point.clone().addScaledVector(frame.normal, offsetB * frame.taper)
    a.y = y
    b.y = y
    vertices.push(a, b)

    const v = distance / UV_TILE
    uvs.push(0, v, uRepeat, v)
  })

  for (let i = 0; i < frames.length - 1; i += 1) {
    const a0 = vertices[i * 2]
    const b0 = vertices[i * 2 + 1]
    const a1 = vertices[(i + 1) * 2]
    const b1 = vertices[(i + 1) * 2 + 1]
    positions.push(a0.x, a0.y, a0.z, b1.x, b1.y, b1.z, b0.x, b0.y, b0.z)
    positions.push(a0.x, a0.y, a0.z, a1.x, a1.y, a1.z, b1.x, b1.y, b1.z)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.computeVertexNormals()
  return geometry
}

function buildBridge(curve: THREE.CatmullRomCurve3, river: River) {
  const crossing = river.crossing
  if (!crossing) return null

  // 取最接近桥位的中心线采样点，桥体沿法线方向横跨河道
  let closest = 0
  let best = Number.POSITIVE_INFINITY
  for (let i = 0; i <= SAMPLES; i += 1) {
    const point = curve.getPointAt(i / SAMPLES)
    const delta = Math.abs(point.z - crossing.z)
    if (delta < best) {
      best = delta
      closest = i / SAMPLES
    }
  }

  const center = curve.getPointAt(closest)
  const tangent = curve.getTangentAt(closest)
  const yaw = Math.atan2(-tangent.x, -tangent.z)
  const span = river.width + river.bank * 2 + 2.4
  const halfWidth = crossing.width / 2

  const deck = new THREE.BoxGeometry(span, 0.16, crossing.width)
  deck.translate(0, 0.18, 0)

  const railParts: THREE.BufferGeometry[] = []
  const postCount = 7
  for (const side of [-1, 1]) {
    const z = side * (halfWidth - 0.12)
    for (const railY of [0.5, 0.82]) {
      const rail = new THREE.BoxGeometry(span, 0.08, 0.09)
      rail.translate(0, railY, z)
      railParts.push(rail)
    }
    for (let i = 0; i < postCount; i += 1) {
      const x = -span / 2 + 1.1 + (i * (span - 2.2)) / (postCount - 1)
      const post = new THREE.BoxGeometry(0.1, 0.6, 0.1)
      post.translate(x, 0.56, z)
      railParts.push(post)
    }
  }

  const rail = mergeGeometries(railParts, false) ?? railParts
  if (Array.isArray(rail)) {
    rail.forEach((geometry) => geometry.dispose())
  } else {
    railParts.forEach((geometry) => geometry.dispose())
  }

  return {
    deck,
    rail: rail as THREE.BufferGeometry,
    position: [center.x, 0, center.z] as [number, number, number],
    yaw,
  }
}

// 湖面：不规则岸线水面 + 环形石岸，水面 UV 按世界坐标重算以延续河道纹理尺度
function buildLake(lake: Lake) {
  const [cx, cz] = lake.center
  const [sizeX, sizeZ] = lake.size
  const rx = sizeX / 2
  const rz = sizeZ / 2
  const bank = lake.bank
  const segments = 72

  // 叠加两个低频正弦扰动，让岸线不再是一个规整椭圆
  const shore = (angle: number) =>
    1 + 0.06 * Math.sin(angle * 3 + 0.7) + 0.035 * Math.sin(angle * 5 - 1.4)

  const rim = (scale: number) => {
    const points: number[][] = []
    for (let i = 0; i < segments; i += 1) {
      const angle = (i / segments) * Math.PI * 2
      const k = shore(angle)
      points.push([cx + (rx + scale) * k * Math.cos(angle), cz + (rz + scale) * k * Math.sin(angle)])
    }
    return points
  }

  // 水面用扇形三角面；中心 → 下一个岸点 → 当前岸点，保证面朝 +Y
  const inner = rim(0)
  const waterPositions: number[] = []
  const waterUvs: number[] = [0, 0]
  for (let i = 0; i < segments; i += 1) {
    const p = inner[i]
    const q = inner[(i + 1) % segments]
    waterPositions.push(cx, WATER_Y, cz, q[0], WATER_Y, q[1], p[0], WATER_Y, p[1])
    waterUvs.push((q[0] - cx) / UV_TILE, (q[1] - cz) / UV_TILE)
    waterUvs.push((p[0] - cx) / UV_TILE, (p[1] - cz) / UV_TILE)
  }

  const water = new THREE.BufferGeometry()
  water.setAttribute('position', new THREE.Float32BufferAttribute(waterPositions, 3))
  water.setAttribute('uv', new THREE.Float32BufferAttribute(waterUvs, 2))
  water.setAttribute('normal', new THREE.Float32BufferAttribute(
    Array.from({ length: waterPositions.length / 3 }, () => [0, 1, 0]).flat(),
    3,
  ))

  // 石岸环：内圈 → 外圈，每段两个三角形，法线固定 +Y
  const outer = rim(bank)
  const bankPositions: number[] = []
  const bankNormals: number[] = []
  for (let i = 0; i < segments; i += 1) {
    const i0 = inner[i]
    const i1 = inner[(i + 1) % segments]
    const o0 = outer[i]
    const o1 = outer[(i + 1) % segments]
    for (const [p, q, r] of [
      [i0, i1, o0],
      [i1, o1, o0],
    ] as const) {
      bankPositions.push(p[0], BANK_Y, p[1], q[0], BANK_Y, q[1], r[0], BANK_Y, r[1])
      bankNormals.push(0, 1, 0, 0, 1, 0, 0, 1, 0)
    }
  }

  const bankGeometry = new THREE.BufferGeometry()
  bankGeometry.setAttribute('position', new THREE.Float32BufferAttribute(bankPositions, 3))
  bankGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(bankNormals, 3))

  return { water, bank: bankGeometry }
}

function buildWater(river: River, lake: Lake) {
  const { curve, frames } = buildFrames(river)
  const half = river.width / 2
  const water = buildStrip(frames, half, -half, WATER_Y, 2)
  const bankLeft = buildStrip(frames, half + river.bank, half, BANK_Y, 1)
  const bankRight = buildStrip(frames, -half, -half - river.bank, BANK_Y, 1)
  const bank = mergeGeometries([bankLeft, bankRight], false) ?? bankLeft
  bankLeft.dispose()
  bankRight.dispose()

  const ripple = rippleTexture()
  const bridge = buildBridge(curve, river)
  const lakeMeshes = buildLake(lake)

  const materials = {
    water: new THREE.MeshStandardMaterial({
      map: ripple,
      color: '#9fd0d0',
      roughness: 0.3,
      metalness: 0.28,
    }),
    bank: new THREE.MeshStandardMaterial({ color: COLORS.bank, roughness: 0.95 }),
    deck: new THREE.MeshStandardMaterial({ color: COLORS.deck, roughness: 0.9 }),
    rail: new THREE.MeshStandardMaterial({ color: COLORS.rail, roughness: 0.8 }),
  }

  const dispose = () => {
    water.dispose()
    bank.dispose()
    lakeMeshes.water.dispose()
    lakeMeshes.bank.dispose()
    ripple.dispose()
    bridge?.deck.dispose()
    bridge?.rail.dispose()
    Object.values(materials).forEach((material) => material.dispose())
  }

  return { water, bank, lake: lakeMeshes, bridge, materials, dispose }
}

export function WaterLayer() {
  const river = layout.river
  const lake = layout.lake
  const built = useMemo(() => buildWater(river, lake), [river, lake])

  useEffect(() => () => built.dispose(), [built])

  return (
    <group name="water">
      <mesh geometry={built.water} material={built.materials.water} receiveShadow />
      <mesh geometry={built.bank} material={built.materials.bank} receiveShadow />
      <mesh geometry={built.lake.water} material={built.materials.water} receiveShadow />
      <mesh geometry={built.lake.bank} material={built.materials.bank} receiveShadow />
      {built.bridge ? (
        <group position={built.bridge.position} rotation-y={built.bridge.yaw}>
          <mesh
            geometry={built.bridge.deck}
            material={built.materials.deck}
            castShadow
            receiveShadow
          />
          <mesh geometry={built.bridge.rail} material={built.materials.rail} castShadow />
        </group>
      ) : null}
    </group>
  )
}
