declare namespace naver {
  namespace maps {
    class Map {
      constructor(element: string | HTMLElement, options?: MapOptions)
      getCenter(): LatLng
      setCenter(latLng: LatLng): void
      getZoom(): number
      setZoom(zoom: number): void
      getBounds(): LatLngBounds
    }
    class Marker {
      constructor(options: MarkerOptions)
      setMap(map: Map | null): void
      getElement(): HTMLElement | null
    }
    class LatLng {
      constructor(lat: number, lng: number)
      lat(): number
      lng(): number
    }
    class Point {
      constructor(x: number, y: number)
    }
    class Size {
      constructor(width: number, height: number)
    }
    interface LatLngBounds {
      getSW(): LatLng
      getNE(): LatLng
    }
    interface MapOptions {
      center?: LatLng
      zoom?: number
      mapTypeControl?: boolean
      scaleControl?: boolean
      logoControl?: boolean
      mapDataControl?: boolean
    }
    interface MarkerOptions {
      position: LatLng
      map?: Map
      icon?: { content: string; anchor: Point; size?: Size }
    }
    namespace Event {
      function addListener(
        target: object,
        type: string,
        listener: (...args: unknown[]) => void,
      ): void
    }
  }
}

interface MarkerClusteringOptions {
  map?: naver.maps.Map | null
  markers?: naver.maps.Marker[]
  disableClickZoom?: boolean
  minClusterSize?: number
  maxZoom?: number
  gridSize?: number
  icons?: Array<{ content: string; size: naver.maps.Size; anchor: naver.maps.Point }>
  indexGenerator?: number[]
  stylingFunction?: (clusterMarker: naver.maps.Marker, count: number) => void
}

interface MarkerClusterInfo {
  _clusterMarker: naver.maps.Marker
  _clusterMember: naver.maps.Marker[]
}

declare class MarkerClustering {
  constructor(options: MarkerClusteringOptions)
  setMap(map: naver.maps.Map | null): void
  _clusters: MarkerClusterInfo[]
}
