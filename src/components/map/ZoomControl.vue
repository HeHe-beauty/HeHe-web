<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useMapStore } from '@/stores/mapStore'

const props = defineProps<{
  map: naver.maps.Map | null
}>()

const store = useMapStore()
const { isPanelOpen, isPanelCollapsed } = storeToRefs(store)

const windowWidth = ref(window.innerWidth)

function onResize() {
  windowWidth.value = window.innerWidth
}

onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

const controlRight = computed(() => {
  if (windowWidth.value <= 768) return '16px'
  return isPanelOpen.value ? '376px' : '16px'
})

const controlBottom = computed(() => {
  if (windowWidth.value <= 768) {
    return isPanelOpen.value && !isPanelCollapsed.value ? 'calc(40vh + 12px)' : '16px'
  }
  return '80px'
})

function zoomIn() {
  if (!props.map) return
  props.map.setZoom(props.map.getZoom() + 1)
}

function zoomOut() {
  if (!props.map) return
  props.map.setZoom(props.map.getZoom() - 1)
}

function goToMyLocation() {
  if (!props.map) return
  if (store.userLat == null || store.userLng == null) {
    alert('위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.')
    return
  }
  props.map.setCenter(new naver.maps.LatLng(store.userLat, store.userLng))
}
</script>

<template>
  <div class="zoom-control" :style="{ right: controlRight, bottom: controlBottom }">
    <button class="zoom-btn" @click="zoomIn">+</button>
    <button class="zoom-btn" @click="zoomOut">−</button>
    <button class="zoom-btn location-btn" @click="goToMyLocation">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.zoom-control {
  position: absolute;
  right: 16px;
  bottom: 80px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  z-index: 110;
  transition: right 0.3s ease, bottom 0.3s ease;
}

.zoom-btn {
  width: 40px;
  height: 40px;
  background: white;
  border: none;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  font-size: 20px;
  font-weight: 300;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  transition: background 0.15s;
}

.zoom-btn:hover {
  background: #f5f5f5;
}

.location-btn {
  margin-top: 6px;
  color: #4061fa;
}

@media (max-width: 768px) {
  .zoom-btn:not(.location-btn) {
    display: none;
  }

  .location-btn {
    margin-top: 0;
  }
}
</style>