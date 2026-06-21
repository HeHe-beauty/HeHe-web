<script setup lang="ts">
import { useMapStore } from '@/stores/mapStore'
import { storeToRefs } from 'pinia'

const store = useMapStore()
const { selectedEquipId, isPanelOpen } = storeToRefs(store)

const EQUIP_LIST = [
  { id: 1, name: '젠틀맥스프로플러스' },
  { id: 2, name: '아포지플러스' },
  { id: 3, name: '클라리티2' },
] as const

function selectEquip(id: number) {
  if (selectedEquipId.value === id) return
  selectedEquipId.value = id
  isPanelOpen.value = false
}
</script>

<template>
  <div class="equip-filter-bar">
    <button
      v-for="equip in EQUIP_LIST"
      :key="equip.id"
      class="equip-btn"
      :class="{ active: selectedEquipId === equip.id }"
      @click="selectEquip(equip.id)"
    >
      {{ equip.name }}
    </button>
  </div>
</template>

<style scoped>
.equip-filter-bar {
  display: flex;
  gap: 8px;
}

.equip-btn {
  padding: 8px 16px;
  border-radius: 20px;
  border: 2px solid #e0e0e0;
  background: white;
  font-size: 13px;
  font-weight: 500;
  color: #555;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
  transition:
    background 0.15s,
    border-color 0.15s,
    color 0.15s;
}

.equip-btn:hover {
  border-color: #4061fa;
  color: #4061fa;
}

.equip-btn.active {
  background: #4061fa;
  border-color: #4061fa;
  color: white;
}
</style>
