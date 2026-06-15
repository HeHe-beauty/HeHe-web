import axios from 'axios'
import type { ClusterResponse, HospitalListItem } from '@/types/hospital'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

export const hospitalService = {
  getClusters(params: {
    swLat: number
    swLng: number
    neLat: number
    neLng: number
    zoomLevel: number
    equipId?: number
  }): Promise<ClusterResponse> {
    return axios.get(`${BASE_URL}/api/v1/hospitals/map`, { params }).then((r) => r.data.data)
  },

  getByCluster(params: {
    lat: number
    lng: number
    precision: number
    equipId?: number
  }): Promise<HospitalListItem[]> {
    return axios.get(`${BASE_URL}/api/v1/hospitals`, { params }).then((r) => r.data.data)
  },
}
