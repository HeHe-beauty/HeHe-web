<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useMapStore } from '@/stores/mapStore'
import { useHospitals } from '@/composables/useHospitals'
import HospitalCard from './HospitalCard.vue'
import type { HospitalListItem } from '@/types/hospital'
import { trackEvent } from '@/utils/gtag'

const store = useMapStore()
const { selectedClusters, isPanelOpen, hospitals, precision, selectedEquipId, isPanelCollapsed } = storeToRefs(store)

const { fetchByCluster } = useHospitals()
const isLoading = ref(false)

const dragOffset = ref(0)
const isDragging = ref(false)
let dragStartY = 0
const COLLAPSE_THRESHOLD = 60
const EXPAND_THRESHOLD = 60
const HANDLE_HEIGHT = 40

const panelStyle = computed(() => {
  if (window.innerWidth > 768) return {}
  if (isDragging.value) {
    if (isPanelCollapsed.value) {
      const offset = Math.min(0, dragOffset.value)
      return { transform: `translateY(calc(40vh - ${HANDLE_HEIGHT}px + ${offset}px))`, transition: 'none' }
    }
    const offset = Math.max(0, dragOffset.value)
    if (offset > 0) return { transform: `translateY(${offset}px)`, transition: 'none' }
  }
  if (isPanelCollapsed.value) {
    return { transform: `translateY(calc(40vh - ${HANDLE_HEIGHT}px))` }
  }
  return {}
})

function onResize() {
  if (window.innerWidth > 768) store.isPanelCollapsed = false
}

onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

function onMove(clientY: number) {
  dragOffset.value = clientY - dragStartY
}

function onEnd() {
  isDragging.value = false
  document.removeEventListener('touchmove', onTouchMove)
  document.removeEventListener('touchend', onEnd)
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onEnd)
  if (isPanelCollapsed.value) {
    if (dragOffset.value < -EXPAND_THRESHOLD) store.isPanelCollapsed = false
  } else {
    if (dragOffset.value > COLLAPSE_THRESHOLD) store.isPanelCollapsed = true
  }
  dragOffset.value = 0
}

function onTouchMove(e: TouchEvent) {
  e.preventDefault()
  onMove(e.touches[0]!.clientY)
}

function onMouseMove(e: MouseEvent) {
  onMove(e.clientY)
}

function onDragStart(e: TouchEvent | MouseEvent) {
  dragStartY = e instanceof TouchEvent ? e.touches[0]!.clientY : e.clientY
  isDragging.value = true
  document.addEventListener('touchmove', onTouchMove, { passive: false })
  document.addEventListener('touchend', onEnd)
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onEnd)
}

watch(selectedClusters, async (clusters) => {
  if (!clusters.length) return
  store.isPanelCollapsed = false
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
  if (window.innerWidth <= 768) {
    store.isPanelOpen = false
  }
  store.isBottomSheetOpen = true
  trackEvent('hospital_select', { hospital_id: h.hospitalId, hospital_name: h.name })
}
</script>

<template>
  <transition name="slide">
    <div
      v-if="isPanelOpen"
      class="hospital-panel"
      :style="panelStyle"
    >
      <div
        class="drag-handle-area"
        @touchstart="onDragStart"
        @mousedown="onDragStart"
      >
        <div class="drag-handle"></div>
      </div>

      <div class="panel-header-row">
        <p class="panel-header">병원 {{ hospitals.length }}곳</p>
        <button class="close-btn" @click="store.isPanelOpen = false">✕</button>
      </div>

      <div v-if="isLoading" class="loading">불러오는 중...</div>

      <template v-else>
        <div class="hospital-list">
          <HospitalCard
            v-for="h in hospitals"
            :key="h.hospitalId"
            :hospital="h"
            @click="openBottomSheet(h)"
          />
        </div>
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
  overscroll-behavior: contain;
  z-index: 100;
}

.drag-handle-area {
  display: none;
}

.drag-handle {
  width: 36px;
  height: 4px;
  background: #d0d0d0;
  border-radius: 2px;
  margin: 0 auto;
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

.hospital-list {
  display: flex;
  flex-direction: column;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

@media (max-width: 768px) {
  .hospital-panel {
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: 40vh;
    border-radius: 20px 20px 0 0;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.12);
    padding: 6px 12px 20px;
    overflow-y: hidden;
    transition: transform 0.3s ease;
  }

  .drag-handle-area {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px 0 10px;
    cursor: grab;
  }

  .close-btn {
    display: none;
  }

  .hospital-list {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    align-items: start;
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
    max-height: calc(40vh - 80px);
  }

  .slide-enter-from,
  .slide-leave-to {
    transform: translateY(100%);
  }
}
</style>
