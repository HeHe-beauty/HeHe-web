<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useMapStore } from '@/stores/mapStore'
import { debounce } from '@/utils/debounce'
import { hospitalService } from '@/services/hospitalService'

const store = useMapStore()
const mapRef = ref<naver.maps.Map | null>(null)
let markers: naver.maps.Marker[] = []

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
    zoomLevel: mapRef.value.getZoom(),
  })

  store.precision = result.precision
  store.clusters = result.items
  renderClusterMarkers()
}

function renderClusterMarkers() {
  markers.forEach((m) => m.setMap(null))
  markers = []

  store.clusters.forEach((cluster) => {
    const marker = new naver.maps.Marker({
      position: new naver.maps.LatLng(cluster.lat, cluster.lng),
      map: mapRef.value!,
      icon: {
        content: `<div class="cluster-marker">${cluster.count}</div>`,
        anchor: new naver.maps.Point(20, 20),
      },
    })

    naver.maps.Event.addListener(marker, 'click', () => {
      store.selectedCluster = cluster
      store.isPanelOpen = true
      mapRef.value?.setCenter(new naver.maps.LatLng(cluster.lat, cluster.lng))
    })

    markers.push(marker)
  })
}
</script>

<template>
  <div id="map" style="width: 100%; height: 100%" />
</template>