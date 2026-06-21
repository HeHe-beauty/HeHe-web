<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useMapStore } from '@/stores/mapStore'
import { debounce } from '@/utils/debounce'
import { hospitalService } from '@/services/hospitalService'
import { mergeClusterItems, markerSize } from '@/composables/useClusterMerge'
import type { MergedCluster } from '@/composables/useClusterMerge'
import { geocodeAddress } from '@/utils/geocode'
import type { HospitalListItem } from '@/types/hospital'

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

defineExpose({ mapRef })

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
  naver.maps.Event.addListener(mapRef.value, 'zoom_changed', () => {
    console.log('[zoom]', mapRef.value?.getZoom())
  })
}

watch(() => store.selectedEquipId, () => {
  singleCache.clear()
  loadClusters()
})

watch(
  () => store.isBottomSheetOpen,
  (isOpen) => {
    // 기존 선택 마커 제거 (열림/닫힘 모두)
    if (selectedHospitalMarker) {
      selectedHospitalMarker.setMap(null)
      selectedHospitalMarker = null
    }
    if (!isOpen) return

    // 단일 마커 callout 경유: 이미 callout이 지도에 있으므로 빨간 핀 추가하지 않음
    if (bottomSheetFromSingleMarker) {
      bottomSheetFromSingleMarker = false
      return
    }

    if (!store.selectedHospital) return
    const { lat, lng, name } = store.selectedHospital
    if (lat == null || lng == null || !mapRef.value) return

    // 패널 목록 경유: 빨간 핀 추가 + 지도 이동
    selectedHospitalMarker = new naver.maps.Marker({
      position: new naver.maps.LatLng(lat, lng),
      map: mapRef.value,
      icon: makeSelectedHospitalIcon(name),
    })

    mapRef.value.setCenter(new naver.maps.LatLng(lat, lng))
    if (mapRef.value.getZoom() < 15) {
      mapRef.value.setZoom(15)
    }
  },
)

function requestUserLocation() {
  if (!navigator.geolocation) return

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      store.userLat = pos.coords.latitude
      store.userLng = pos.coords.longitude
      mapRef.value?.setCenter(new naver.maps.LatLng(store.userLat!, store.userLng!))
    },
    () => {},
  )
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
  }
  activePin = null
  activePinRef = null
}

// count=1 마커 전체 데이터 사전 조회 — address geocoding으로 실제 병원 좌표 보정 (줌 레벨 무관)
async function prefetchSinglePositions(merged: MergedCluster[]): Promise<void> {
  await Promise.all(
    merged
      .filter((c) => c.count === 1)
      .map(async (cluster) => {
        const s = cluster.sources[0]
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
          if (!h) {
            singleCache.set(key, null)
            return
          }
          const coords = await geocodeAddress(h.address)
          singleCache.set(key, coords ? { ...h, lat: coords.lat, lng: coords.lng } : null)
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
    const sourceKey = isCountOne ? `${s.lat},${s.lng},${store.precision}` : ''
    const cached = isCountOne ? (singleCache.get(sourceKey) ?? null) : null

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
        if (activePinRef) activePinRef.setIcon(makeHospitalDotIcon())

        console.log('[click] single marker | zoom:', clickZoom)
        const name = cached?.name ?? '병원'
        marker.setIcon(makeHospitalPinIcon(name))
        activePin = { sourceKey, name }
        activePinRef = marker
      } else if (cluster.sources.length === 1) {
        console.log('[click] open panel (single source) | zoom:', clickZoom, '| count:', cluster.count)
        store.selectedClusters = cluster.sources
        store.isPanelOpen = true
      } else {
        if (toBackendZoom(clickZoom) !== toBackendZoom(clickZoom + 1)) {
          console.log('[click] zoom in | zoom:', clickZoom, '→', clickZoom + 1, '| backend:', toBackendZoom(clickZoom), '→', toBackendZoom(clickZoom + 1), '| sources:', cluster.sources.length)
          mapRef.value?.setCenter(new naver.maps.LatLng(cluster.lat, cluster.lng))
          mapRef.value?.setZoom(clickZoom + 1)
        } else {
          console.log('[click] open panel (precision unchanged at next zoom) | zoom:', clickZoom, '| backend:', toBackendZoom(clickZoom), '| sources:', cluster.sources.length)
          store.selectedClusters = cluster.sources
          store.isPanelOpen = true
        }
      }
    })

    markers.push(marker)
  })

  // 렌더 후 선택 상태 복원
  if (activePin) {
    const restored = singleMarkerMap.get(activePin.sourceKey)
    if (restored) {
      restored.setIcon(makeHospitalPinIcon(activePin.name))
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
