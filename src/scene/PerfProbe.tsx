import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'

export function PerfProbe() {
  const gl = useThree((state) => state.gl)
  const elapsed = useRef(0)

  useFrame((_, delta) => {
    elapsed.current += delta
    if (elapsed.current < 0.5) return
    elapsed.current = 0
    const element = document.getElementById('perf-readout')
    if (element) {
      element.textContent = `DRAW ${gl.info.render.calls} · TRI ${(gl.info.render.triangles / 1000).toFixed(1)}k · TEX ${gl.info.memory.textures}`
    }
  })

  return null
}
