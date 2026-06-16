import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ClusterItem, HospitalListItem } from '@/types/hospital'

export const useMapStore = defineStore('map', () => {
  const userLat = ref<number | null>(null)
  const userLng = ref<number | null>(null)
  const clusters = ref<ClusterItem[]>([])
  const precision = ref(2)
  const selectedCluster = ref<ClusterItem | null>(null)
  const hospitals = ref<HospitalListItem[]>([])
  const isPanelOpen = ref(false)
  const selectedEquipId = ref(1)

  return { userLat, userLng, clusters, precision, selectedCluster, hospitals, isPanelOpen, selectedEquipId }
})