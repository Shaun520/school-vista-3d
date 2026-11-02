// 六栋占位建筑按参考项目 gxu-campus-3d 的做法改为参数化低模：
// 每栋独立的体量组合（裙楼/塔楼、檐口线脚、入口门廊、竖向构件、屋面设备），
// 立面贴图按世界尺寸铺贴窗带，几何按材质合并以控制 draw call 与面数。
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { Edges } from '@react-three/drei'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { layout } from '../data/layout'
import type { PlaceholderBuilding } from '../types/layout'

type Bucket = 'wall' | 'trim' | 'glass' | 'base'
type Tile = [number, number]

interface Part {
  bucket: Bucket
  geometry: THREE.BufferGeometry
}

interface Built {
  wall?: THREE.BufferGeometry
  trim?: THREE.BufferGeometry
  glass?: THREE.BufferGeometry
  base?: THREE.BufferGeometry
  facade: THREE.CanvasTexture
}

// 每个贴图 tile 对应的真实开间与层高（米），用于把 UV 换算成整开间/整层。
const TILES: Record<string, Tile> = {
  library: [3.6, 4.4],
  history: [3.4, 3.0],
  lab: [3.2, 3.6],
  gym: [3.6, 4.3],
  canteen: [3.0, 2.6],
  dorm: [3.0, 3.1],
}

const DEFAULT_TILE: Tile = [3.2, 3.5]

function slab(
  bucket: Bucket,
  size: [number, number, number],
  at: [number, number, number],
  tile?: Tile,
): Part {
  const [width, height, depth] = size
  const geometry = new THREE.BoxGeometry(width, height, depth)

  if (tile) {
    const [bay, storey] = tile
    const uv = geometry.attributes.uv as THREE.BufferAttribute
    // BoxGeometry 面序：+x、-x、+y、-y、+z、-z，每面 4 个顶点
    const spans: Array<[number, number]> = [
      [depth, height],
      [depth, height],
      [width, depth],
      [width, depth],
      [width, height],
      [width, height],
    ]
    spans.forEach(([spanU, spanV], face) => {
      const repeatU = Math.max(1, Math.round(spanU / bay))
      const repeatV = Math.max(1, Math.round(spanV / storey))
      for (let i = face * 4; i < face * 4 + 4; i += 1) {
        uv.setXY(i, uv.getX(i) * repeatU, uv.getY(i) * repeatV)
      }
    })
    uv.needsUpdate = true
  }

  geometry.translate(at[0], at[1], at[2])
  return { bucket, geometry }
}

function solid(
  bucket: Bucket,
  geometry: THREE.BufferGeometry,
): Part {
  return { bucket, geometry }
}

// 四坡檐口：用四棱台近似，底面正好落在建筑外轮廓内
function hipRoof(width: number, depth: number, baseY: number, height: number, topRatio = 0.34) {
  const geometry = new THREE.CylinderGeometry(Math.SQRT2 * topRatio, Math.SQRT2, height, 4, 1)
  geometry.rotateY(Math.PI / 4)
  geometry.scale(width / 2, 1, depth / 2)
  geometry.translate(0, baseY + height / 2, 0)
  return geometry
}

// 体育馆拱顶：横截面为半椭圆，沿进深方向拉伸成实体拱壳
function archVault(span: number, depth: number, baseY: number, rise: number, segments = 16) {
  const shape = new THREE.Shape()
  shape.moveTo(-span / 2, baseY)
  for (let i = 1; i <= segments; i += 1) {
    const angle = Math.PI * (1 - i / segments)
    shape.lineTo((span / 2) * Math.cos(angle), baseY + rise * Math.sin(angle))
  }
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    curveSegments: 1,
  })
  geometry.translate(0, 0, -depth / 2)
  return geometry
}

function glassPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const gradient = ctx.createLinearGradient(x, y, x, y + height)
  gradient.addColorStop(0, '#16363f')
  gradient.addColorStop(0.52, '#0a1d22')
  gradient.addColorStop(1, '#143139')
  ctx.fillStyle = gradient
  ctx.fillRect(x, y, width, height)
  ctx.fillStyle = 'rgba(255,255,255,0.1)'
  ctx.fillRect(x, y, width, 2)
}

// 每栋一版立面贴图：一个 tile = 一开间 × 一层
function paintFacade(ctx: CanvasRenderingContext2D, id: string, color: string) {
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 256, 256)
  ctx.fillStyle = 'rgba(255,255,255,0.05)'
  ctx.fillRect(0, 246, 256, 10)

  if (id === 'library') {
    // 石材壁柱 + 竖向长窗
    ctx.fillStyle = 'rgba(0,0,0,0.3)'
    ctx.fillRect(0, 0, 14, 256)
    ctx.fillRect(242, 0, 14, 256)
    glassPanel(ctx, 20, 40, 216, 168)
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    for (let x = 20 + 43; x < 236; x += 43) ctx.fillRect(x, 40, 4, 168)
    ctx.fillStyle = 'rgba(255,255,255,0.14)'
    ctx.fillRect(14, 208, 228, 5)
  } else if (id === 'history') {
    // 横向石缝 + 拱窗
    ctx.fillStyle = 'rgba(255,255,255,0.045)'
    for (let y = 32; y < 256; y += 32) ctx.fillRect(0, y, 256, 2)

    const x = 88
    const width = 80
    const top = 58
    const bottom = 206
    ctx.beginPath()
    ctx.moveTo(x, top + 34)
    ctx.arc(x + width / 2, top + 34, width / 2, Math.PI, 0, true)
    ctx.lineTo(x + width, bottom)
    ctx.lineTo(x, bottom)
    ctx.closePath()
    ctx.fillStyle = '#101c20'
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.24)'
    ctx.lineWidth = 5
    ctx.stroke()
    ctx.fillStyle = 'rgba(255,255,255,0.12)'
    ctx.fillRect(70, bottom + 6, 116, 6)
  } else if (id === 'lab') {
    // 横向带窗 + 窗间墙
    glassPanel(ctx, 4, 62, 248, 88)
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    for (let x = 4; x < 252; x += 31) ctx.fillRect(x, 62, 3, 88)
    ctx.fillStyle = 'rgba(255,255,255,0.12)'
    ctx.fillRect(0, 150, 256, 4)
    ctx.fillStyle = 'rgba(0,0,0,0.24)'
    ctx.fillRect(0, 156, 256, 14)
  } else if (id === 'gym') {
    // 金属板横缝 + 高侧窗
    ctx.fillStyle = 'rgba(255,255,255,0.05)'
    for (let y = 0; y < 256; y += 36) ctx.fillRect(0, y, 256, 2)
    glassPanel(ctx, 0, 26, 256, 58)
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    for (let x = 0; x < 256; x += 42) ctx.fillRect(x, 26, 3, 58)
  } else if (id === 'canteen') {
    // 上层窗带 + 陶土遮阳百叶
    glassPanel(ctx, 10, 30, 236, 74)
    ctx.fillStyle = 'rgba(0,0,0,0.45)'
    for (let x = 10; x < 246; x += 30) ctx.fillRect(x, 30, 3, 74)
    ctx.fillStyle = 'rgba(255,255,255,0.075)'
    for (let y = 116; y < 246; y += 14) ctx.fillRect(0, y, 256, 4)
  } else if (id === 'dorm') {
    // 分户墙 + 宿舍方窗 + 阳台栏板带
    ctx.fillStyle = 'rgba(0,0,0,0.3)'
    ctx.fillRect(0, 0, 10, 256)
    ctx.fillRect(246, 0, 10, 256)
    glassPanel(ctx, 34, 38, 188, 150)
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillRect(124, 38, 5, 150)
    ctx.fillStyle = 'rgba(0,0,0,0.34)'
    ctx.fillRect(22, 194, 212, 18)
    ctx.fillStyle = 'rgba(255,255,255,0.14)'
    ctx.fillRect(22, 194, 212, 3)
  }
}

