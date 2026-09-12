import { initialDesigns } from '../data/designsData'
import type { DesignRecord } from '../data/designsData'

const STORAGE_KEY = 'threadwise-my-designs'

export function loadDesigns(): DesignRecord[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)

    if (!saved) {
      return initialDesigns.map((design) => ({ ...design }))
    }

    const parsed = JSON.parse(saved)

    if (!Array.isArray(parsed) || parsed.length < initialDesigns.length) {
      return initialDesigns.map((design) => ({ ...design }))
    }

    return parsed as DesignRecord[]
  } catch {
    return initialDesigns.map((design) => ({ ...design }))
  }
}

export function saveDesigns(designs: DesignRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(designs))
  } catch {
    // Ignore storage errors in demo/offline environments.
  }
}
