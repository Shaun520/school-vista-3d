// 固定种子生成 10 万 / 100 万点，保证不同轮次、不同渲染方案使用同一份数据。
export function generateSeries(count: number): number[] {
  const data = new Array<number>(count)
  let seed = 0x2545f491

  for (let index = 0; index < count; index += 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0
    const noise = (seed / 0xffffffff - 0.5) * 2
    const spike = index % 50000 === 0 ? 180 : 0
    data[index] = Math.round(
      500 + Math.sin(index / 20000) * 120 + Math.sin(index / 1500) * 18 + noise * 24 + spike,
    )
  }

  return data
}

export interface LttbResult {
  values: number[]
  indices: number[]
}

// Largest-Triangle-Three-Buckets：保留视觉拐点，同时记录原始索引用于横轴定位。
export function lttbSeries(data: number[], threshold: number): LttbResult {
  const length = data.length

  if (threshold >= length || threshold <= 2) {
    return {
      values: data.slice(),
      indices: Array.from({ length }, (_, index) => index),
    }
  }

  const values: number[] = []
  const indices: number[] = []
  const every = (length - 2) / (threshold - 2)
  let anchor = 0

  values.push(data[0])
  indices.push(0)

  for (let bucket = 0; bucket < threshold - 2; bucket += 1) {
    const averageStart = Math.floor((bucket + 1) * every) + 1
    const averageEnd = Math.min(Math.floor((bucket + 2) * every) + 1, length)
    let averageX = 0
    let averageY = 0

    for (let index = averageStart; index < averageEnd; index += 1) {
      averageX += index
      averageY += data[index]
    }

    const averageCount = Math.max(1, averageEnd - averageStart)
    averageX /= averageCount
    averageY /= averageCount

    const rangeStart = Math.floor(bucket * every) + 1
    const rangeEnd = Math.min(Math.floor((bucket + 1) * every) + 1, length)
    let maxArea = -1
    let maxIndex = rangeStart

    for (let index = rangeStart; index < rangeEnd; index += 1) {
      const area = Math.abs(
        (anchor - averageX) * (data[index] - data[anchor]) -
          (anchor - index) * (averageY - data[anchor]),
      )
      if (area > maxArea) {
        maxArea = area
        maxIndex = index
      }
    }

    values.push(data[maxIndex])
    indices.push(maxIndex)
    anchor = maxIndex
  }

  values.push(data[length - 1])
  indices.push(length - 1)

  return { values, indices }
}
