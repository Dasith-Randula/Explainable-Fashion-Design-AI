import apiClient from './client'
import type { DemandPredictionResponse, DemandPredictionRequest } from './types'

export const predictDemand = async (features: DemandPredictionRequest['features']): Promise<DemandPredictionResponse> => {
  const { data } = await apiClient.post<DemandPredictionResponse>('/api/demand/predict', {
    features,
  })

  return data
}
