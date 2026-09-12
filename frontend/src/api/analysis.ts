import apiClient from './client'
import type { AnalysisResponse } from './types'

export interface AnalyzeDesignRequest {
  image: File
  topK?: number
  demandFeatures?: Record<string, unknown>
}

export const analyzeDesign = async ({
  image,
  topK = 5,
  demandFeatures,
}: AnalyzeDesignRequest): Promise<AnalysisResponse> => {
  const formData = new FormData()

  formData.append('image', image)
  formData.append('top_k', String(topK))

  if (demandFeatures) {
    formData.append('demand_features', JSON.stringify(demandFeatures))
  }

  const { data } = await apiClient.post<AnalysisResponse>('/api/analysis/analyze', formData)

  return data
}
