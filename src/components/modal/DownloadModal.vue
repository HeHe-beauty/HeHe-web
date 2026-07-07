<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { trackEvent } from '@/utils/gtag'

const emit = defineEmits<{ close: [] }>()

onMounted(() => trackEvent('download_modal_open'))

const activeTooltip = ref<'app' | 'play' | null>(null)
let tooltipTimer: ReturnType<typeof setTimeout> | null = null

function onStoreBtnClick(e: Event, store: 'app' | 'play') {
  e.preventDefault()
  activeTooltip.value = store
  if (tooltipTimer) clearTimeout(tooltipTimer)
  tooltipTimer = setTimeout(() => { activeTooltip.value = null }, 2000)
  trackEvent('store_btn_click', { store })
}
</script>

<template>
  <Teleport to="body">
    <div class="modal-backdrop" @click.self="emit('close')">
      <div class="modal-box">
        <button class="close-btn" @click="emit('close')">✕</button>

        <p class="brand-logo">HeHe</p>
        <p class="brand-tagline">레이저 제모 병원찾기</p>

        <p class="modal-message">
          "지금 클릭한 레이저 제모 병원<br>예약까지 관리하고 싶다면?"
        </p>

        <div class="store-buttons">
          <div class="store-wrapper">
            <Transition name="tip">
              <div v-if="activeTooltip === 'app'" class="tooltip">Coming Soon 🚀</div>
            </Transition>
            <a href="#" class="store-btn" @click="onStoreBtnClick($event, 'app')">
              <img src="/images/app_store_btn.png" alt="App Store에서 다운로드" class="store-img" />
            </a>
          </div>
          <div class="store-wrapper">
            <Transition name="tip">
              <div v-if="activeTooltip === 'play'" class="tooltip">Coming Soon 🚀</div>
            </Transition>
            <a href="#" class="store-btn" @click="onStoreBtnClick($event, 'play')">
              <img src="/images/google_play_btn.png" alt="Google Play에서 다운로드" class="store-img" />
            </a>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(3px);
  background: rgba(0, 0, 0, 0.3);
}

.modal-box {
  position: relative;
  width: 400px;
  max-width: calc(100vw - 40px);
  background: white;
  border-radius: 24px;
  padding: 36px 28px 28px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.close-btn {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  border: none;
  border-radius: 50%;
  font-size: 13px;
  cursor: pointer;
  color: #888;
  transition: background 0.15s;
}

.close-btn:hover {
  background: #e0e0e0;
}

.brand-logo {
  font-size: 36px;
  font-weight: 800;
  color: #4061fa;
  letter-spacing: -1px;
  margin: 0 0 4px;
  line-height: 1;
}

.brand-tagline {
  font-size: 13px;
  font-weight: 500;
  color: #aaa;
  margin: 0 0 24px;
}

.modal-message {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1.5;
  margin: 0 0 28px;
  word-break: keep-all;
}

.store-buttons {
  display: flex;
  gap: 10px;
}

.store-wrapper {
  flex: 1;
  position: relative;
}

.tooltip {
  position: absolute;
  top: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%);
  background: #4061fa;
  color: white;
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  pointer-events: none;
  z-index: 1;
}

.tooltip::after {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-bottom-color: #4061fa;
}

.store-btn {
  display: block;
  border-radius: 10px;
  overflow: hidden;
  transition: opacity 0.15s, transform 0.15s;
}

.store-btn:hover {
  opacity: 0.85;
  transform: translateY(-2px);
}

.store-img {
  width: 100%;
  height: auto;
  display: block;
}

.tip-enter-active, .tip-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.tip-enter-from, .tip-leave-to { opacity: 0; transform: translateX(-50%) translateY(-4px); }
</style>
