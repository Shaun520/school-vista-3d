import { useEffect, useRef, useState } from 'react'
import styles from '../Hud.module.css'

const FEEDS = [
  {
    label: '学校大门监控',
    channel: 'CH-01',
    palette: { sky: ['#253c46', '#4a6068'], ground: '#3c3f3b', road: '#5b5e58' },
  },
  {
    label: '学校教学楼监控',
    channel: 'CH-02',
    palette: { sky: ['#1d3340', '#3e5966'], ground: '#2f3b32', road: '#555e55' },
  },
  {
    label: '学校后门监控',
    channel: 'CH-03',
    palette: { sky: ['#212d38', '#3b4a55'], ground: '#353a34', road: '#5a5d56' },
  },
  {
    label: '学校操场监控',
    channel: 'CH-04',
    palette: { sky: ['#223843', '#45606b'], ground: '#3a4a34', road: '#4f5b49' },
  },
]

const palettes = FEEDS.map((feed) => feed.palette)

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function drawFeed(ctx: CanvasRenderingContext2D, index: number, time: number) {
  const width = 480
  const height = 240
  const palette = palettes[index]

  const sky = ctx.createLinearGradient(0, 0, 0, height * 0.62)
  sky.addColorStop(0, palette.sky[0])
  sky.addColorStop(1, palette.sky[1])
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, width, height * 0.62)

  ctx.fillStyle = palette.ground
  ctx.fillRect(0, height * 0.62, width, height)

  for (let building = 0; building < 7; building++) {
    const buildingWidth = 30 + ((building * 37) % 60)
    const buildingHeight = 26 + ((building * 23) % 70)
    const buildingX = (building * 77) % (width - buildingWidth)
    ctx.fillStyle = `rgba(${30 + building * 8},${44 + building * 6},${48 + building * 4},.85)`
    ctx.fillRect(buildingX, height * 0.62 - buildingHeight, buildingWidth, buildingHeight)
    ctx.fillStyle = 'rgba(255,210,150,.55)'
    for (let windowY = 0; windowY < buildingHeight - 8; windowY += 12) {
      for (let windowX = 4; windowX < buildingWidth - 6; windowX += 12) {
        if ((windowX + windowY + building) % 3 === 0) {
          ctx.fillRect(buildingX + windowX, height * 0.62 - buildingHeight + windowY + 4, 3, 4)
        }
      }
    }
  }

  ctx.fillStyle = palette.road
  ctx.beginPath()
  ctx.moveTo(width * 0.42, height)
  ctx.lineTo(width * 0.48, height * 0.62)
  ctx.lineTo(width * 0.55, height * 0.62)
  ctx.lineTo(width * 0.62, height)
  ctx.fill()

  ctx.strokeStyle = 'rgba(220,235,225,.35)'
  ctx.lineWidth = 2
  ctx.setLineDash([12, 12])
  ctx.beginPath()
  ctx.moveTo(width * 0.515, height)
  ctx.lineTo(width * 0.515, height * 0.64)
  ctx.stroke()
  ctx.setLineDash([])

  const carX = ((time * 34 + index * 90) % (width + 100)) - 50
  ctx.fillStyle = 'rgba(210,220,215,.8)'
  ctx.fillRect(carX, height * 0.77, 22, 9)
  ctx.fillStyle = 'rgba(255,245,220,.9)'
  ctx.fillRect(carX + 17, height * 0.79, 4, 3)

  const car2 = width - (((time * 22 + index * 130) % (width + 80)) - 40)
  ctx.fillStyle = 'rgba(60,70,75,.9)'
  ctx.fillRect(car2, height * 0.68, 18, 7)

  for (let noise = 0; noise < 110; noise++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.06})`
    ctx.fillRect(Math.random() * width, Math.random() * height, 2, 1)
  }

  const vignette = ctx.createRadialGradient(width / 2, height / 2, 40, width / 2, height / 2, width * 0.65)
  vignette.addColorStop(0, 'rgba(0,0,0,0)')
  vignette.addColorStop(1, 'rgba(0,0,0,.45)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, width, height)
}

export function VideoPanel() {
  const canvasRefs = useRef<Array<HTMLCanvasElement | null>>([])
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const contexts = canvasRefs.current.map((canvas) => {
      if (!canvas) return null
      canvas.width = 480
      canvas.height = 240
      return canvas.getContext('2d')
    })

    contexts.forEach((ctx, index) => {
      if (ctx) drawFeed(ctx, index, 0)
    })

    let raf = 0
    let last = performance.now()
    let time = 0
    const loop = (current: number) => {
      const delta = Math.min((current - last) / 1000, 0.05)
      last = current
      time += delta
      if (Math.floor(time * 8) !== Math.floor((time - delta) * 8)) {
        contexts.forEach((ctx, index) => {
          if (ctx) drawFeed(ctx, index, time)
        })
      }
      raf = window.requestAnimationFrame(loop)
    }
    raf = window.requestAnimationFrame(loop)
    return () => window.cancelAnimationFrame(raf)
  }, [])

  const clock = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`

  return (
    <section className={`${styles.panel} ${styles.panelActive}`}>
      <div className={styles.panelHead}>
        <span className={styles.tri} />
        <h2 className={styles.panelTitle}>视频监控</h2>
        <span className={styles.panelCode}>VIDEO / 4 CH</span>
      </div>

      <div className={styles.panelBody}>
        {FEEDS.map((feed, index) => (
          <div key={feed.channel} className={styles.feed}>
            <canvas
              ref={(element) => {
                canvasRefs.current[index] = element
              }}
              className={styles.feedCanvas}
            />
            <span className={styles.feedLabel}>{feed.label}</span>
            <span className={styles.feedRec}>REC</span>
            <span className={styles.feedCnr}>{feed.channel} · 1080P</span>
            <span className={styles.feedTime}>{clock}</span>
          </div>
        ))}
      </div>

      <div className={styles.panelFoot}>
        <span>4 CHANNELS ONLINE</span>
        <span>HLS · 25 FPS</span>
      </div>
    </section>
  )
}
