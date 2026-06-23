<script setup lang="ts">
import { ref } from 'vue'
import NaverMap from '@/components/map/NaverMap.vue'
import ZoomControl from '@/components/map/ZoomControl.vue'
import EquipFilterBar from '@/components/filter/EquipFilterBar.vue'
import HospitalPanel from '@/components/panel/HospitalPanel.vue'
import HospitalBottomSheet from '@/components/panel/HospitalBottomSheet.vue'
import SearchBar from '@/components/search/SearchBar.vue'

interface Station {
  name: string
  lat: number
  lng: number
  line: string
}

const naverMapRef = ref<InstanceType<typeof NaverMap> | null>(null)

function onStationSelect(station: Station) {
  const map = naverMapRef.value?.mapRef
  if (!map) return
  map.setCenter(new naver.maps.LatLng(station.lat, station.lng))
  map.setZoom(15)
  naverMapRef.value?.showStationMarker(station.lat, station.lng)
}
</script>

<template>
  <div class="map-view">
    <NaverMap ref="naverMapRef" />
    <div class="top-bar">
      <SearchBar @select="onStationSelect" />
      <EquipFilterBar />
    </div>
    <ZoomControl :map="naverMapRef?.mapRef ?? null" />
    <HospitalPanel />
    <HospitalBottomSheet />
  </div>
</template>

<style scoped>
.map-view {
  width: 100%;
  height: 100%;
  position: relative;
}

.top-bar {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  z-index: 150;
}
</style>
