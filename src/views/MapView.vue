<script setup lang="ts">
import NaverMap from '@/components/map/NaverMap.vue'
</script>

<template>
  <div class="map-view">
    <NaverMap />
  </div>
</template>

<style scoped>
.map-view {
  width: 100%;
  height: 100%;
  position: relative;
}
</style>