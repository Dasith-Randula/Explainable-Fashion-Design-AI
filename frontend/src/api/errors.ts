import axios from 'axios'

export const FRIENDLY_ERRORS = {
  network: 'Unable to connect to AI services. Make sure the backend is running.',
  timeout: 'The analysis took too long. Please try again.',
  invalidInput: 'Some input data is invalid. Please check the provided information.',
  invalidImage: 'Please upload a valid JPG, PNG or WEBP fashion image.',
  unavailable: 'This analysis service is currently unavailable.',
  unknown: 'Something went wrong while analyzing the design. Please try again.',
} as const

const coerceErrorMessage = (value: unknown): string => {
  if (typeof value === 'string' && value.trim()) {
    return value.trim()
  }

  if (value && typeof value === 'object') {
    if ('message' in value && typeof (value as { message?: unknown }).message === 'string') {
      return (value as { message: string }).message
    }

    if ('detail' in value && typeof (value as { detail?: unknown }).detail === 'string') {
      return (value as { detail: string }).detail
    }
  }

  return ''
}

export const getFriendlyApiError = (error: unknown, fallback: string = FRIENDLY_ERRORS.unknown): string => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const responseData = error.response?.data
    const detailText = coerceErrorMessage(responseData ?? error)
    const lowerDetail = detailText.toLowerCase()

    if (!error.response || error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('network error')) {
      return FRIENDLY_ERRORS.network
    }

    if (status === 408 || status === 504 || error.code === 'ECONNABORTED') {
      return FRIENDLY_ERRORS.timeout
    }

    if (status === 422) {
      if (lowerDetail.includes('image') || lowerDetail.includes('jpg') || lowerDetail.includes('png') || lowerDetail.includes('webp')) {
        return FRIENDLY_ERRORS.invalidImage
      }

      return FRIENDLY_ERRORS.invalidInput
    }

    if (status === 400 || status === 415) {
      if (lowerDetail.includes('image') || lowerDetail.includes('jpg') || lowerDetail.includes('png') || lowerDetail.includes('webp')) {
        return FRIENDLY_ERRORS.invalidImage
      }

      return FRIENDLY_ERRORS.invalidInput
    }

    if (status === 503 || status === 502 || status === 500 || status === 404) {
      if (lowerDetail.includes('unavailable') || lowerDetail.includes('not available')) {
        return FRIENDLY_ERRORS.unavailable
      }

      return FRIENDLY_ERRORS.unavailable
    }

    if (lowerDetail.includes('image') || lowerDetail.includes('jpg') || lowerDetail.includes('png') || lowerDetail.includes('webp')) {
      return FRIENDLY_ERRORS.invalidImage
    }

    if (lowerDetail.includes('unavailable') || lowerDetail.includes('not available')) {
      return FRIENDLY_ERRORS.unavailable
    }
  }

  const fallbackMessage = coerceErrorMessage(error)

  if (fallbackMessage && fallbackMessage.toLowerCase().includes('image')) {
    return FRIENDLY_ERRORS.invalidImage
  }

  return fallback
}
