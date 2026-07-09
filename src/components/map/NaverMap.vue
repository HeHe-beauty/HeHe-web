<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useMapStore } from '@/stores/mapStore'
import { debounce } from '@/utils/debounce'
import { hospitalService } from '@/services/hospitalService'
import { mergeClusterItems, markerSize } from '@/composables/useClusterMerge'
import type { MergedCluster } from '@/composables/useClusterMerge'
import type { HospitalListItem } from '@/types/hospital'
import { trackEvent } from '@/utils/gtag'

const store = useMapStore()
const mapRef = ref<naver.maps.Map | null>(null)
let markers: naver.maps.Marker[] = []

interface ActivePin { sourceKey: string; name: string }
let activePin: ActivePin | null = null
let activePinRef: naver.maps.Marker | null = null
let selectedHospitalMarker: naver.maps.Marker | null = null
// 단일 마커 callout 클릭으로 열린 경우 true — 이미 callout이 있으므로 빨간 핀 중복 표시 방지
let bottomSheetFromSingleMarker = false

// count=1 마커 전체 데이터 캐시. key: `${gridLat},${gridLng},${precision}` / equipId 변경 시 초기화
type CachedSingle = (HospitalListItem & { lat: number; lng: number }) | null
const singleCache = new Map<string, CachedSingle>()

let renderVersion = 0
let stationMarkerTimer: ReturnType<typeof setTimeout> | null = null
let userMarker: naver.maps.Marker | null = null

function showStationMarker(lat: number, lng: number) {
  if (!mapRef.value) return

  // 이전 역 마커 즉시 제거
  if (stationMarkerTimer) {
    clearTimeout(stationMarkerTimer)
    stationMarkerTimer = null
  }

  const marker = new naver.maps.Marker({
    position: new naver.maps.LatLng(lat, lng),
    map: mapRef.value,
    icon: {
      content: `<div style="width:28px;height:28px;background:#ff6f00;border-radius:50%;border:4px solid white;box-shadow:0 3px 12px rgba(255,111,0,0.5);transform:translate(-50%,-50%)"></div>`,
      anchor: new naver.maps.Point(0, 0),
    },
  })

  // 2.5초 후 제거
  stationMarkerTimer = setTimeout(() => {
    marker.setMap(null)
    stationMarkerTimer = null
  }, 2000)
}

defineExpose({ mapRef, showStationMarker })

onMounted(() => {
  initMap()
  requestUserLocation()
})

function initMap() {
  mapRef.value = new naver.maps.Map('map', {
    center: new naver.maps.LatLng(37.5665, 126.978),
    zoom: 13,
    mapTypeControl: false,
    scaleControl: false,
    logoControl: false,
    mapDataControl: false,
  })

  naver.maps.Event.addListener(mapRef.value, 'idle', debounce(loadClusters, 500))
  naver.maps.Event.addListener(mapRef.value, 'click', clearActivePin)
}

watch(() => store.selectedEquipId, () => {
  singleCache.clear()
  loadClusters()
})

watch(
  () => [store.isBottomSheetOpen, store.selectedHospital] as const,
  ([isOpen, hospital]) => {
    if (selectedHospitalMarker) {
      selectedHospitalMarker.setMap(null)
      selectedHospitalMarker = null
    }
    if (!isOpen) {
      renderClusterMarkers()
      return
    }
    if (bottomSheetFromSingleMarker) {
      bottomSheetFromSingleMarker = false
      return
    }
    if (!hospital) return
    const { lat, lng, name } = hospital
    if (lat == null || lng == null || !mapRef.value) return

    selectedHospitalMarker = new naver.maps.Marker({
      position: new naver.maps.LatLng(lat, lng),
      map: mapRef.value,
      icon: makeSelectedHospitalIcon(name),
    })
    mapRef.value.morph(new naver.maps.LatLng(lat, lng), Math.max(mapRef.value.getZoom(), 17))
  },
  { deep: true },
)

function requestUserLocation() {
  if (!navigator.geolocation) return

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      store.userLat = pos.coords.latitude
      store.userLng = pos.coords.longitude
      mapRef.value?.setCenter(new naver.maps.LatLng(store.userLat!, store.userLng!))
      showUserMarker(store.userLat!, store.userLng!)
    },
    () => {
      store.locationDenied = true
    },
  )
}

