<script setup lang="ts">
import { ref } from 'vue'
import NaverMap from '@/components/map/NaverMap.vue'
import ZoomControl from '@/components/map/ZoomControl.vue'
import EquipFilterBar from '@/components/filter/EquipFilterBar.vue'
import HospitalPanel from '@/components/panel/HospitalPanel.vue'
import HospitalBottomSheet from '@/components/panel/HospitalBottomSheet.vue'

const naverMapRef = ref<InstanceType<typeof NaverMap> | null>(null)
</script>

<template>
  <div class="map-view">
    <NaverMap ref="naverMapRef" />
    <EquipFilterBar />
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
</style>
