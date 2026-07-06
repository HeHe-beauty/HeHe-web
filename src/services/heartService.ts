import axios from 'axios'

const BASE = import.meta.env.VITE_API_BASE_URL

export async function postHeart(): Promise<number> {
  const { data } = await axios.post<{ success: boolean; data: { total: number } }>(
    `${BASE}/api/v1/hearts`,
    null,
    { headers: { accept: 'application/json' } },
  )
  return data.data.total
}
