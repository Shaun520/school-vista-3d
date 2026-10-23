// 根据教室时间推导日照、灯光数量与色温，供 3D 场景和 HUD 共用。
export interface ClassroomLightState {
  daylight: number
  sunlight: number
  sunIntensity: number
  sunColor: string
  ambient: number
  lampLevel: number
  lampCount: number
  lampLabel: string
  modeLabel: string
  isNight: boolean
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = clamp01((value - edge0) / (edge1 - edge0))
  return t * t * (3 - 2 * t)
}

export function getClassroomLightState(hour: number): ClassroomLightState {
  const normalized = ((hour % 24) + 24) % 24
  const morning = smoothstep(5.5, 8, normalized)
  // 直射阳光只在上午进入教室，12:00 前完全收起。
  const sunlight = morning * (1 - smoothstep(11.5, 12, normalized))
  // 天光作为漫射照明保留到下午，随日照退出同步减弱。
  const daylight = Math.min(morning, 1 - smoothstep(12, 15, normalized))

  let lampCount = 0
  if (normalized < 7) lampCount = 2
  else if (normalized >= 18) lampCount = 4
  else if (normalized >= 16) lampCount = 3
  else if (normalized >= 13) lampCount = 2

  let modeLabel = '夜间'
  if (normalized >= 5 && normalized < 7) modeLabel = '清晨'
  else if (normalized >= 7 && normalized < 11) modeLabel = '上午'
  else if (normalized >= 11 && normalized < 14) modeLabel = '正午'
  else if (normalized >= 14 && normalized < 17) modeLabel = '下午'
  else if (normalized >= 17 && normalized < 19) modeLabel = '黄昏'

  const sunColor = normalized < 8 ? '#ffcf9a' : '#ffe3b0'

  return {
    daylight,
    sunlight,
    sunIntensity: sunlight * 2.6,
    sunColor,
    ambient: 0.04 + daylight * 0.48,
    lampLevel: lampCount / 4,
    lampCount,
    lampLabel: `照明 ${lampCount}/4 · ${lampCount === 0 ? '自然光' : lampCount < 4 ? '暖光' : '夜间'}`,
    modeLabel,
    isNight: normalized < 6 || normalized >= 17.5,
  }
}
