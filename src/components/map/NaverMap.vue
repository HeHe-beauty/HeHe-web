<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useMapStore } from '@/stores/mapStore'
import { debounce } from '@/utils/debounce'
import { hospitalService } from '@/services/hospitalService'

const store = useMapStore()
const mapRef = ref<naver.maps.Map | null>(null)

let markerClustering: MarkerClustering | null = null
const markerCountMap = new Map<naver.maps.Marker, number>()

defineExpose({ mapRef })

onMounted(() => {
  initMap()
  requestUserLocation()
})

function initMap() {
  mapRef.value = new naver.maps.Map('map', {
    center: new naver.maps.LatLng(37.5665, 126.978),
    zoom: 12,
    mapTypeControl: false,
    scaleControl: false,
    logoControl: false,
    mapDataControl: false,
  })

  naver.maps.Event.addListener(mapRef.value, 'idle', debounce(loadClusters, 500))
}

watch(
  () => store.selectedEquipId,
  () => loadClusters(),
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
  renderClusterMarkers()
}

function getClusterSize(count: number): number {
  const min = 36
  const max = 64
  const logMin = Math.log(1)
  const logMax = Math.log(500)
  const logCount = Math.log(Math.max(1, count))
  return Math.round(min + ((logCount - logMin) / (logMax - logMin)) * (max - min))
}

function makeMarkerIcon(count: number): { content: string; anchor: naver.maps.Point } {
  const size = getClusterSize(count)
  return {
    content: `<div class="cluster-marker" style="width:${size}px;height:${size}px;font-size:${size < 44 ? 12 : 14}px">${count}</div>`,
    anchor: new naver.maps.Point(0, 0),
  }
}

function renderClusterMarkers() {
  if (!mapRef.value) return

  if (markerClustering) {
    markerClustering.setMap(null)
    markerClustering = null
  }
  markerCountMap.clear()

  const markers: naver.maps.Marker[] = store.clusters.map((cluster) => {
    const marker = new naver.maps.Marker({
      position: new naver.maps.LatLng(cluster.lat, cluster.lng),
      icon: makeMarkerIcon(cluster.count),
    })

    naver.maps.Event.addListener(marker, 'click', () => {
      store.selectedCluster = cluster
      store.isPanelOpen = true
      mapRef.value?.setCenter(new naver.maps.LatLng(cluster.lat, cluster.lng))
    })

    markerCountMap.set(marker, cluster.count)
    return marker
  })

  markerClustering = new MarkerClustering({
    map: mapRef.value,
    markers,
    disableClickZoom: false,
    minClusterSize: 2,
    maxZoom: 15,
    gridSize: 80,
    icons: [
      {
        content:
          '<div class="cluster-marker" style="width:40px;height:40px;font-size:12px"><span class="cluster-num"></span></div>',
        size: new naver.maps.Size(40, 40),
        anchor: new naver.maps.Point(0, 0),
      },
    ],
    indexGenerator: [Number.MAX_SAFE_INTEGER],
    stylingFunction: (clusterMarker: naver.maps.Marker, count: number) => {
      const thisCluster = markerClustering?._clusters.find(
        (c) => c._clusterMarker === clusterMarker,
      )

      const totalCount = thisCluster
        ? thisCluster._clusterMember.reduce(
            (sum, m) => sum + (markerCountMap.get(m) ?? 1),
            0,
          )
        : count

      const el = clusterMarker.getElement()
      if (!el) return

      const numEl = el.querySelector('.cluster-num') as HTMLElement | null
      if (numEl) numEl.textContent = String(totalCount)

      const circleEl = el.querySelector('.cluster-marker') as HTMLElement | null
      if (circleEl) {
        const size = getClusterSize(totalCount)
        circleEl.style.width = `${size}px`
        circleEl.style.height = `${size}px`
        circleEl.style.fontSize = `${size < 44 ? 12 : 14}px`
      }
    },
  })
}
</script>

<template>
  <div id="map" style="width: 100%; height: 100%" />
</template>
