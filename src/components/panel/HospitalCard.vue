<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useMapStore } from '@/stores/mapStore'
import { calcDistance } from '@/utils/distance'
import type { HospitalListItem } from '@/types/hospital'

const props = defineProps<{ hospital: HospitalListItem }>()
const emit = defineEmits<{ click: [] }>()

const store = useMapStore()
const { userLat, userLng } = storeToRefs(store)

const distance = computed(() => {
  if (userLat.value == null || userLng.value == null) return null
  if (props.hospital.lat == null || props.hospital.lng == null) return null
  return calcDistance(userLat.value, userLng.value, props.hospital.lat, props.hospital.lng)
})
</script>

<template>
  <div class="hospital-card" @click="emit('click')">
    <div class="card-main">
      <div class="card-info">
        <p class="hospital-name">{{ hospital.name }}</p>
        <p class="hospital-address">{{ hospital.address }}</p>
      </div>
      <div class="card-meta">
        <span v-if="distance" class="distance-badge">{{ distance }}</span>
        <svg class="chevron" width="7" height="12" viewBox="0 0 7 12" fill="none">
          <path d="M1 1l5 5-5 5" stroke="#c0c0c0" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </div>

    <p class="bookmark">
      ♥ <span class="bookmark-count">{{ String(hospital.bookmarkCount).padStart(2, '0') }}</span>명이 관심있게 보고 있어요
    </p>
  </div>
</template>

<style scoped>
.hospital-card {
  background: white;
  border-radius: 14px;
  padding: 14px 16px;
  margin-bottom: 10px;
  cursor: pointer;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.07);
  border: 1px solid #f0f0f0;
  transition: box-shadow 0.15s ease, transform 0.15s ease;
}

.hospital-card:hover {
  box-shadow: 0 4px 16px rgba(64, 97, 250, 0.12);
  transform: translateY(-1px);
}

.card-main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.card-info {
  flex: 1;
  min-width: 0;
}

.hospital-name {
  font-size: 15px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hospital-address {
  font-size: 12px;
  color: #aaa;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.distance-badge {
  font-size: 11px;
  font-weight: 600;
  color: #4061fa;
  background: #eef1ff;
  border-radius: 20px;
  padding: 3px 8px;
  white-space: nowrap;
}

.chevron {
  flex-shrink: 0;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 10px;
}

.tag {
  font-size: 11px;
  color: #4061fa;
  background: #f0f3ff;
  border-radius: 6px;
  padding: 3px 7px;
  font-weight: 500;
}

.bookmark {
  font-size: 12px;
  color: #4061fa;
}

.bookmark-count {
  filter: blur(4px);
  user-select: none;
  pointer-events: none;
}
</style>
