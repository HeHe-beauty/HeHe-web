const geocodeCache = new Map<string, { lat: number; lng: number } | null>()

export function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  if (geocodeCache.has(address)) return Promise.resolve(geocodeCache.get(address)!)

  return new Promise((resolve) => {
    naver.maps.Service.geocode({ query: address }, (status, response) => {
      if (status !== naver.maps.Service.Status.OK) {
        geocodeCache.set(address, null)
        resolve(null)
        return
      }
      const addr = response.v2?.addresses?.[0]
      if (!addr) {
        geocodeCache.set(address, null)
        resolve(null)
        return
      }
      const coords = { lat: parseFloat(addr.y), lng: parseFloat(addr.x) }
      geocodeCache.set(address, coords)
      resolve(coords)
    })
  })
}
