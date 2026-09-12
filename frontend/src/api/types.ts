export interface HealthResponse {
  status: string
  service: string
  version: string
}

export interface ModelComponentStatus {
  available?: boolean
  artifact?: string
  reason?: string
  [key: string]: unknown
}

export interface ModelStatusResponse {
  status: string
  components: Record<string, ModelComponentStatus>
}

export interface VisualClassifierResponse {
  label?: string | null
  class_index?: number | null
  confidence?: number | null
}

export interface SimilarDesignItem {
  rank?: number
  similarity?: number
  metadata?: Record<string, unknown>
}

export interface VisualClipResponse {
  embedding_dimension?: number | null
  similar_items?: SimilarDesignItem[]
}

export interface AnalysisVisualResponse {
  available?: boolean
  classifier?: VisualClassifierResponse | null
  clip?: VisualClipResponse | null
  reason?: string | null
}

export interface AnalysisDemandResponse {
  available?: boolean
  prediction?: number | null
  model?: string | null
  reason?: string | null
}

export interface AnalysisPreferenceResponse {
  available?: boolean
  preference_score?: number | null
  model?: string | null
  reason?: string | null
}

export interface AnalysisExplainabilityResponse {
  available?: boolean
  prediction?: number | null
  base_value?: number | null
  reconstructed_prediction?: number | null
  reconstruction_difference?: number | null
  consistent?: boolean | null
  top_positive_factors?: Array<Record<string, unknown>>
  top_negative_factors?: Array<Record<string, unknown>>
  all_contributions?: Array<Record<string, unknown>>
  reason?: string | null
}

export interface AnalysisRefinementResponse {
  available?: boolean
  original_score?: number | null
  refined_score?: number | null
  score_difference?: number | null
  improved?: boolean | null
  changes?: Array<Record<string, unknown>>
  suggestions?: string[]
  refined_features?: Record<string, unknown>
  reason?: string | null
}

export interface AnalysisGenerationResponse {
  available?: boolean
  reason?: string | null
  artifact?: string | null
}

export interface AnalysisResponse {
  status: string
  visual: AnalysisVisualResponse
  demand: AnalysisDemandResponse
  preference: AnalysisPreferenceResponse
  explainability: AnalysisExplainabilityResponse
  refinement: AnalysisRefinementResponse
  generation: AnalysisGenerationResponse
}

export interface DemandPredictionRequest {
  features: Record<string, unknown>
}

export interface DemandPredictionResponse {
  status: string
  prediction: number
  model: string
  input_features: Record<string, unknown>
}