function showUserMarker(lat: number, lng: number) {
  if (!mapRef.value) return
  userMarker?.setMap(null)
  userMarker = new naver.maps.Marker({
    position: new naver.maps.LatLng(lat, lng),
    map: mapRef.value,
    icon: {
      content: `<div style="width:18px;height:18px;background:#4061fa;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(64,97,250,0.5);transform:translate(-50%,-50%)"></div>`,
      anchor: new naver.maps.Point(0, 0),
    },
  })
}

function toBackendZoom(naverZoom: number): number {
  if (naverZoom <= 12) return 9
  if (naverZoom <= 15) return 12
  if (naverZoom <= 17) return 14
  return 15
}

async function loadClusters() {
  if (!mapRef.value) return

  const bounds = mapRef.value.getBounds()
  const sw = bounds.getSW()
  const ne = bounds.getNE()

  const result = await hospitalService.getClusters({
    swLat: sw.lat(),
    swLng: sw.lng(),
    neLat: ne.lat(),
    neLng: ne.lng(),
    zoomLevel: toBackendZoom(mapRef.value.getZoom()),
    equipId: store.selectedEquipId,
  })

  store.precision = result.precision
  store.clusters = result.items
  await renderClusterMarkers()
}

const SINGLE_MARKER_MIN_ZOOM = 15

