import type { ClusterItem } from '@/types/hospital'

export interface MergedCluster {
  lat: number
  lng: number
  count: number
  sources: ClusterItem[]
}

function worldPixel(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const scale = 256 * Math.pow(2, zoom)
  const x = ((lng + 180) / 360) * scale
  const sinLat = Math.sin((lat * Math.PI) / 180)
  const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale
  return { x, y }
}

function pixelDist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

function mergeRadius(count: number): number {
  if (count >= 100) return 70
  if (count >= 10) return 62
  return 54
}

export function markerSize(count: number): number {
  return Math.min(Math.max(68 + (Math.min(Math.max(count - 2, 0), 48) / 3) * 5, 68), 128)
}

function weightedCenter(sources: ClusterItem[]): { lat: number; lng: number } {
  const total = sources.reduce((s, item) => s + item.count, 0)
  return {
    lat: sources.reduce((s, item) => s + item.lat * item.count, 0) / total,
    lng: sources.reduce((s, item) => s + item.lng * item.count, 0) / total,
  }
}

export function mergeClusterItems(items: ClusterItem[], zoom: number): MergedCluster[] {
  // Pass 1: 픽셀 반경 기준 병합 (앱의 _mergeHospitalMapItems와 동일)
  type Group = { sources: ClusterItem[]; px: { x: number; y: number }; totalCount: number }
  const groups: Group[] = []

  for (const item of items) {
    const pt = worldPixel(item.lat, item.lng, zoom)
    let placed = false

    for (const g of groups) {
      const radius = mergeRadius(Math.max(g.totalCount, item.count))
      if (pixelDist(pt, g.px) < radius) {
        g.sources.push(item)
        g.totalCount += item.count
        const wc = weightedCenter(g.sources)
        g.px = worldPixel(wc.lat, wc.lng, zoom)
        placed = true
        break
      }
    }

    if (!placed) {
      groups.push({ sources: [item], px: pt, totalCount: item.count })
    }
  }

  let nodes: MergedCluster[] = groups.map((g) => {
    const wc = weightedCenter(g.sources)
    return { lat: wc.lat, lng: wc.lng, count: g.totalCount, sources: g.sources }
  })

  // Pass 2: 시각적으로 겹치는 마커 추가 병합 (앱의 _mergeOverlappingHospitalMarkerNodes와 동일)
  let changed = true
  while (changed) {
    changed = false
    const used = new Set<number>()
    const next: MergedCluster[] = []

    for (let i = 0; i < nodes.length; i++) {
      if (used.has(i)) continue

      let mergedJ = -1
      for (let j = i + 1; j < nodes.length; j++) {
        if (used.has(j)) continue
        const nodeI = nodes[i]!
        const nodeJ = nodes[j]!
        const threshold = (markerSize(nodeI.count) + markerSize(nodeJ.count)) / 2 + 12
        const ptA = worldPixel(nodeI.lat, nodeI.lng, zoom)
        const ptB = worldPixel(nodeJ.lat, nodeJ.lng, zoom)
        if (pixelDist(ptA, ptB) < threshold) {
          mergedJ = j
          break
        }
      }

      if (mergedJ >= 0) {
        const nodeI = nodes[i]!
        const nodeM = nodes[mergedJ]!
        const combined = [...nodeI.sources, ...nodeM.sources]
        const wc = weightedCenter(combined)
        next.push({
          lat: wc.lat,
          lng: wc.lng,
          count: nodeI.count + nodeM.count,
          sources: combined,
        })
        used.add(i)
        used.add(mergedJ)
        changed = true
      } else {
        next.push(nodes[i]!)
        used.add(i)
      }
    }

    nodes = next
  }

  return nodes
}
