<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useMapStore } from '@/stores/mapStore'
import { debounce } from '@/utils/debounce'
import { hospitalService } from '@/services/hospitalService'
import { mergeClusterItems, markerSize } from '@/composables/useClusterMerge'
import type { MergedCluster } from '@/composables/useClusterMerge'

const store = useMapStore()
const mapRef = ref<naver.maps.Map | null>(null)
let markers: naver.maps.Marker[] = []

interface SelectedHospital {
  sourceKey: string
  name: string
}
let selectedHospital: SelectedHospital | null = null
let selectedMarkerRef: naver.maps.Marker | null = null

// 단일 마커 이름+좌표 캐시. key: `${gridLat},${gridLng},${precision}` / equipId 변경 시 초기화
const singleCache = new Map<string, { lat: number; lng: number; name: string } | null>()
// geocoding 결과 캐시. key: address 문자열 / address는 equipId와 무관하므로 영구 보존
const geocodeCache = new Map<string, { lat: number; lng: number } | null>()

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
  naver.maps.Event.addListener(mapRef.value, 'click', clearSelectedHospital)
}

watch(() => store.selectedEquipId, () => {
  singleCache.clear()
  loadClusters()
})

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

function clearSelectedHospital() {
  if (selectedMarkerRef) {
    selectedMarkerRef.setIcon(makeHospitalDotIcon())
  }
  selectedHospital = null
  selectedMarkerRef = null
}

function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  if (geocodeCache.has(address)) return Promise.resolve(geocodeCache.get(address)!)

  return new Promise((resolve) => {
    naver.maps.Service.geocode({ query: address }, (status, response) => {
      if (status !== naver.maps.Service.Status.OK) {
        geocodeCache.set(address, null)
        resolve(null)
        return
      }
      const addr = response.v2?.addresses?.[0]
      if (!addr) {
        geocodeCache.set(address, null)
        resolve(null)
        return
      }
      const coords = { lat: parseFloat(addr.y), lng: parseFloat(addr.x) }
      geocodeCache.set(address, coords)
      resolve(coords)
    })
  })
}

// count=1 마커 위치 사전 조회 — address geocoding으로 실제 병원 좌표 보정 (줌 레벨 무관)
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
          // address 기반 geocoding으로 실제 좌표 획득
          const coords = await geocodeAddress(h.address)
          singleCache.set(key, coords ? { ...coords, name: h.name } : null)
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
    const isSingle = isCountOne && zoom >= SINGLE_MARKER_MIN_ZOOM  // 시각 스타일 기준
    const s = cluster.sources[0]
    // count=1이면 줌 레벨과 무관하게 실제 병원 좌표 사용
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
      if (isSingle) {
        if (selectedHospital?.sourceKey === sourceKey) return
        if (selectedMarkerRef) selectedMarkerRef.setIcon(makeHospitalDotIcon())

        const name = cached?.name ?? '병원'
        marker.setIcon(makeHospitalPinIcon(name))
        selectedHospital = { sourceKey, name }
        selectedMarkerRef = marker
      } else if (cluster.sources.length === 1) {
        store.selectedCluster = cluster.sources[0]
        store.isPanelOpen = true
      } else {
        const currentZoom = mapRef.value?.getZoom() ?? 13
        mapRef.value?.setCenter(new naver.maps.LatLng(cluster.lat, cluster.lng))
        mapRef.value?.setZoom(Math.min(currentZoom + 1, 16))
      }
    })

    markers.push(marker)
  })

  // 렌더 후 선택 상태 복원
  if (selectedHospital) {
    const restored = singleMarkerMap.get(selectedHospital.sourceKey)
    if (restored) {
      restored.setIcon(makeHospitalPinIcon(selectedHospital.name))
      selectedMarkerRef = restored
    } else {
      selectedHospital = null
      selectedMarkerRef = null
    }
  }
}
</script>

<template>
  <div id="map" style="width: 100%; height: 100%" />
</template>
