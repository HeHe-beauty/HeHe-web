<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { marked } from 'marked'
import { getLegalDocument, type LegalDocType } from '@/services/legalService'

const props = defineProps<{ docType: LegalDocType }>()

const TITLE: Record<LegalDocType, string> = {
  PRIVACY_POLICY: '개인정보처리방침',
  TERMS_OF_SERVICE: '서비스이용약관',
  ACCOUNT_DELETION_GUIDE: '계정삭제안내',
}

const content = ref('')
const title = ref(TITLE[props.docType])
const isLoading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    const doc = await getLegalDocument(props.docType)
    content.value = await marked(doc.content)
  } catch {
    error.value = '문서를 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="doc-page">
    <div class="doc-content">
      <h1>{{ title }}</h1>
      <p v-if="isLoading" class="status">불러오는 중...</p>
      <p v-else-if="error" class="status error">{{ error }}</p>
      <div v-else class="body" v-html="content" />
    </div>
  </div>
</template>

<style scoped>
.doc-page {
  min-height: 100vh;
  background: white;
  display: flex;
  justify-content: center;
  padding: 60px 24px;
}

.doc-content {
  width: 100%;
  max-width: 720px;
}

h1 {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 32px;
}

.status {
  font-size: 15px;
  color: #999;
}

.error {
  color: #e8445a;
}

.body {
  font-size: 14px;
  line-height: 1.8;
  color: #333;
}

.body :deep(h1),
.body :deep(h2),
.body :deep(h3) {
  font-weight: 700;
  margin: 24px 0 8px;
  color: #1a1a1a;
}

.body :deep(h1) { font-size: 20px; }
.body :deep(h2) { font-size: 17px; }
.body :deep(h3) { font-size: 15px; }

.body :deep(p) { margin: 8px 0; }

.body :deep(ul),
.body :deep(ol) {
  padding-left: 20px;
  margin: 8px 0;
}

.body :deep(li) { margin: 4px 0; }

.body :deep(a) { color: #4061fa; }

.body :deep(hr) {
  border: none;
  border-top: 1px solid #eee;
  margin: 24px 0;
}
</style>
