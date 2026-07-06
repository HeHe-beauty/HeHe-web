<script setup lang="ts">
import { ref } from 'vue'

defineEmits<{ close: [] }>()

const openIndex = ref<number | null>(null)

function toggle(i: number) {
  openIndex.value = openIndex.value === i ? null : i
}

const faqs = [
  {
    q: 'HeHe 는 무엇인가요?',
    a: 'HEHE는 내 주변 레이저 제모 병원을 쉽게 찾고 예약할 수 있는 서비스입니다. 이 지도 페이지에서 병원을 탐색한 후, HEHE 앱으로 예약까지 이어갈 수 있습니다.',
  },
  {
    q: '어떤 병원 정보를 보여주나요?',
    a: '레이저 제모 시술을 제공하는 병원·의원 정보를 보여줍니다. 현재는 서울 지역을 중심으로 서비스 중이며, 순차적으로 전국으로 확대할 예정입니다.',
  },
  {
    q: '여기서 예약하거나 찜할 수 있나요?',
    a: '이 페이지는 병원 탐색 전용입니다. 예약·찜하기·문의 기능은 HEHE 앱에서 이용 가능합니다.',
  },
  {
    q: 'HEHE 앱에서는 어떤 기능을 쓸 수 있나요?',
    a: '앱에서는 병원 찜하기, 예약, 문의, 리뷰 확인 등 다양한 기능을 이용할 수 있습니다. 지도 페이지보다 훨씬 풍부한 정보와 서비스를 제공합니다.',
  },
  {
    q: '병원 정보가 정확하지 않아요.',
    a: '데이터 오류나 누락된 병원은 앱 내 문의 또는 고객센터를 통해 제보해 주시면 빠르게 반영하겠습니다.',
  },
]
</script>

<template>
  <div class="faq-overlay" @click.self="$emit('close')">
    <div class="faq-modal">
      <div class="faq-header">
        <h2 class="faq-title">자주 묻는 질문</h2>
        <button class="faq-close" @click="$emit('close')">✕</button>
      </div>

      <ul class="faq-list">
        <li
          v-for="(item, i) in faqs"
          :key="i"
          class="faq-item"
          :class="{ open: openIndex === i }"
        >
          <button class="faq-q" @click="toggle(i)">
            <span>{{ item.q }}</span>
            <span class="faq-arrow">{{ openIndex === i ? '▲' : '▼' }}</span>
          </button>
          <p v-if="openIndex === i" class="faq-a">{{ item.a }}</p>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.faq-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 200;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0;
}

.faq-modal {
  width: 100%;
  max-width: 480px;
  max-height: 80vh;
  background: white;
  border-radius: 20px 20px 0 0;
  padding: 20px 20px 32px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.faq-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.faq-title {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
}

.faq-close {
  background: #f5f5f5;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  font-size: 14px;
  cursor: pointer;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
}

.faq-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.faq-item {
  border-radius: 10px;
  overflow: hidden;
}

.faq-item.open {
  background: #f7f9ff;
}

.faq-q {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 12px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  text-align: left;
}

.faq-arrow {
  font-size: 10px;
  color: #4061fa;
  flex-shrink: 0;
}

.faq-a {
  padding: 0 12px 14px;
  font-size: 13px;
  color: #666;
  line-height: 1.6;
  margin: 0;
}

@media (min-width: 769px) {
  .faq-overlay {
    align-items: center;
  }

  .faq-modal {
    border-radius: 20px;
    max-height: 70vh;
  }
}
</style>
