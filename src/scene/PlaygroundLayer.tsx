// 操场按参考项目 gxu-campus-3d 的跑道做法程序化重建：
// 8 条 1.22m 塑胶跑道（直道 90m、内半径 35m）、条纹草皮球场、
// 标准足球场标线、球门与角旗；几何按材质合并以控制 draw call。
import { useEffect, useMemo } from 'react'
import { useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { layout } from '../data/layout'
import type { PlaygroundField } from '../types/layout'

type Pt = [number, number]

// 各层高度错开，避免远景深度精度不足导致闪面
const APRON_Y = 0.03
const TRACK_Y = 0.05
const FIELD_Y = 0.09
const PITCH_Y = 0.15
const MARK_Y = 0.2
const LINE_WIDTH = 0.12

const COLORS = {
  apron: '#5e322b',
  track: '#8a4536',
  trackAlt: '#914a39',
  white: '#e9eadf',
  field: '#4f7a4a',
  stripeA: '#3a744b',
  stripeB: '#428255',
  flag: '#d8e04a',
}

function oval(radius: number, half: number, segments: number): Pt[] {
  const points: Pt[] = []
  for (let i = 0; i <= segments; i += 1) {
    const angle = -Math.PI / 2 + (Math.PI * i) / segments
    points.push([half + radius * Math.cos(angle), radius * Math.sin(angle)])
  }
  for (let i = 0; i <= segments; i += 1) {
    const angle = Math.PI / 2 + (Math.PI * i) / segments
    points.push([-half + radius * Math.cos(angle), radius * Math.sin(angle)])
  }
  return points
}

function pushRing(target: number[], inner: Pt[], outer: Pt[], y: number) {
  const count = inner.length
  for (let i = 0; i < count; i += 1) {
    const next = (i + 1) % count
    const [ax, az] = inner[i]
    const [bx, bz] = outer[i]
    const [cx, cz] = outer[next]
    const [dx, dz] = inner[next]
    target.push(ax, y, az, bx, y, bz, cx, y, cz)
    target.push(ax, y, az, cx, y, cz, dx, y, dz)
  }
}

function pushSegment(
  target: number[],
  a: Pt,
  b: Pt,
  width: number,
  y = MARK_Y,
) {
  const dx = b[0] - a[0]
  const dz = b[1] - a[1]
  const length = Math.hypot(dx, dz) || 1
  const nx = (-dz / length) * width * 0.5
  const nz = (dx / length) * width * 0.5
  target.push(
    a[0] + nx, y, a[1] + nz,
    b[0] + nx, y, b[1] + nz,
    b[0] - nx, y, b[1] - nz,
    a[0] + nx, y, a[1] + nz,
    b[0] - nx, y, b[1] - nz,
    a[0] - nx, y, a[1] - nz,
  )
}

function pushPolyline(target: number[], points: Pt[], closed: boolean) {
  const limit = closed ? points.length : points.length - 1
  for (let i = 0; i < limit; i += 1) {
    pushSegment(target, points[i], points[(i + 1) % points.length], LINE_WIDTH)
  }
}

function pushArc(
  target: number[],
  cx: number,
  cz: number,
  radius: number,
  from: number,
  to: number,
  segments = 20,
) {
  let prev: Pt = [cx + radius * Math.cos(from), cz + radius * Math.sin(from)]
  for (let i = 1; i <= segments; i += 1) {
    const angle = from + ((to - from) * i) / segments
    const next: Pt = [cx + radius * Math.cos(angle), cz + radius * Math.sin(angle)]
    pushSegment(target, prev, next, LINE_WIDTH)
    prev = next
  }
}

function flatGeometry(positions: number[]) {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.computeVertexNormals()
  return geometry
}

function pitchTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const stripes = 20
    const width = canvas.width / stripes
    for (let i = 0; i < stripes; i += 1) {
      ctx.fillStyle = i % 2 === 0 ? COLORS.stripeA : COLORS.stripeB
      ctx.fillRect(i * width, 0, width + 1, canvas.height)
    }
    // 割草纹理的细微横向噪声
    ctx.globalAlpha = 0.08
    for (let y = 0; y < canvas.height; y += 3) {
      ctx.fillStyle = y % 6 === 0 ? '#ffffff' : '#000000'
      ctx.fillRect(0, y, canvas.width, 1)
    }
    ctx.globalAlpha = 1
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.anisotropy = 8
  return texture
}

function netTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.clearRect(0, 0, 128, 128)
    ctx.strokeStyle = 'rgba(226,232,224,0.85)'
    ctx.lineWidth = 1
    for (let i = 0; i <= 128; i += 10) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, 128)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(128, i)
      ctx.stroke()
    }
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(8, 3)
  texture.anisotropy = 4
  return texture
}

