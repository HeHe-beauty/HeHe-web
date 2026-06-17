export interface ClusterItem {
  lat: number
  lng: number
  count: number
}

export interface ClusterResponse {
  precision: number
  items: ClusterItem[]
}

export interface HospitalListItem {
  hospitalId: number
  name: string
  address: string
  lat?: number  // 백엔드 응답에 미포함 — 추가 예정
  lng?: number  // 백엔드 응답에 미포함 — 추가 예정
  tags: string[]
  bookmarkCount: number
  isBookmarked: boolean | null
}
