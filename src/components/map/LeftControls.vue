<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useMapStore } from '@/stores/mapStore'
import { postHeart } from '@/services/heartService'
import { trackEvent } from '@/utils/gtag'

defineEmits<{ openFaq: [] }>()

const store = useMapStore()
const { isPanelOpen, isPanelCollapsed } = storeToRefs(store)

const windowWidth = ref(window.innerWidth)
function onResize() { windowWidth.value = window.innerWidth }
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

const btnBottom = computed(() => {
  if (windowWidth.value <= 768) {
    return isPanelOpen.value && !isPanelCollapsed.value ? 'calc(40vh + 12px)' : '16px'
  }
  return '80px'
})

const showTooltip = ref(false)
const heartSent = ref(sessionStorage.getItem('heartSent') === '1')
const animating = ref(false)
const thankYouMsg = ref('')
let clearTimer: ReturnType<typeof setTimeout> | null = null

async function onHeartClick() {
  if (heartSent.value) return
  heartSent.value = true
  sessionStorage.setItem('heartSent', '1')
  showTooltip.value = false
  animating.value = false
  await nextTick()
  animating.value = true
  setTimeout(() => { animating.value = false }, 350)

  trackEvent('heart_click')
  try {
    const total = await postHeart()
    thankYouMsg.value = `응원 감사해요! 지금까지 ${total}번 응원받았어요`
  } catch {
    thankYouMsg.value = '응원해주셔서 감사해요!'
  }
  if (clearTimer) clearTimeout(clearTimer)
  clearTimer = setTimeout(() => { thankYouMsg.value = '' }, 3500)
}

onUnmounted(() => { if (clearTimer) clearTimeout(clearTimer) })
</script>

<template>
  <div class="left-controls" :style="{ bottom: btnBottom }">
    <div
      class="btn-wrapper"
      @mouseenter="showTooltip = true"
      @mouseleave="showTooltip = false"
    >
      <div v-if="thankYouMsg" class="tooltip thankyou">{{ thankYouMsg }}</div>
      <div v-else-if="showTooltip && !heartSent" class="tooltip">개발자에게 하트를 주세요!</div>
      <button
        class="ctrl-btn heart-btn"
        :class="{ animating, sent: heartSent }"
        @click="onHeartClick"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 21.593C6.37 16.054 1 11.297 1 7.191 1 3.4 4.068 2 6.281 2 7.593 2 10.432 3.018 12 6.955 13.559 3.018 16.398 2 17.719 2 20.106 2 23 3.4 23 7.191c0 4.106-5.37 8.863-11 14.402z"
            :fill="heartSent ? '#e8445a' : 'none'"
            :stroke="heartSent ? '#e8445a' : '#4061fa'"
            stroke-width="1.5"
          />
        </svg>
      </button>
    </div>

    <button class="ctrl-btn" @click="$emit('openFaq')">?</button>
  </div>
</template>

<style scoped>
.left-controls {
  position: absolute;
  left: 16px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  z-index: 110;
  transition: bottom 0.3s ease;
}

.btn-wrapper {
  position: relative;
}

.tooltip {
  position: absolute;
  left: calc(100% + 8px);
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.72);
  color: white;
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
  pointer-events: none;
}

.tooltip.thankyou {
  background: rgba(232, 68, 90, 0.88);
  animation: fadeIn 0.2s ease;
}

.tooltip.thankyou::before {
  border-right-color: rgba(232, 68, 90, 0.88);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-50%) translateX(-4px); }
  to   { opacity: 1; transform: translateY(-50%) translateX(0); }
}

.tooltip::before {
  content: '';
  position: absolute;
  right: 100%;
  top: 50%;
  transform: translateY(-50%);
  border: 5px solid transparent;
  border-right-color: rgba(0, 0, 0, 0.72);
}

.ctrl-btn {
  width: 40px;
  height: 40px;
  background: white;
  border: none;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  font-size: 18px;
  font-weight: 700;
  color: #4061fa;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.ctrl-btn:hover {
  background: #f5f5f5;
}

.heart-btn.sent {
  cursor: default;
}

.heart-btn.animating {
  animation: heartPop 0.35s ease;
}

@keyframes heartPop {
  0%   { transform: scale(1); }
  40%  { transform: scale(1.45); }
  100% { transform: scale(1); }
}
</style>
