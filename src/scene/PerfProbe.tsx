import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'

export function PerfProbe({ dpr, adaptiveLevel }: { dpr: number; adaptiveLevel: number }) {
  const gl = useThree((state) => state.gl)
  const elapsed = useRef(0)
  const frames = useRef(0)

  useFrame((_, delta) => {
    elapsed.current += delta
    frames.current += 1
    if (elapsed.current < 0.5) return
    const fps = frames.current / elapsed.current
    elapsed.current = 0
    frames.current = 0
    const element = document.getElementById('perf-readout')
    if (element) {
      element.textContent = `FPS ${fps.toFixed(0)} · DRAW ${gl.info.render.calls} · TRI ${(gl.info.render.triangles / 1000).toFixed(1)}k · TEX ${gl.info.memory.textures} · DPR ${dpr.toFixed(2)} · LV ${adaptiveLevel}`
    }
  })

  return null
}
