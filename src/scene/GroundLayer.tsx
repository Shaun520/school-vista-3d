import * as THREE from 'three'
import { layout } from '../data/layout'
import type { Plaza as PlazaSpec } from '../types/layout'

const PILLAR_WIDTH = 1.6

function ParkingLot() {
  const { center, size, rotationY } = layout.parking
  const [width, depth] = size
  const stallCount = 6

  return (
    <group position={[center[0], 0.02, center[1]]} rotation-y={rotationY}>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#1b292a" roughness={0.95} />
      </mesh>
      {Array.from({ length: stallCount }, (_, index) => (
        <mesh
          key={index}
          rotation-x={-Math.PI / 2}
          position={[-width / 2 + 3 + index * ((width - 6) / (stallCount - 1)), 0.012, 0]}
        >
          <planeGeometry args={[0.18, depth - 4]} />
          <meshStandardMaterial color="#4a5c5e" />
        </mesh>
      ))}
    </group>
  )
}

function Plaza({ patch }: { patch: PlazaSpec }) {
  return (
    <group position={[patch.center[0], 0, patch.center[1]]}>
      <mesh rotation-x={-Math.PI / 2} position-y={0.03} receiveShadow>
        <circleGeometry args={[patch.radius, 64]} />
        <meshStandardMaterial color="#243634" roughness={0.9} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.035}>
        <ringGeometry args={[patch.radius - 1.2, patch.radius, 64]} />
        <meshStandardMaterial color="#3d5a55" roughness={0.8} />
      </mesh>
    </group>
  )
}

function Fountain() {
  const { center, radius } = layout.fountain

  return (
    <group position={[center[0], 0, center[1]]}>
      <mesh position-y={0.06} receiveShadow>
        <cylinderGeometry args={[radius, radius, 0.12, 48]} />
        <meshStandardMaterial color="#1b4a58" roughness={0.22} metalness={0.5} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.13}>
        <ringGeometry args={[radius * 0.54, radius * 0.62, 48]} />
        <meshStandardMaterial
          color="#4fc3d9"
          emissive="#4fc3d9"
          emissiveIntensity={0.35}
        />
      </mesh>
    </group>
  )
}

function Flag() {
  const plaza = layout.plazas.find((item) => item.id === 'center')
  if (!plaza) return null

  return (
    <group position={[plaza.center[0], 0.03, plaza.center[1]]}>
      <mesh position={[0, 6, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.16, 12, 8]} />
        <meshStandardMaterial color="#9fd6c8" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[1.3, 11, 0]} castShadow>
        <boxGeometry args={[2.4, 1.5, 0.08]} />
        <meshStandardMaterial color="#d8443a" roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

export function GroundLayer() {
  const { groundSize } = layout.campus
  const { gate } = layout
  const pillarOffset = gate.width / 2 - PILLAR_WIDTH / 2

  return (
    <group name="ground">
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.06, 0]} receiveShadow>
        <planeGeometry args={[groundSize, groundSize]} />
        <meshStandardMaterial color="#152a24" roughness={1} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.3, 0]} receiveShadow>
        <planeGeometry args={[1600, 1600]} />
        <meshStandardMaterial color="#081412" roughness={1} />
      </mesh>

      {layout.roads.map((road) => (
        <mesh
          key={road.id}
          rotation={[-Math.PI / 2, 0, road.rotationY]}
          position={road.center}
          receiveShadow
        >
          <planeGeometry args={road.size} />
          <meshStandardMaterial color="#26383a" roughness={0.95} />
        </mesh>
      ))}

      {layout.paths.map((path) => (
        <mesh
          key={path.id}
          rotation={[-Math.PI / 2, 0, path.rotationY]}
          position={path.center}
          receiveShadow
        >
          <planeGeometry args={path.size} />
          <meshStandardMaterial color="#36564c" roughness={0.95} />
        </mesh>
      ))}

      {layout.plazas.map((plaza) => (
        <Plaza key={plaza.id} patch={plaza} />
      ))}

      <Fountain />
      <ParkingLot />
      <Flag />

      <group position={gate.position}>
        {[-1, 1].map((side) => (
          <mesh
            key={side}
            position={[side * pillarOffset, gate.height / 2, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[PILLAR_WIDTH, gate.height, gate.depth]} />
            <meshStandardMaterial color="#3a5557" roughness={0.7} metalness={0.3} />
          </mesh>
        ))}
        <mesh position={[0, gate.height - 0.4, 0]} castShadow>
          <boxGeometry args={[gate.width, 0.8, gate.depth]} />
          <meshStandardMaterial color="#3f5f61" roughness={0.6} metalness={0.35} />
        </mesh>
        <mesh position={[0, gate.height - 0.9, gate.depth / 2 + 0.02]}>
          <boxGeometry args={[gate.width * 0.6, 0.12, 0.06]} />
          <meshStandardMaterial color="#35e0c0" emissive="#35e0c0" emissiveIntensity={1.6} />
        </mesh>
      </group>
    </group>
  )
}
