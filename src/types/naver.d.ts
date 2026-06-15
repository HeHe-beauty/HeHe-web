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
    }
    class LatLng {
      constructor(lat: number, lng: number)
      lat(): number
      lng(): number
    }
    class Point {
      constructor(x: number, y: number)
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
      icon?: { content: string; anchor: Point }
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
