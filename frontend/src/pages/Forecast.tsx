import { ArrowUpRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { getFriendlyApiError } from '../api/errors'
import { predictDemand } from '../api/demand'
import { getModelStatus, isDemandModelReady } from '../api/system'
import { demoDemandContext } from '../data/demoDemandContext'
import SiteFooter from '../components/SiteFooter'
import SiteHeader from '../components/SiteHeader'
import CategoryTrendsChart from '../components/forecast/CategoryTrendsChart'
import DemandForecastChart from '../components/forecast/DemandForecastChart'
import ForecastSummaryCard from '../components/forecast/ForecastSummaryCard'
import InsightsPanel from '../components/forecast/InsightsPanel'
import PopularityCard from '../components/forecast/PopularityCard'
import { categoryTrendData, insights, monthlyDemandData, popularityCards, summaryCards } from '../data/forecastData'
import '../styles/forecast.css'

function Forecast() {
  const summary = useMemo(() => summaryCards, [])
  const [realModelPrediction, setRealModelPrediction] = useState<number | null>(null)
  const [isRunningRealModel, setIsRunningRealModel] = useState(false)
  const [demandModelAvailable, setDemandModelAvailable] = useState(true)
  const [realModelError, setRealModelError] = useState('')

  useEffect(() => {
    let isMounted = true

    const checkDemandModelStatus = async () => {
      try {
        const status = await getModelStatus()

        if (isMounted) {
          setDemandModelAvailable(isDemandModelReady(status))
        }
      } catch {
        if (isMounted) {
          setDemandModelAvailable(false)
        }
      }
    }

    void checkDemandModelStatus()

    return () => {
      isMounted = false
    }
  }, [])

  const handleRunRealModel = async () => {
    if (!demandModelAvailable) {
      setRealModelError('Demand model is currently unavailable.')
      return
    }

    setIsRunningRealModel(true)
    setRealModelError('')

    try {
      const response = await predictDemand(demoDemandContext)
      setRealModelPrediction(response.prediction)
    } catch (error) {
      const message = getFriendlyApiError(error, 'The real demand model is currently unavailable.')

      setRealModelError(message)
      setRealModelPrediction(null)
    } finally {
      setIsRunningRealModel(false)
    }
  }

  return (
    <div className="forecast-page">
      <SiteHeader />

      <main className="page-shell forecast-shell">
        <section className="forecast-intro">
          <div className="forecast-intro__content">
            <p className="forecast-eyebrow">DATA MEETS STYLE</p>
            <div className="forecast-heading-row">
              <h1>Forecast what’s next.</h1>
              <span className="forecast-demo-badge">Demo forecast data</span>
            </div>
            <p className="forecast-subtitle">
              AI-powered fashion demand forecasting to help you design smarter, faster, and ahead of the curve.
            </p>
          </div>

          <aside className="forecast-live-card">
            <div className="forecast-live-card__icon">
              <span>✦</span>
            </div>
            <div className="forecast-live-card__content">
              <span className="forecast-real-badge">REAL MODEL DEMO</span>
              <p className="forecast-live-card__title">Smarter fashion for a brighter tomorrow.</p>
              <p className="forecast-live-card__helper">
                Run the trained XGBoost model using a verified sample demand context.
              </p>

              <div className="forecast-live-card__actions">
                <button
                  type="button"
                  className="forecast-real-button"
                  onClick={handleRunRealModel}
                  disabled={isRunningRealModel || !demandModelAvailable}
                >
                  {isRunningRealModel ? 'Running...' : 'Run sample prediction ↗'}
                </button>
              </div>

              {!demandModelAvailable ? (
                <p className="forecast-real-error">Demand model is currently unavailable.</p>
              ) : null}

              {realModelPrediction !== null ? (
                <div className="forecast-real-result">
                  <div className="forecast-real-result__row">
                    <span className="forecast-real-label">Model</span>
                    <strong>XGBoost</strong>
                  </div>
                  <div className="forecast-real-result__row">
                    <span className="forecast-real-label">Predicted demand</span>
                    <strong>{realModelPrediction}</strong>
                  </div>
                  <div className="forecast-real-result__row forecast-real-result__row--inline">
                    <span className="forecast-real-label">Badge</span>
                    <strong className="forecast-real-badge forecast-real-badge--result">Real model output</strong>
                  </div>
                </div>
              ) : null}

              {realModelError ? <p className="forecast-real-error">{realModelError}</p> : null}
            </div>
          </aside>
        </section>

        <section className="forecast-summary-grid">
          {summary.map((card) => (
            <ForecastSummaryCard key={card.id} card={card} />
          ))}
        </section>

        <section className="forecast-main-grid">
          <DemandForecastChart data={monthlyDemandData} />
          <CategoryTrendsChart data={categoryTrendData} />
        </section>

        <section className="forecast-lower-grid">
          <div className="forecast-popularity-panel">
            <div className="forecast-panel-header">
              <div>
                <h3>Predicted Popularity: Inspired by Your Designs</h3>
                <p>Sample analysis based on design attributes, demand signals and visual similarity.</p>
              </div>
              <button type="button" className="forecast-panel-link">
                View all predictions <ArrowUpRight size={16} />
              </button>
            </div>

            <div className="forecast-popularity-grid">
              {popularityCards.map((item) => (
                <PopularityCard key={item.id} item={item} />
              ))}
            </div>
          </div>

          <InsightsPanel items={insights} />
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}

export default Forecast