function createFacadeTexture(id: string, color: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (ctx) paintFacade(ctx, id, color)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.anisotropy = 4
  return texture
}

// 图书馆：三层裙楼 + 退台塔楼 + 通高玻璃中庭 + 入口柱廊
function library(tile: Tile): Part[] {
  const parts: Part[] = []
  parts.push(slab('base', [54, 0.5, 30], [0, 0.25, 0]))
  parts.push(slab('wall', [52, 12.5, 29], [0, 6.75, 0], tile))
  parts.push(slab('trim', [53.2, 0.6, 30], [0, 13.3, 0]))
  parts.push(slab('wall', [38, 4.9, 22], [0, 16.05, 0], tile))
  parts.push(slab('trim', [39, 0.5, 23], [0, 18.75, 0]))

  // 入口：通高玻璃门厅悬挑雨棚，柱廊落在雨棚外缘
  parts.push(slab('glass', [16, 5.2, 0.45], [0, 3.1, 14.725]))
  parts.push(slab('trim', [22, 0.4, 2.4], [0, 5.9, 13.3]))
  ;[-9, -3, 3, 9].forEach((x) => {
    parts.push(slab('trim', [0.5, 5.2, 0.5], [x, 3.1, 12.9]))
  })
  for (let x = -16; x <= 16; x += 4) {
    parts.push(slab('trim', [0.3, 4.9, 0.5], [x, 16.05, 11.1]))
  }
  return parts
}

// 校史馆：低层展馆 + 四坡挑檐 + 门廊与台阶
function history(tile: Tile): Part[] {
  const parts: Part[] = []
  parts.push(slab('base', [40, 0.5, 24], [0, 0.25, 0]))
  parts.push(slab('wall', [37.6, 6.0, 21.6], [0, 3.5, 0], tile))
  parts.push(slab('trim', [38.4, 0.4, 22.4], [0, 4.4, 0]))
  parts.push(solid('trim', hipRoof(40, 24, 6.5, 1.5)))

  parts.push(slab('trim', [12, 0.3, 2.4], [0, 0.15, 10.9]))
  ;[-4.5, -1.5, 1.5, 4.5].forEach((x) => {
    parts.push(slab('trim', [0.45, 4.9, 0.6], [x, 2.75, 11.4]))
  })
  parts.push(slab('trim', [10, 0.5, 1.4], [0, 5.45, 11.4]))
  return parts
}

// 综合实验楼：长板楼 + 竖向设备塔 + 屋面机组 + 入口门厅
function lab(tile: Tile): Part[] {
  const parts: Part[] = []
  parts.push(slab('base', [64, 0.5, 24], [0, 0.25, 0]))
  parts.push(slab('wall', [62, 17.5, 22], [0, 9.25, 0], tile))
  parts.push(slab('trim', [63.5, 0.6, 23], [0, 18.3, 0]))

  parts.push(slab('wall', [12, 19.9, 12], [26, 10.45, 0], tile))
  parts.push(slab('trim', [12, 0.3, 12], [26, 20.55, 0]))
  ;[14.5, 16.5, 18.5].forEach((y) => {
    parts.push(slab('trim', [11.6, 0.25, 12.2], [26, y, 0]))
  })

  parts.push(slab('trim', [6, 1.2, 3], [-14, 19.2, -4]))
  parts.push(slab('trim', [5, 0.9, 2.6], [-4, 19.05, 4]))

  parts.push(slab('glass', [20, 4.6, 0.5], [0, 2.8, 11.25]))
  parts.push(slab('trim', [22, 0.4, 3], [0, 5.4, 9.8]))
  ;[-26, -20, -14, 14, 20, 26].forEach((x) => {
    parts.push(slab('trim', [0.35, 17.5, 0.5], [x, 9.25, 11.25]))
  })
  return parts
}

