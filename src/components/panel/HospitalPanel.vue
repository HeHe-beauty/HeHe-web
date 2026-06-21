<script setup lang="ts">
import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMapStore } from '@/stores/mapStore'
import { useHospitals } from '@/composables/useHospitals'
import HospitalCard from './HospitalCard.vue'
import type { HospitalListItem } from '@/types/hospital'

const store = useMapStore()
const { selectedClusters, isPanelOpen, hospitals, precision, selectedEquipId } = storeToRefs(store)

const { fetchByCluster } = useHospitals()
const isLoading = ref(false)

watch(selectedClusters, async (clusters) => {
  if (!clusters.length) return
  isLoading.value = true
  try {
    const results = await Promise.all(
      clusters.map((c) => fetchByCluster(c.lat, c.lng, precision.value, selectedEquipId.value)),
    )
    const seen = new Set<number>()
    store.hospitals = results.flat().filter((h) => {
      if (seen.has(h.hospitalId)) return false
      seen.add(h.hospitalId)
      return true
    })
  } finally {
    isLoading.value = false
  }
})

function openBottomSheet(h: HospitalListItem) {
  store.selectedHospital = h
  store.isBottomSheetOpen = true
}
</script>

<template>
  <transition name="slide">
    <div v-if="isPanelOpen" class="hospital-panel">
      <div class="panel-header-row">
        <p class="panel-header">병원 {{ hospitals.length }}곳</p>
        <button class="close-btn" @click="store.isPanelOpen = false">✕</button>
      </div>

      <div v-if="isLoading" class="loading">불러오는 중...</div>

      <template v-else>
        <HospitalCard
          v-for="h in hospitals"
          :key="h.hospitalId"
          :hospital="h"
          @click="openBottomSheet(h)"
        />
      </template>
    </div>
  </transition>
</template>

<style scoped>
.hospital-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 360px;
  height: 100vh;
  background: white;
  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.1);
  padding: 20px 16px;
  overflow-y: auto;
  z-index: 100;
}

.panel-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.panel-header {
  font-size: 16px;
  font-weight: bold;
}

.close-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border: none;
  border-radius: 50%;
  font-size: 16px;
  cursor: pointer;
  color: #555;
  flex-shrink: 0;
  transition: background 0.15s;
}

.close-btn:hover {
  background: #ebebeb;
}

.loading {
  font-size: 14px;
  color: #999;
  text-align: center;
  padding: 40px 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
