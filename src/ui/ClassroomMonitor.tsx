// 教室内四路监控画面：用 Canvas 绘制讲台、学生区、后门与走廊的模拟实时流。
import { useEffect, useRef, useState } from 'react'
import { classroomFeeds } from '../data/classroom'
import { getClassroomLightState } from '../scene/classroomLighting'
import { useCampusStore } from '../store/useCampusStore'
import styles from './Classroom.module.css'

const WIDTH = 480
const HEIGHT = 270

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function noise(ctx: CanvasRenderingContext2D) {
  for (let index = 0; index < 70; index++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`
    ctx.fillRect(Math.random() * WIDTH, Math.random() * HEIGHT, 2, 1)
  }
}

function vignette(ctx: CanvasRenderingContext2D) {
  const gradient = ctx.createRadialGradient(
    WIDTH / 2,
    HEIGHT / 2,
    40,
    WIDTH / 2,
    HEIGHT / 2,
    WIDTH * 0.65,
  )
  gradient.addColorStop(0, 'rgba(0,0,0,0)')
  gradient.addColorStop(1, 'rgba(0,0,0,.42)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, WIDTH, HEIGHT)
}

function drawPodium(ctx: CanvasRenderingContext2D, dark: boolean, time: number) {
  const wall = dark ? '#161f1e' : '#2b3532'
  const floor = dark ? '#241918' : '#4a2f2e'
  const board = dark ? '#0d241e' : '#173c31'
  const desk = dark ? '#4c3828' : '#8b5f31'
  const windowColor = dark ? '#1b3448' : '#ffe7b0'

  ctx.fillStyle = wall
  ctx.fillRect(0, 0, WIDTH, HEIGHT)
  ctx.fillStyle = floor
  ctx.fillRect(0, HEIGHT * 0.62, WIDTH, HEIGHT * 0.38)

  ctx.fillStyle = windowColor
  ctx.fillRect(WIDTH * 0.79, HEIGHT * 0.18, WIDTH * 0.12, HEIGHT * 0.3)
  ctx.fillRect(WIDTH * 0.1, HEIGHT * 0.18, WIDTH * 0.1, HEIGHT * 0.3)

  ctx.fillStyle = board
  ctx.fillRect(WIDTH * 0.25, HEIGHT * 0.17, WIDTH * 0.42, HEIGHT * 0.32)
  ctx.strokeStyle = 'rgba(74, 140, 118, .55)'
  ctx.lineWidth = 2
  ctx.strokeRect(WIDTH * 0.25, HEIGHT * 0.17, WIDTH * 0.42, HEIGHT * 0.32)
  ctx.fillStyle = 'rgba(230,245,235,.7)'
  ctx.font = '13px "Microsoft YaHei", sans-serif'
  ctx.fillText('沉心静气 · 备战高考', WIDTH * 0.34, HEIGHT * 0.32)
  ctx.fillStyle = 'rgba(230,245,235,.4)'
  ctx.font = '10px "Microsoft YaHei", sans-serif'
  ctx.fillText('2023 级 · 高三(1)班', WIDTH * 0.37, HEIGHT * 0.23)

  ctx.fillStyle = dark ? '#fff0c8' : '#f8f2de'
  ctx.fillRect(WIDTH * 0.3, HEIGHT * 0.08, WIDTH * 0.14, 3)
  ctx.fillRect(WIDTH * 0.56, HEIGHT * 0.08, WIDTH * 0.14, 3)

  ctx.fillStyle = desk
  ctx.fillRect(WIDTH * 0.42, HEIGHT * 0.5, WIDTH * 0.16, HEIGHT * 0.1)

  for (let row = 0; row < 3; row++) {
    const y = HEIGHT * (0.66 + row * 0.09)
    const scale = 1 + row * 0.18
    for (let col = 0; col < 4; col++) {
      const x = WIDTH * (0.16 + col * 0.18)
      ctx.fillStyle = desk
      ctx.fillRect(x, y, 34 * scale, 8 * scale)
      ctx.fillStyle = dark ? '#1f1714' : '#2b2420'
      ctx.beginPath()
      ctx.arc(x + 17 * scale, y - 5 * scale, 6 * scale, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const glow = dark ? 0.5 : 0.25
  ctx.fillStyle = `rgba(255, 211, 106, ${glow + Math.sin(time * 2) * 0.03})`
  ctx.fillRect(WIDTH * 0.3, HEIGHT * 0.09, WIDTH * 0.14, 2)

  noise(ctx)
  vignette(ctx)
}

function drawSeats(ctx: CanvasRenderingContext2D, dark: boolean) {
  const wall = dark ? '#141d1c' : '#28322f'
  const floor = dark ? '#241918' : '#452b2a'
  const desk = dark ? '#4c3828' : '#8b5f31'
  const skin = dark ? '#2a2420' : '#3b302a'

  ctx.fillStyle = wall
  ctx.fillRect(0, 0, WIDTH, HEIGHT)
  ctx.fillStyle = floor
  ctx.fillRect(0, HEIGHT * 0.58, WIDTH, HEIGHT * 0.42)

  ctx.fillStyle = dark ? '#1b3448' : '#ffe7b0'
  ctx.fillRect(WIDTH * 0.06, HEIGHT * 0.12, WIDTH * 0.12, HEIGHT * 0.24)
  ctx.fillRect(WIDTH * 0.83, HEIGHT * 0.12, WIDTH * 0.12, HEIGHT * 0.24)

  for (let row = 0; row < 4; row++) {
    const y = HEIGHT * (0.52 + row * 0.11)
    const scale = 0.9 + row * 0.18
    for (let col = 0; col < 4; col++) {
      const x = WIDTH * (0.12 + col * 0.2)
      ctx.fillStyle = desk
      ctx.fillRect(x, y, 40 * scale, 10 * scale)
      ctx.fillStyle = skin
      ctx.beginPath()
      ctx.arc(x + 20 * scale, y - 7 * scale, 8 * scale, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  ctx.fillStyle = 'rgba(120, 160, 150, .18)'
  ctx.fillRect(WIDTH * 0.455, HEIGHT * 0.58, WIDTH * 0.09, HEIGHT * 0.42)

  noise(ctx)
  vignette(ctx)
}

function drawDoor(ctx: CanvasRenderingContext2D, dark: boolean) {
  const wall = dark ? '#18201f' : '#303936'
  const door = dark ? '#2e2019' : '#5c3c2b'
  const floor = dark ? '#241918' : '#452b2a'

  ctx.fillStyle = wall
  ctx.fillRect(0, 0, WIDTH, HEIGHT)
  ctx.fillStyle = floor
  ctx.fillRect(0, HEIGHT * 0.66, WIDTH, HEIGHT * 0.34)

  ctx.fillStyle = door
  ctx.fillRect(WIDTH * 0.12, HEIGHT * 0.16, WIDTH * 0.24, HEIGHT * 0.56)
  ctx.strokeStyle = 'rgba(160, 130, 100, .35)'
  ctx.lineWidth = 2
  ctx.strokeRect(WIDTH * 0.12, HEIGHT * 0.16, WIDTH * 0.24, HEIGHT * 0.56)
  ctx.fillStyle = '#b8a684'
  ctx.beginPath()
  ctx.arc(WIDTH * 0.32, HEIGHT * 0.47, 4, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#1d7a58'
  ctx.fillRect(WIDTH * 0.47, HEIGHT * 0.18, WIDTH * 0.16, HEIGHT * 0.06)
  ctx.fillStyle = '#dcfff2'
  ctx.font = '12px "Microsoft YaHei", sans-serif'
  ctx.fillText('EXIT', WIDTH * 0.505, HEIGHT * 0.225)

  ctx.fillStyle = 'rgba(255, 240, 200, .18)'
  ctx.beginPath()
  ctx.moveTo(WIDTH * 0.36, HEIGHT * 0.72)
  ctx.lineTo(WIDTH * 0.55, HEIGHT * 0.66)
  ctx.lineTo(WIDTH * 0.68, HEIGHT)
  ctx.lineTo(WIDTH * 0.3, HEIGHT)
  ctx.fill()

  ctx.fillStyle = 'rgba(200, 214, 205, .55)'
  ctx.beginPath()
  ctx.arc(WIDTH * 0.47, HEIGHT * 0.5, 9, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillRect(WIDTH * 0.455, HEIGHT * 0.54, 16, 42)
  ctx.fillRect(WIDTH * 0.455, HEIGHT * 0.66, 6, 28)
  ctx.fillRect(WIDTH * 0.485, HEIGHT * 0.66, 6, 28)

  noise(ctx)
  vignette(ctx)
}

function drawCorridor(ctx: CanvasRenderingContext2D, dark: boolean, time: number) {
  const wall = dark ? '#161e1e' : '#2b3532'
  const floor = dark ? '#221817' : '#40302f'

  ctx.fillStyle = wall
  ctx.fillRect(0, 0, WIDTH, HEIGHT)
  ctx.fillStyle = floor
  ctx.fillRect(0, HEIGHT * 0.55, WIDTH, HEIGHT * 0.45)

  ctx.strokeStyle = 'rgba(160, 190, 180, .2)'
  ctx.lineWidth = 1
  for (let index = 0; index < 5; index++) {
    ctx.beginPath()
    ctx.moveTo(WIDTH / 2, HEIGHT * 0.5)
    ctx.lineTo(WIDTH * (0.1 + index * 0.2), HEIGHT * (index % 2 === 0 ? 0 : 1))
    ctx.stroke()
  }

  ctx.fillStyle = dark ? '#0f1c1d' : '#26312f'
  ctx.fillRect(WIDTH * 0.1, HEIGHT * 0.2, WIDTH * 0.16, HEIGHT * 0.36)
  ctx.fillRect(WIDTH * 0.74, HEIGHT * 0.2, WIDTH * 0.16, HEIGHT * 0.36)

  ctx.fillStyle = dark ? '#fff0c8' : '#f8f2de'
  ctx.fillRect(WIDTH * 0.38, HEIGHT * 0.12, WIDTH * 0.08, 3)
  ctx.fillRect(WIDTH * 0.56, HEIGHT * 0.12, WIDTH * 0.08, 3)

  const walkX = WIDTH * (0.42 + Math.sin(time * 0.5) * 0.08)
  ctx.fillStyle = 'rgba(200, 214, 205, .5)'
  ctx.beginPath()
  ctx.arc(walkX, HEIGHT * 0.47, 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillRect(walkX - 8, HEIGHT * 0.51, 16, 38)
  ctx.fillRect(walkX - 8, HEIGHT * 0.63, 6, 24)
  ctx.fillRect(walkX + 2, HEIGHT * 0.63, 6, 24)

  noise(ctx)
  vignette(ctx)
}

function drawFeed(
  ctx: CanvasRenderingContext2D,
  index: number,
  dark: boolean,
  time: number,
) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT)
  if (index === 0) drawPodium(ctx, dark, time)
  else if (index === 1) drawSeats(ctx, dark)
  else if (index === 2) drawDoor(ctx, dark)
  else drawCorridor(ctx, dark, time)
}

export function ClassroomMonitor() {
  const hour = useCampusStore((state) => state.classroomTime)
  const light = getClassroomLightState(hour)
  const canvasRefs = useRef<Array<HTMLCanvasElement | null>>([])
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const contexts = canvasRefs.current.map((canvas) => {
      if (!canvas) return null
      canvas.width = WIDTH
      canvas.height = HEIGHT
      return canvas.getContext('2d')
    })

    contexts.forEach((ctx, index) => {
      if (ctx) drawFeed(ctx, index, light.isNight, 0)
    })

    let raf = 0
    let last = performance.now()
    let lastDraw = 0
    let time = 0

    const loop = (current: number) => {
      const delta = Math.min((current - last) / 1000, 0.05)
      last = current
      time += delta

      if (current - lastDraw > 120) {
        lastDraw = current
        contexts.forEach((ctx, index) => {
          if (ctx) drawFeed(ctx, index, light.isNight, time)
        })
      }

      raf = window.requestAnimationFrame(loop)
    }

    raf = window.requestAnimationFrame(loop)
    return () => window.cancelAnimationFrame(raf)
  }, [light.isNight])

  const clock = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`

  return (
    <div className={styles.feedGrid}>
      {classroomFeeds.map((feed, index) => (
        <div
          key={feed.id}
          className={`${styles.feedCard} ${index === 0 ? styles.feedCardActive : ''}`}
          data-classroom-feed={feed.id}
        >
          <canvas
            ref={(element) => {
              canvasRefs.current[index] = element
            }}
            className={styles.feedCanvas}
          />
          <span className={styles.feedLabel}>{feed.label}</span>
          <span className={styles.feedRec}>REC</span>
          {light.isNight ? <span className={styles.feedNight}>IR</span> : null}
          <span className={styles.feedChannel}>{feed.channel} · 1080P</span>
          <span className={styles.feedTime}>{clock}</span>
        </div>
      ))}
    </div>
  )
}
