<script setup lang="ts">
import { ref } from 'vue'
import NaverMap from '@/components/map/NaverMap.vue'
import ZoomControl from '@/components/map/ZoomControl.vue'
import EquipFilterBar from '@/components/filter/EquipFilterBar.vue'

const naverMapRef = ref<InstanceType<typeof NaverMap> | null>(null)
</script>

<template>
  <div class="map-view">
    <NaverMap ref="naverMapRef" />
    <EquipFilterBar />
    <ZoomControl :map="naverMapRef?.mapRef ?? null" />
  </div>
</template>

<style scoped>
.map-view {
  width: 100%;
  height: 100%;
  position: relative;
}
</style>
