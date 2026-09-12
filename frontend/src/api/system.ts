import apiClient from './client'
import type { HealthResponse, ModelStatusResponse } from './types'

export const getHealth = async (): Promise<HealthResponse> => {
  const { data } = await apiClient.get<HealthResponse>('/api/health')
  return data
}

export const getModelStatus = async (): Promise<ModelStatusResponse> => {
  const { data } = await apiClient.get<ModelStatusResponse>('/api/models/status')
  return data
}

export const isDesignAnalysisReady = (status?: ModelStatusResponse | null): boolean => {
  if (!status?.components) {
    return false
  }

  return Boolean(status.components.visual_classifier?.available) && Boolean(status.components.clip_embeddings?.available)
}

export const isDemandModelReady = (status?: ModelStatusResponse | null): boolean => {
  return Boolean(status?.components?.demand?.available)
}
