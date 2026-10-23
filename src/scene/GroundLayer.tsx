import { layout } from '../data/layout'

const PILLAR_WIDTH = 1.6

export function GroundLayer() {
  const { groundSize } = layout.campus
  const { gate, plaza } = layout
  const pillarOffset = gate.width / 2 - PILLAR_WIDTH / 2

  return (
    <group name="ground">
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.06, 0]} receiveShadow>
        <planeGeometry args={[groundSize, groundSize]} />
        <meshStandardMaterial color="#1c3a31" roughness={1} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.3, 0]} receiveShadow>
        <planeGeometry args={[1600, 1600]} />
        <meshStandardMaterial color="#0a1714" roughness={1} />
      </mesh>

      {layout.roads.map((road) => (
        <mesh
          key={road.id}
          rotation={[-Math.PI / 2, 0, road.rotationY]}
          position={road.center}
          receiveShadow
        >
          <planeGeometry args={road.size} />
          <meshStandardMaterial color="#2a3a3c" roughness={0.95} />
        </mesh>
      ))}

      <mesh rotation-x={-Math.PI / 2} position={plaza.center} receiveShadow>
        <circleGeometry args={[plaza.radius, 64]} />
        <meshStandardMaterial color="#2e4a49" roughness={0.9} />
      </mesh>
      <mesh
        rotation-x={-Math.PI / 2}
        position={[plaza.center[0], plaza.center[1] + 0.01, plaza.center[2]]}
      >
        <ringGeometry args={[plaza.radius - 1.2, plaza.radius, 64]} />
        <meshStandardMaterial color="#4d7a72" roughness={0.8} />
      </mesh>

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
          <meshStandardMaterial color="#35E0C0" emissive="#35E0C0" emissiveIntensity={1.6} />
        </mesh>
      </group>
    </group>
  )
}
