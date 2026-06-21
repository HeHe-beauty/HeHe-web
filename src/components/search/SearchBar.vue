<script setup lang="ts">
import { ref } from 'vue'
import subwayData from '@/data/subway.json'

interface Station {
  name: string
  lat: number
  lng: number
  line: string
}

const emit = defineEmits<{ select: [station: Station] }>()

const query = ref('')
const isOpen = ref(false)
const results = ref<Station[]>([])

function onInput() {
  const q = query.value.trim()
  if (!q) {
    results.value = []
    isOpen.value = false
    return
  }

  const matched = (subwayData as Station[]).filter((s) => s.name.includes(q))

  // 같은 이름의 역을 하나로 합치고 노선명을 병합
  const coordMap = new Map<string, Station>()
  const lineMap = new Map<string, string[]>()
  for (const s of matched) {
    if (!coordMap.has(s.name)) {
      coordMap.set(s.name, s)
      lineMap.set(s.name, [s.line])
    } else {
      lineMap.get(s.name)!.push(s.line)
    }
  }

  results.value = [...coordMap.entries()]
    .map(([name, s]) => {
      const allLines = lineMap.get(name)!
      const line =
        allLines.length > 3
          ? `${allLines.slice(0, 3).join('·')} 외 ${allLines.length - 3}개`
          : allLines.join('·')
      return { ...s, line }
    })
    .slice(0, 10)

  isOpen.value = results.value.length > 0
}

function selectStation(station: Station) {
  query.value = station.name
  isOpen.value = false
  results.value = []
  emit('select', station)
}

function onFocus() {
  if (results.value.length > 0) isOpen.value = true
}

function onBlur() {
  setTimeout(() => {
    isOpen.value = false
  }, 150)
}

function clearQuery() {
  query.value = ''
  results.value = []
  isOpen.value = false
}
</script>

<template>
  <div class="search-bar">
    <div class="input-wrapper">
      <svg
        class="icon-search"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#aaa"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        v-model="query"
        type="text"
        placeholder="지하철역 검색"
        @input="onInput"
        @focus="onFocus"
        @blur="onBlur"
      />
      <button v-if="query" class="btn-clear" @mousedown.prevent="clearQuery">✕</button>
    </div>

    <ul v-if="isOpen && results.length" class="dropdown">
      <li
        v-for="station in results"
        :key="`${station.name}_${station.line}`"
        @mousedown.prevent="selectStation(station)"
      >
        <span class="station-name">{{ station.name }}</span>
        <span class="station-line">{{ station.line }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.search-bar {
  position: relative;
  width: 360px;
}

.input-wrapper {
  display: flex;
  align-items: center;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  padding: 0 12px;
  gap: 8px;
}

.icon-search {
  flex-shrink: 0;
}

input {
  flex: 1;
  padding: 11px 0;
  border: none;
  font-size: 14px;
  outline: none;
  background: transparent;
  color: #1a1a1a;
}

input::placeholder {
  color: #bbb;
}

.btn-clear {
  background: none;
  border: none;
  font-size: 13px;
  color: #bbb;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  flex-shrink: 0;
}

.btn-clear:hover {
  color: #888;
}

.dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.13);
  list-style: none;
  padding: 6px 0;
  margin: 0;
  z-index: 200;
  max-height: 300px;
  overflow-y: auto;
}

.dropdown li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  cursor: pointer;
  font-size: 14px;
  color: #1a1a1a;
  gap: 8px;
}

.dropdown li:hover {
  background: #f7f8ff;
}

.station-name {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.station-line {
  font-size: 11px;
  color: #aaa;
  white-space: nowrap;
  flex-shrink: 0;
}
</style>
