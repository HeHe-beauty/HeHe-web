import axios from 'axios'

const BASE = import.meta.env.VITE_API_BASE_URL

export type LegalDocType = 'PRIVACY_POLICY' | 'TERMS_OF_SERVICE' | 'ACCOUNT_DELETION_GUIDE'

export interface LegalDocument {
  type: LegalDocType
  version: string
  content: string
  createdAt: string
}

export async function getLegalDocument(type: LegalDocType): Promise<LegalDocument> {
  const { data } = await axios.get<{ success: boolean; data: LegalDocument }>(
    `${BASE}/api/v1/legal-documents/${type.toLowerCase()}`,
  )
  return data.data
}
