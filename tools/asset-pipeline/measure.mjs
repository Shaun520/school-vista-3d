import fs from 'node:fs'
import path from 'node:path'
import { Matrix4, Quaternion, Vector3 } from 'three'

const ASSETS = [
  { id: 'teaching', file: 'model/web/teachBuilding.glb' },
  { id: 'playground', file: 'model/web/playground.glb' },
  { id: 'classroom', file: 'model/web/classroom.glb' },
]

const ANCHOR = /^(POI_|FLOOR_\d+$|ANCHOR_|LOD_)/

function readGlb(file) {
  const buf = fs.readFileSync(file)
  const magic = buf.readUInt32LE(0)
  if (magic !== 0x46546c67) throw new Error(`${file} is not a GLB`)
  const jsonLength = buf.readUInt32LE(12)
  const jsonType = buf.readUInt32LE(16)
  if (jsonType !== 0x4e4f534a) throw new Error(`${file} first chunk is not JSON`)
  return JSON.parse(buf.subarray(20, 20 + jsonLength).toString('utf8'))
}

function localMatrix(node) {
  if (node.matrix) return new Matrix4().fromArray(node.matrix)
  const t = node.translation ?? [0, 0, 0]
  const r = node.rotation ?? [0, 0, 0, 1]
  const s = node.scale ?? [1, 1, 1]
  return new Matrix4().compose(
    new Vector3().fromArray(t),
    new Quaternion().fromArray(r),
    new Vector3().fromArray(s),
  )
}

function round(n) {
  return Math.round(n * 100) / 100
}

function measure({ id, file }) {
  const gltf = readGlb(file)
  const nodes = gltf.nodes ?? []
  const meshes = gltf.meshes ?? []
  const accessors = gltf.accessors ?? []
  const worldMatrices = new Array(nodes.length)
  const parentOf = new Array(nodes.length).fill(-1)

  ;(gltf.scenes?.[gltf.scene ?? 0]?.nodes ?? []).forEach((n) => walk(n, new Matrix4()))
  function walk(index, parentMatrix) {
    const node = nodes[index]
    const world = parentMatrix.clone().multiply(localMatrix(node))
    worldMatrices[index] = world
    for (const child of node.children ?? []) {
      parentOf[child] = index
      walk(child, world)
    }
  }

  const min = new Vector3(Infinity, Infinity, Infinity)
  const max = new Vector3(-Infinity, -Infinity, -Infinity)
  const meshDetails = []
  let primitives = 0

  nodes.forEach((node, index) => {
    if (node.mesh === undefined) return
    const world = worldMatrices[index]
    if (!world) return
    for (const primitive of meshes[node.mesh].primitives ?? []) {
      const accessor = accessors[primitive.attributes?.POSITION]
      if (!accessor?.min || !accessor?.max) continue
      primitives++
      const [x0, y0, z0] = accessor.min
      const [x1, y1, z1] = accessor.max
      const corners = [
        [x0, y0, z0], [x1, y0, z0], [x0, y1, z0], [x1, y1, z0],
        [x0, y0, z1], [x1, y0, z1], [x0, y1, z1], [x1, y1, z1],
      ]
      const detailMin = new Vector3(Infinity, Infinity, Infinity)
      const detailMax = new Vector3(-Infinity, -Infinity, -Infinity)
      for (const corner of corners) {
        const p = new Vector3().fromArray(corner).applyMatrix4(world)
        min.min(p)
        max.max(p)
        detailMin.min(p)
        detailMax.max(p)
      }
      const detailSize = detailMax.clone().sub(detailMin)
      meshDetails.push({
        node: node.name,
        material: (gltf.materials?.[primitive.material]?.name) ?? `material-${primitive.material}`,
        min: [round(detailMin.x), round(detailMin.y), round(detailMin.z)],
        max: [round(detailMax.x), round(detailMax.y), round(detailMax.z)],
        size: [round(detailSize.x), round(detailSize.y), round(detailSize.z)],
      })
    }
  })

  const size = max.clone().sub(min)
  const center = min.clone().add(max).multiplyScalar(0.5)

  const anchors = []
  nodes.forEach((node, index) => {
    if (!node.name || !ANCHOR.test(node.name)) return
    const world = worldMatrices[index]
    if (!world) return

    const subtreeMin = new Vector3(Infinity, Infinity, Infinity)
    const subtreeMax = new Vector3(-Infinity, -Infinity, -Infinity)
    let subtreeMeshes = 0
    const stack = [index]
    while (stack.length) {
      const current = stack.pop()
      const currentWorld = worldMatrices[current]
      const currentNode = nodes[current]
      if (currentNode.mesh !== undefined && currentWorld) {
        for (const primitive of meshes[currentNode.mesh].primitives ?? []) {
          const accessor = accessors[primitive.attributes?.POSITION]
          if (!accessor?.min || !accessor?.max) continue
          subtreeMeshes++
          const [x0, y0, z0] = accessor.min
          const [x1, y1, z1] = accessor.max
          const corners = [
            [x0, y0, z0], [x1, y0, z0], [x0, y1, z0], [x1, y1, z0],
            [x0, y0, z1], [x1, y0, z1], [x0, y1, z1], [x1, y1, z1],
          ]
          for (const corner of corners) {
            const p = new Vector3().fromArray(corner).applyMatrix4(currentWorld)
            subtreeMin.min(p)
            subtreeMax.max(p)
          }
        }
      }
      for (const child of currentNode.children ?? []) stack.push(child)
    }

    const hasGeometry = subtreeMeshes > 0
    const center = subtreeMin.clone().add(subtreeMax).multiplyScalar(0.5)
    anchors.push({
      name: node.name,
      position: [round(world.elements[12]), round(world.elements[13]), round(world.elements[14])],
      children: node.children?.length ?? 0,
      subtreeMeshes,
      ...(hasGeometry
        ? {
            bounds: {
              min: [round(subtreeMin.x), round(subtreeMin.y), round(subtreeMin.z)],
              max: [round(subtreeMax.x), round(subtreeMax.y), round(subtreeMax.z)],
              size: [
                round(subtreeMax.x - subtreeMin.x),
                round(subtreeMax.y - subtreeMin.y),
                round(subtreeMax.z - subtreeMin.z),
              ],
              center: [round(center.x), round(center.y), round(center.z)],
            },
          }
        : {}),
    })
  })

  return {
    id,
    file,
    bytes: fs.statSync(file).size,
    bounds: {
      min: [round(min.x), round(min.y), round(min.z)],
      max: [round(max.x), round(max.y), round(max.z)],
      size: [round(size.x), round(size.y), round(size.z)],
      center: [round(center.x), round(center.y), round(center.z)],
    },
    counts: {
      nodes: nodes.length,
      meshes: meshes.length,
      primitives,
      materials: (gltf.materials ?? []).length,
      images: (gltf.images ?? []).length,
      animations: (gltf.animations ?? []).length,
    },
    anchors,
    ...(process.argv.includes('--meshes') ? { meshes: meshDetails } : {}),
  }
}

const report = ASSETS.map((asset) => measure({ ...asset, file: path.resolve(asset.file) }))
console.log(JSON.stringify(report, null, 2))
