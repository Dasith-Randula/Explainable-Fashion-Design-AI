import { useEffect, useState } from 'react'
import { getHealth, getModelStatus, isDesignAnalysisReady } from '../../api/system'

function BackendStatus() {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'partial' | 'unavailable'>('connecting')

  useEffect(() => {
    let isMounted = true

    const checkServices = async () => {
      try {
        await getHealth()

        const modelStatus = await getModelStatus()

        if (!isMounted) {
          return
        }

        setStatus(isDesignAnalysisReady(modelStatus) ? 'connected' : 'partial')
      } catch {
        if (isMounted) {
          setStatus('unavailable')
        }
      }
    }

    void checkServices()

    return () => {
      isMounted = false
    }
  }, [])

  const label =
    status === 'connected'
      ? 'AI services connected'
      : status === 'partial'
        ? 'Visual analysis unavailable'
        : status === 'unavailable'
          ? 'AI services unavailable'
          : 'Connecting...'

  const toneClass =
    status === 'connected'
      ? 'backend-status backend-status--connected'
      : status === 'partial'
        ? 'backend-status backend-status--partial'
        : status === 'unavailable'
          ? 'backend-status backend-status--unavailable'
          : 'backend-status backend-status--connecting'

  return (
    <div className={toneClass} aria-live="polite">
      <span className="backend-status__dot" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

export default BackendStatus
