export type Vec3 = [number, number, number]

export interface LayoutModel {
  id: string
  name: string
  url: string
  position: Vec3
  rotationY: number
  centerXZ: boolean
  snapToGround: boolean
  castShadow: boolean
  stripNormalMaps?: boolean
  bounds: { size: Vec3 }
  cost: { bytes: number; triangles: number; drawCalls: number }
}

export interface InteriorModel extends LayoutModel {
  entry: Vec3
  lookAt: Vec3
}

export interface Poi {
  id: string
  name: string
  anchor?: string
  scope: 'exterior' | 'interior'
  position: Vec3
  description: string
}

export interface Road {
  id: string
  center: Vec3
  size: [number, number]
  rotationY: number
}

export interface CameraPreset {
  position: Vec3
  target: Vec3
}

export interface CampusLayout {
  version: number
  units: string
  axes: { up: string; ground: number }
  campus: {
    bounds: { min: Vec3; max: Vec3 }
    groundSize: number
  }
  models: LayoutModel[]
  interiors: InteriorModel[]
  pois: Poi[]
  roads: Road[]
  plaza: { center: Vec3; radius: number }
  gate: { position: Vec3; width: number; height: number; depth: number }
  cameras: Record<string, CameraPreset>
}

export type CameraPresetId = 'home' | 'teaching' | 'playground' | 'gate' | 'plaza'
