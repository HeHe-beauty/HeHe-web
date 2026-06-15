export function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): string {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`
}