function buildPlayground(field: PlaygroundField, grass: THREE.Texture) {
  const laneWidth = field.laneWidth
  const innerRadius = field.outerRadius - field.lanes * laneWidth
  const half = field.straightHalf
  const segments = 72
  const [pitchLength, pitchDepth] = field.pitch

  // 场地基底
  const apron = new THREE.PlaneGeometry(field.size[0], field.size[1])
  apron.rotateX(-Math.PI / 2)
  apron.translate(0, APRON_Y, 0)

  // 跑道：白线两侧各留出半个线宽，避免与跑道共面重叠
  const trackA: number[] = []
  const trackB: number[] = []
  const lines: number[] = []
  for (let lane = 0; lane < field.lanes; lane += 1) {
    const from = innerRadius + lane * laneWidth + LINE_WIDTH * 0.5
    const to = innerRadius + (lane + 1) * laneWidth - LINE_WIDTH * 0.5
    pushRing(lane % 2 === 0 ? trackA : trackB, oval(from, half, segments), oval(to, half, segments), TRACK_Y)
  }
  for (let edge = 0; edge <= field.lanes; edge += 1) {
    const radius = innerRadius + edge * laneWidth
    pushRing(lines, oval(radius - LINE_WIDTH * 0.5, half, segments), oval(radius + LINE_WIDTH * 0.5, half, segments), TRACK_Y)
  }

  // 内场草地
  const shape = new THREE.Shape()
  oval(innerRadius, half, segments).forEach(([x, z], index) => {
    if (index === 0) shape.moveTo(x, -z)
    else shape.lineTo(x, -z)
  })
  shape.closePath()
  const infield = new THREE.ShapeGeometry(shape)
  infield.rotateX(-Math.PI / 2)
  infield.translate(0, FIELD_Y, 0)
  const uv = infield.attributes.uv as THREE.BufferAttribute
  for (let i = 0; i < uv.count; i += 1) uv.setXY(i, uv.getX(i) / 10, uv.getY(i) / 10)
  uv.needsUpdate = true

  // 球场草皮与标线
  const pitch = new THREE.PlaneGeometry(pitchLength, pitchDepth)
  pitch.rotateX(-Math.PI / 2)
  pitch.translate(0, PITCH_Y, 0)

  const marks: number[] = []
  const hw = pitchLength / 2
  const hd = pitchDepth / 2
  pushPolyline(marks, [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]], true)
  pushPolyline(marks, [[-hw, 0], [hw, 0]], false)
  pushArc(marks, 0, 0, 9.15, 0, Math.PI * 2, 36)
  ;[-1, 1].forEach((side) => {
    const goalLine = side * hw
    const boxBack = side * (hw - 16.5)
    const areaBack = side * (hw - 5.5)
    pushPolyline(marks, [[goalLine, -20.16], [boxBack, -20.16], [boxBack, 20.16], [goalLine, 20.16]], false)
    pushPolyline(marks, [[goalLine, -9.16], [areaBack, -9.16], [areaBack, 9.16], [goalLine, 9.16]], false)
    pushArc(marks, side * (hw - 11), 0, 9.15, side > 0 ? 2.214 : -0.927, side > 0 ? 4.069 : 0.927, 22)
    pushArc(marks, side * (hw - 11), 0, 0.22, 0, Math.PI * 2, 10)
  })
  pushArc(marks, 0, 0, 0.22, 0, Math.PI * 2, 10)
  pushArc(marks, hw, hd, 1, Math.PI, Math.PI * 1.5, 6)
  pushArc(marks, hw, -hd, 1, Math.PI * 0.5, Math.PI, 6)
  pushArc(marks, -hw, hd, 1, Math.PI * 1.5, Math.PI * 2, 6)
  pushArc(marks, -hw, -hd, 1, 0, Math.PI * 0.5, 6)

  // 球门与角旗
  const goalWidth = 7.32
  const goalHeight = 2.44
  const frameParts: THREE.BufferGeometry[] = []
  const flagParts: THREE.BufferGeometry[] = []
  const flagCloth: THREE.BufferGeometry[] = []
  ;[-1, 1].forEach((side) => {
    const x = side * hw
    ;[-1, 1].forEach((end) => {
      const post = new THREE.CylinderGeometry(0.06, 0.06, goalHeight, 8)
      post.translate(x, goalHeight / 2, end * (goalWidth / 2))
      frameParts.push(post)
    })
    const bar = new THREE.CylinderGeometry(0.06, 0.06, goalWidth, 8)
    bar.rotateX(Math.PI / 2)
    bar.translate(x, goalHeight, 0)
    frameParts.push(bar)
  })
  ;[[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
    const pole = new THREE.CylinderGeometry(0.05, 0.05, 1.6, 6)
    pole.translate(sx * hw, 0.8, sz * hd)
    flagParts.push(pole)
    const cloth = new THREE.BoxGeometry(0.5, 0.32, 0.03)
    cloth.translate(sx * hw + 0.26, 1.4, sz * hd)
    flagCloth.push(cloth)
  })

  const netPanel = (side: number) => {
    const parts: THREE.BufferGeometry[] = []
    const back = new THREE.PlaneGeometry(goalWidth, goalHeight)
    back.rotateY(-side * Math.PI / 2)
    back.translate(side * (hw + 1.6), goalHeight / 2, 0)
    parts.push(back)
    const top = new THREE.PlaneGeometry(1.6, goalWidth)
    top.rotateX(-Math.PI / 2)
    top.translate(side * (hw + 0.8), goalHeight, 0)
    parts.push(top)
    return parts
  }

  const merge = (list: THREE.BufferGeometry[]) => {
    const flat = list.map((geometry) => (geometry.index ? geometry.toNonIndexed() : geometry))
    const merged = mergeGeometries(flat, false) ?? flat[0]
    flat.forEach((geometry) => geometry.dispose())
    return merged
  }

  const net = merge([...netPanel(-1), ...netPanel(1)])
  const goals = merge(frameParts)
  const flagPoles = merge(flagParts)
  const flags = merge(flagCloth)
  const netMap = netTexture()
  const pitchMap = pitchTexture()

  const materials = {
    apron: new THREE.MeshStandardMaterial({ color: COLORS.apron, roughness: 1 }),
    track: new THREE.MeshStandardMaterial({ color: COLORS.track, roughness: 0.95 }),
    trackAlt: new THREE.MeshStandardMaterial({ color: COLORS.trackAlt, roughness: 0.95 }),
    white: new THREE.MeshStandardMaterial({ color: COLORS.white, roughness: 0.75 }),
    infield: new THREE.MeshStandardMaterial({ map: grass, color: COLORS.field, roughness: 1 }),
    pitch: new THREE.MeshStandardMaterial({ map: pitchMap, roughness: 1 }),
    marks: new THREE.MeshStandardMaterial({
      color: COLORS.white,
      roughness: 0.7,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    }),
    goal: new THREE.MeshStandardMaterial({ color: COLORS.white, roughness: 0.5, metalness: 0.1 }),
    net: new THREE.MeshStandardMaterial({
      map: netMap,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    flag: new THREE.MeshStandardMaterial({ color: COLORS.flag, roughness: 0.7, side: THREE.DoubleSide }),
  }

  grass.colorSpace = THREE.SRGBColorSpace
  grass.wrapS = THREE.RepeatWrapping
  grass.wrapT = THREE.RepeatWrapping

  const geometries = [
    apron,
    flatGeometry(trackA),
    flatGeometry(trackB),
    flatGeometry(lines),
    infield,
    pitch,
    flatGeometry(marks),
    goals,
    net,
    flagPoles,
    flags,
  ]

  const dispose = () => {
    geometries.forEach((geometry) => geometry.dispose())
    netMap.dispose()
    pitchMap.dispose()
    Object.values(materials).forEach((material) => material.dispose())
  }

  return {
    apron,
    trackA: geometries[1],
    trackB: geometries[2],
    lines: geometries[3],
    infield,
    pitch,
    marks: geometries[6],
    goals,
    net,
    flagPoles,
    flags,
    materials,
    dispose,
  }
}

export function PlaygroundLayer() {
  const field = layout.playground
  const grass = useLoader(THREE.TextureLoader, '/assets/campus/textures/grass.jpg')
  const built = useMemo(() => buildPlayground(field, grass), [field, grass])

  useEffect(() => () => built.dispose(), [built])

  return (
    <group
      name="playground"
      position={[field.center[0], 0, field.center[1]]}
      rotation-y={field.rotationY}
    >
      <mesh geometry={built.apron} material={built.materials.apron} receiveShadow />
      <mesh geometry={built.trackA} material={built.materials.track} receiveShadow />
      <mesh geometry={built.trackB} material={built.materials.trackAlt} receiveShadow />
      <mesh geometry={built.lines} material={built.materials.white} receiveShadow />
      <mesh geometry={built.infield} material={built.materials.infield} receiveShadow />
      <mesh geometry={built.pitch} material={built.materials.pitch} receiveShadow />
      <mesh geometry={built.marks} material={built.materials.marks} receiveShadow />
      <mesh geometry={built.goals} material={built.materials.goal} castShadow />
      <mesh geometry={built.net} material={built.materials.net} />
      <mesh geometry={built.flagPoles} material={built.materials.goal} castShadow />
      <mesh geometry={built.flags} material={built.materials.flag} />
    </group>
  )
}
