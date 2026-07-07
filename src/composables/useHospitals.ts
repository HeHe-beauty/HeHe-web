import { ref } from 'vue'
import { hospitalService } from '@/services/hospitalService'
import type { HospitalListItem } from '@/types/hospital'

export function useHospitals() {
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchByCluster(
    lat: number,
    lng: number,
    precision: number,
    equipId?: number,
  ): Promise<HospitalListItem[]> {
    isLoading.value = true
    error.value = null
    try {
      return await hospitalService.getByCluster({ lat, lng, precision, equipId })
    } catch {
      error.value = '병원 목록 조회에 실패했습니다.'
      return []
    } finally {
      isLoading.value = false
    }
  }

  return { isLoading, error, fetchByCluster }
}
