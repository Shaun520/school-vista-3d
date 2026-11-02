import { useEffect, useMemo } from 'react'
import { useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import { layout } from '../data/layout'
import type { Plaza as PlazaSpec } from '../types/layout'

const PILLAR_WIDTH = 1.6

// 2D Simplex 噪声（ashima/webgl-noise），用于地面草皮/泥土的自然过渡
const SIMPLEX_GLSL = `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }
float simplex2d(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
`

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

  // 草坪与泥土纹理取自 dgreenheck/ez-tree（MIT），按世界坐标平铺
  const grassTexture = useLoader(THREE.TextureLoader, '/assets/campus/ez/grass.jpg')
  const dirtTexture = useLoader(THREE.TextureLoader, '/assets/campus/ez/dirt_color.jpg')

  const groundMaterial = useMemo(() => {
    for (const texture of [grassTexture, dirtTexture]) {
      texture.wrapS = THREE.RepeatWrapping
      texture.wrapT = THREE.RepeatWrapping
      texture.colorSpace = THREE.SRGBColorSpace
      texture.anisotropy = 8
      texture.needsUpdate = true
    }

    const material = new THREE.MeshStandardMaterial({
      color: '#e8f1d7',
      roughness: 1,
    })

    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, {
        uGrassMap: { value: grassTexture },
        uDirtMap: { value: dirtTexture },
        uNoiseScale: { value: 55 },
        uPatchiness: { value: 0.72 },
      })

      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `#include <common>
         varying vec3 vGroundWorld;`,
      )
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         vGroundWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;`,
      )

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `#include <common>
         varying vec3 vGroundWorld;
         uniform sampler2D uGrassMap;
         uniform sampler2D uDirtMap;
         uniform float uNoiseScale;
         uniform float uPatchiness;
         ${SIMPLEX_GLSL}`,
      )
      // 用噪声在草皮与泥土之间过渡，形成自然的斑驳地表
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `
        vec2 groundUv = vGroundWorld.xz / 20.0;
        vec3 grassColor = texture2D(uGrassMap, groundUv).rgb;
        vec3 dirtColor = texture2D(uDirtMap, groundUv).rgb;
        float patchNoise = 0.5 + 0.5 * simplex2d(vGroundWorld.xz / uNoiseScale);
        float patchMix = smoothstep(uPatchiness - 0.1, uPatchiness + 0.1, patchNoise);
        diffuseColor.rgb *= mix(grassColor, dirtColor, patchMix * 0.35);
        `,
      )
    }

    return material
  }, [grassTexture, dirtTexture])

  useEffect(() => () => groundMaterial.dispose(), [groundMaterial])

  return (
    <group name="ground">
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.06, 0]} receiveShadow material={groundMaterial}>
        <planeGeometry args={[groundSize, groundSize]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.3, 0]} receiveShadow>
        <planeGeometry args={[2400, 2400]} />
        <meshStandardMaterial color="#1c3326" roughness={1} />
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
