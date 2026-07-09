<script setup lang="ts">
import { ref } from 'vue'
import NaverMap from '@/components/map/NaverMap.vue'
import ZoomControl from '@/components/map/ZoomControl.vue'
import EquipFilterBar from '@/components/filter/EquipFilterBar.vue'
import HospitalPanel from '@/components/panel/HospitalPanel.vue'
import HospitalBottomSheet from '@/components/panel/HospitalBottomSheet.vue'
import SearchBar from '@/components/search/SearchBar.vue'
import FaqModal from '@/components/modal/FaqModal.vue'
import LeftControls from '@/components/map/LeftControls.vue'

const isFaqOpen = ref(false)

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
    <LeftControls @open-faq="isFaqOpen = true" />
    <HospitalPanel />
    <HospitalBottomSheet />
    <FaqModal v-if="isFaqOpen" @close="isFaqOpen = false" />
    <footer class="site-footer">
      <RouterLink to="/privacy" target="_blank">개인정보처리방침</RouterLink>
      <span class="divider">·</span>
      <RouterLink to="/terms" target="_blank">서비스이용약관</RouterLink>
    </footer>
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

.site-footer {
  position: absolute;
  bottom: 12px;
  left: 16px;
  display: flex;
  align-items: center;
  gap: 6px;
  z-index: 100;
  font-size: 11px;
}

.site-footer a {
  color: #555;
  text-decoration: none;
  font-weight: 700;
  text-shadow: 0 1px 3px rgba(255, 255, 255, 0.9);
}

.site-footer a:hover {
  text-decoration: underline;
}

.divider {
  color: #888;
  font-weight: 700;
  text-shadow: 0 1px 3px rgba(255, 255, 255, 0.9);
}
</style>
