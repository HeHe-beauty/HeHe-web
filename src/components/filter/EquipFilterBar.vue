<script setup lang="ts">
import { ref } from 'vue'
import { useMapStore } from '@/stores/mapStore'
import { storeToRefs } from 'pinia'

const store = useMapStore()
const { selectedEquipId, isPanelOpen } = storeToRefs(store)

const EQUIP_LIST = [
  { id: 1, name: '젠틀맥스프로플러스', tip: '강력한 제모력으로\n확실한 효과를 원한다면' },
  { id: 2, name: '아포지플러스',       tip: '합리적인 비용으로\n부담 없이 시작하고 싶다면' },
  { id: 3, name: '클라리티2',          tip: '빠른 시술로\n시간을 아끼고 싶다면' },
] as const

function selectEquip(id: number) {
  if (selectedEquipId.value === id) return
  selectedEquipId.value = id
  isPanelOpen.value = false
}

const hoverId = ref<number | null>(null)
</script>

<template>
  <div class="equip-filter-bar">
    <div
      v-for="equip in EQUIP_LIST"
      :key="equip.id"
      class="equip-wrapper"
      @mouseenter="hoverId = equip.id"
      @mouseleave="hoverId = null"
      @click="hoverId = equip.id"
    >
      <div v-if="hoverId === equip.id" class="tooltip">{{ equip.tip }}</div>
      <button
        class="equip-btn"
        :class="{ active: selectedEquipId === equip.id }"
        @click="selectEquip(equip.id)"
      >
        {{ equip.name }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.equip-filter-bar {
  display: flex;
  gap: 8px;
}

.equip-wrapper {
  position: relative;
}

.tooltip {
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.75);
  color: white;
  padding: 7px 12px;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre;
  text-align: center;
  pointer-events: none;
  z-index: 200;
}

.tooltip::after {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-bottom-color: rgba(0, 0, 0, 0.75);
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
  transition: background 0.15s, border-color 0.15s, color 0.15s;
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