// 体育馆：大跨基座 + 半椭圆拱顶 + 拱形山墙入口
function gym(tile: Tile): Part[] {
  const parts: Part[] = []
  parts.push(slab('base', [52, 0.6, 30], [0, 0.3, 0]))
  parts.push(slab('wall', [50, 8.6, 28], [0, 4.9, 0], tile))
  parts.push(slab('trim', [51, 0.5, 29], [0, 9.45, 0]))
  parts.push(solid('trim', archVault(52, 30, 9.7, 6.3)))

  ;[-18, -6, 6, 18].forEach((x) => {
    parts.push(slab('trim', [0.6, 8.6, 0.6], [x, 4.9, 14.1]))
  })
  parts.push(slab('glass', [16, 5.4, 0.4], [0, 3.3, 14.2]))
  parts.push(slab('trim', [18, 0.4, 2.8], [0, 6.25, 12.6]))
  ;[-8, 8].forEach((x) => {
    parts.push(slab('trim', [0.5, 5.4, 0.5], [x, 3.3, 13.4]))
  })
  ;[-1, 1].forEach((side) => {
    parts.push(slab('glass', [48, 1.2, 0.4], [0, 8.2, side * 13.9]))
  })
  return parts
}

// 食堂：底层通高玻璃 + 退台上层 + 屋面采光带 + 入口雨棚
function canteen(tile: Tile): Part[] {
  const parts: Part[] = []
  parts.push(slab('base', [50, 0.5, 34], [0, 0.25, 0]))
  parts.push(slab('glass', [49, 4.0, 33], [0, 2.5, 0]))
  for (let x = -21; x <= 21; x += 3) {
    parts.push(slab('trim', [0.18, 4.0, 0.3], [x, 2.5, 16.65]))
  }

  parts.push(slab('trim', [50, 0.3, 34], [0, 4.65, 0]))
  parts.push(slab('wall', [45, 4.2, 29], [0, 6.9, 0], tile))
  parts.push(slab('trim', [49, 0.6, 33], [0, 9.3, 0]))

  ;[-14, 0, 14].forEach((x) => {
    parts.push(slab('glass', [8, 0.4, 4], [x, 9.8, 0]))
  })

  parts.push(slab('trim', [16, 0.4, 2.5], [0, 5.1, 15.75]))
  ;[-15, -9, 9, 15].forEach((x) => {
    parts.push(slab('trim', [0.3, 4.0, 0.6], [x, 7.0, 14.7]))
  })
  return parts
}

// 宿舍区：六层板楼 + 阳台带 + 玻璃楼梯筒 + 屋面水箱
function dorm(tile: Tile): Part[] {
  const parts: Part[] = []
  parts.push(slab('base', [38, 0.5, 64], [0, 0.25, 0]))
  parts.push(slab('wall', [36, 18.7, 62], [0, 9.85, 0], tile))
  parts.push(slab('trim', [37.5, 0.5, 63], [0, 19.45, 0]))

  ;[3.5, 6.6, 9.7, 12.8, 15.9].forEach((y) => {
    parts.push(slab('trim', [1.8, 0.2, 60], [18.1, y, 0]))
    parts.push(slab('trim', [0.16, 0.95, 60], [18.9, y + 0.575, 0]))
  })

  parts.push(slab('glass', [8, 4.2, 0.4], [0, 2.6, 31.2]))
  parts.push(slab('glass', [5, 12.6, 0.4], [0, 11.5, 31.2]))
  parts.push(slab('trim', [10, 0.4, 2.8], [0, 4.9, 29.9]))
  ;[-4, 4].forEach((x) => {
    parts.push(slab('trim', [0.4, 4.2, 0.4], [x, 2.6, 30.4]))
  })

  parts.push(slab('trim', [37, 0.7, 0.6], [0, 20.05, 31.2]))
  parts.push(slab('trim', [37, 0.7, 0.6], [0, 20.05, -31.2]))
  ;[-18.2, 18.2].forEach((x) => {
    parts.push(slab('trim', [0.6, 0.7, 62], [x, 20.05, 0]))
  })
  parts.push(slab('trim', [7, 1.1, 5], [0, 20.25, -6]))

  ;[
    [-8, -18],
    [8, 10],
  ].forEach(([x, z]) => {
    const tank = new THREE.CylinderGeometry(1.6, 1.6, 1.3, 12)
    tank.translate(x, 20.35, z)
    parts.push(solid('trim', tank))
  })
  return parts
}