function markerFontSize(size: number): number {
  return Math.max(13, Math.round(size * 0.22))
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function makeClusterIcon(count: number): { content: string; anchor: naver.maps.Point } {
  const size = markerSize(count)
  return {
    content: `<div class="cluster-marker" style="width:${size}px;height:${size}px;font-size:${markerFontSize(size)}px">${count}</div>`,
    anchor: new naver.maps.Point(0, 0),
  }
}

function makeHospitalDotIcon(): { content: string; anchor: naver.maps.Point } {
  return {
    content: `<div class="hospital-marker-dot"><div class="hospital-marker-dot-ring"></div></div>`,
    anchor: new naver.maps.Point(0, 0),
  }
}

function makeHospitalPinIcon(name: string): { content: string; anchor: naver.maps.Point } {
  const cross = `<svg viewBox="0 0 24 24" width="14" height="14" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M9 3v6H3v6h6v6h6v-6h6V9h-6V3z"/></svg>`
  return {
    content: `<div style="display:inline-flex;flex-direction:column;align-items:center;transform:translate(-50%,calc(-100% + 10px))"><div class="hospital-callout"><div class="hospital-callout-badge">${cross}</div><span class="hospital-callout-name">${escapeHtml(name)}</span></div><div class="hospital-pin-stem"></div><div class="hospital-pin-dot"></div></div>`,
    anchor: new naver.maps.Point(0, 0),
  }
}

function makeSelectedHospitalIcon(name: string): { content: string; anchor: naver.maps.Point } {
  return {
    content: `<div style="display:inline-flex;flex-direction:column;align-items:center;transform:translate(-50%,calc(-100% + 10px))"><div style="background:#ff6348;color:white;padding:5px 10px;border-radius:8px;font-size:12px;font-weight:600;white-space:nowrap;box-shadow:0 2px 8px rgba(255,99,72,0.4);max-width:180px;overflow:hidden;text-overflow:ellipsis">${escapeHtml(name)}</div><div style="width:2px;height:6px;background:#ff6348"></div><div style="width:8px;height:8px;background:#ff6348;border-radius:50%;border:2px solid white;margin-top:-2px"></div></div>`,
    anchor: new naver.maps.Point(0, 0),
  }
}

function clearActivePin() {
  if (activePinRef) {
    activePinRef.setIcon(makeHospitalDotIcon())
    activePinRef.setZIndex(0)
  }
  activePin = null
  activePinRef = null

  if (store.isBottomSheetOpen) {
    store.isBottomSheetOpen = false
  } else if (store.isPanelOpen) {
    store.isPanelOpen = false
  }
}

// count=1 마커 전체 데이터 사전 조회 — 백엔드 응답 lat/lng 사용
async function prefetchSinglePositions(merged: MergedCluster[]): Promise<void> {
  await Promise.all(
    merged
      .filter((c) => c.count === 1)
      .map(async (cluster) => {
        const s = cluster.sources[0]
        if (!s) return
        const key = `${s.lat},${s.lng},${store.precision}`
        if (singleCache.has(key)) return

        try {
          const hospitals = await hospitalService.getByCluster({
            lat: s.lat,
            lng: s.lng,
            precision: store.precision,
            equipId: store.selectedEquipId,
          })
          const h = hospitals[0]
          singleCache.set(key, h ?? null)
        } catch {
          singleCache.set(key, null)
        }
      }),
  )
}

async function renderClusterMarkers() {
  if (!mapRef.value) return

  markers.forEach((m) => m.setMap(null))
  markers = []

  const myVersion = ++renderVersion
  const zoom = mapRef.value.getZoom()
  const merged = mergeClusterItems(store.clusters, zoom)

  await prefetchSinglePositions(merged)

  if (myVersion !== renderVersion || !mapRef.value) return

  const singleMarkerMap = new Map<string, naver.maps.Marker>()

  merged.forEach((cluster) => {
    const isCountOne = cluster.count === 1
    const isSingle = isCountOne && zoom >= SINGLE_MARKER_MIN_ZOOM
    const s = cluster.sources[0]
    if (isCountOne && !s) return
    const sourceKey = isCountOne ? `${s!.lat},${s!.lng},${store.precision}` : ''
    const cached = isCountOne ? (singleCache.get(sourceKey) ?? null) : null

    // 패널에서 선택된 병원: 빨간 핀이 이미 표시 중이므로 dot 마커 생성 건너뜀
    if (isSingle && store.isBottomSheetOpen && cached?.hospitalId != null && cached.hospitalId === store.selectedHospital?.hospitalId) {
      return
    }

    const marker = new naver.maps.Marker({
      position: new naver.maps.LatLng(
        cached?.lat ?? cluster.lat,
        cached?.lng ?? cluster.lng,
      ),
      map: mapRef.value!,
      icon: isSingle ? makeHospitalDotIcon() : makeClusterIcon(cluster.count),
    })

    if (isSingle) {
      singleMarkerMap.set(sourceKey, marker)
    }

    naver.maps.Event.addListener(marker, 'click', () => {
      const clickZoom = mapRef.value?.getZoom() ?? 13
      if (isSingle) {
        if (activePin?.sourceKey === sourceKey) {
          // callout 클릭 → bottom sheet 오픈 (단일 마커 경로: 빨간 핀 중복 방지용 플래그 선설정)
          if (cached) {
            bottomSheetFromSingleMarker = true
            store.selectedHospital = cached
            store.isBottomSheetOpen = true
          }
          return
        }
        if (activePinRef) {
          activePinRef.setIcon(makeHospitalDotIcon())
          activePinRef.setZIndex(0)
        }

        const name = cached?.name ?? '병원'
        marker.setIcon(makeHospitalPinIcon(name))
        marker.setZIndex(10)
        activePin = { sourceKey, name }
        activePinRef = marker
      } else if (cluster.sources.length === 1) {
        store.selectedClusters = cluster.sources
        store.isPanelOpen = true
        trackEvent('cluster_click', { count: cluster.count })
      } else {
        if (toBackendZoom(clickZoom) !== toBackendZoom(clickZoom + 1)) {
          mapRef.value?.setCenter(new naver.maps.LatLng(cluster.lat, cluster.lng))
          mapRef.value?.setZoom(clickZoom + 1)
        } else {
          store.selectedClusters = cluster.sources
          store.isPanelOpen = true
        }
        trackEvent('cluster_click', { count: cluster.count })
      }
    })

    markers.push(marker)
  })

  // 렌더 후 선택 상태 복원
  if (activePin) {
    const restored = singleMarkerMap.get(activePin.sourceKey)
    if (restored) {
      restored.setIcon(makeHospitalPinIcon(activePin.name))
      restored.setZIndex(10)
      activePinRef = restored
    } else {
      activePin = null
      activePinRef = null
    }
  }
}
</script>

<template>
  <div id="map" style="width: 100%; height: 100%" />
</template>
