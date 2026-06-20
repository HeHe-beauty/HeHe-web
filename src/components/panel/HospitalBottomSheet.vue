<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useMapStore } from '@/stores/mapStore'
import { calcDistance } from '@/utils/distance'
import DownloadModal from '@/components/modal/DownloadModal.vue'

const store = useMapStore()
const { isBottomSheetOpen, selectedHospital, userLat, userLng } = storeToRefs(store)

const isModalOpen = ref(false)

const distance = computed(() => {
  if (userLat.value == null || userLng.value == null) return null
  if (selectedHospital.value?.lat == null || selectedHospital.value?.lng == null) return null
  return calcDistance(userLat.value, userLng.value, selectedHospital.value.lat, selectedHospital.value.lng)
})

function close() {
  store.isBottomSheetOpen = false
  store.selectedHospital = null
}
</script>

<template>
  <transition name="overlay">
    <div v-if="isBottomSheetOpen" class="sheet-overlay" @click.self="close" />
  </transition>

  <transition name="sheet">
    <div v-if="isBottomSheetOpen && selectedHospital" class="bottom-sheet">

      <div class="sheet-header">
        <h2 class="sheet-name">{{ selectedHospital.name }}</h2>
        <button class="sheet-close" @click="close">✕</button>
      </div>

      <p class="sheet-address">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
          <circle cx="12" cy="9" r="2.5"/>
        </svg>
        {{ selectedHospital.address }}
      </p>

      <div v-if="selectedHospital.tags.length" class="tags">
        <span v-for="tag in selectedHospital.tags" :key="tag" class="tag">#{{ tag }}</span>
      </div>

      <div class="sheet-stats">
        <span v-if="distance" class="stat-item distance">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
          </svg>
          현위치에서 {{ distance }}
        </span>
        <span class="stat-item bookmark">
          ♥ <span class="bookmark-count">{{ String(selectedHospital.bookmarkCount).padStart(2, '0') }}</span>명이 관심있게 보고 있어요
        </span>
      </div>

      <div class="btn-row">
        <button class="btn-bookmark" @click="isModalOpen = true">찜하기</button>
        <button class="btn-contact" @click="isModalOpen = true">문의하기</button>
      </div>
    </div>
  </transition>

  <DownloadModal v-if="isModalOpen" @close="isModalOpen = false" />
</template>

<style scoped>
.sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.2);
  z-index: 150;
}

.bottom-sheet {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  width: max-content;
  min-width: 300px;
  max-width: min(400px, calc(100vw - 48px));
  background: white;
  border-radius: 20px;
  padding: 16px 20px 20px;
  z-index: 200;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
}


.sheet-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.sheet-name {
  font-size: 19px;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1.3;
}

.sheet-close {
  background: #f5f5f5;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  font-size: 14px;
  cursor: pointer;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sheet-address {
  font-size: 13px;
  color: #888;
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 14px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
}

.tag {
  font-size: 12px;
  color: #4061fa;
  background: #f0f3ff;
  border-radius: 8px;
  padding: 4px 10px;
  font-weight: 500;
}

.sheet-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
}

.stat-item {
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-item.distance {
  color: #666;
}

.stat-item.bookmark {
  color: #4061fa;
}

.bookmark-count {
  filter: blur(4px);
  user-select: none;
  pointer-events: none;
}

.btn-row {
  display: flex;
  gap: 8px;
}

.btn-bookmark,
.btn-contact {
  flex: 1;
  padding: 13px;
  font-size: 15px;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.btn-bookmark:hover,
.btn-contact:hover {
  opacity: 0.85;
}

.btn-bookmark {
  background: #eef1ff;
  color: #4061fa;
}

.btn-contact {
  background: #4061fa;
  color: white;
}


.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.25s ease;
}
.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

.sheet-enter-active,
.sheet-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.sheet-enter-from,
.sheet-leave-to {
  transform: translateX(-50%) translateY(20px);
  opacity: 0;
}
</style>
