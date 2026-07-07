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
  lat: number
  lng: number
  tags: string[]
  bookmarkCount: number
  isBookmarked: boolean | null
}