const RECIPES: Record<string, (tile: Tile) => Part[]> = {
  library,
  history,
  lab,
  gym,
  canteen,
  dorm,
}

function mergeBucket(parts: Part[], bucket: Bucket) {
  const list = parts.filter((part) => part.bucket === bucket).map((part) => part.geometry)
  if (list.length === 0) return undefined

  // 混合 BoxGeometry（索引）与挤出/圆柱体（非索引）前统一去索引
  const flat = list.map((geometry) => {
    if (!geometry.index) return geometry
    const plain = geometry.toNonIndexed()
    geometry.dispose()
    return plain
  })
  const merged = mergeGeometries(flat, false) ?? undefined
  flat.forEach((geometry) => geometry.dispose())
  return merged
}

function buildBuilding(building: PlaceholderBuilding): Built {
  const tile = TILES[building.id] ?? DEFAULT_TILE
  const recipe = RECIPES[building.id]
  const parts = recipe ? recipe(tile) : []

  return {
    wall: mergeBucket(parts, 'wall'),
    trim: mergeBucket(parts, 'trim'),
    glass: mergeBucket(parts, 'glass'),
    base: mergeBucket(parts, 'base'),
    facade: createFacadeTexture(building.id, building.color),
  }
}

function BuildingMesh({ building }: { building: PlaceholderBuilding }) {
  const built = useMemo(() => buildBuilding(building), [building])
  const materials = useMemo(
    () => ({
      wall: new THREE.MeshStandardMaterial({
        map: built.facade,
        roughness: 0.84,
        metalness: 0.06,
      }),
      trim: new THREE.MeshStandardMaterial({
        color: building.roofColor,
        roughness: 0.55,
        metalness: 0.24,
      }),
      glass: new THREE.MeshStandardMaterial({
        color: '#2a5761',
        roughness: 0.22,
        metalness: 0.4,
        emissive: '#154049',
        emissiveIntensity: 0.55,
      }),
      base: new THREE.MeshStandardMaterial({ color: '#16262a', roughness: 1 }),
    }),
    [built, building.roofColor],
  )

  useEffect(
    () => () => {
      built.wall?.dispose()
      built.trim?.dispose()
      built.glass?.dispose()
      built.base?.dispose()
      built.facade.dispose()
      Object.values(materials).forEach((material) => material.dispose())
    },
    [built, materials],
  )

  return (
    <group position={building.position} rotation-y={building.rotationY}>
      {built.wall ? (
        <mesh geometry={built.wall} material={materials.wall} castShadow receiveShadow>
          <Edges scale={1.0015} threshold={24} color={building.roofColor} />
        </mesh>
      ) : null}
      {built.trim ? <mesh geometry={built.trim} material={materials.trim} castShadow receiveShadow /> : null}
      {built.glass ? <mesh geometry={built.glass} material={materials.glass} castShadow receiveShadow /> : null}
      {built.base ? <mesh geometry={built.base} material={materials.base} receiveShadow /> : null}
    </group>
  )
}

export function PlaceholderLayer() {
  return (
    <group name="placeholders">
      {layout.placeholders.map((building) => (
        <BuildingMesh key={building.id} building={building} />
      ))}
    </group>
  )
}
