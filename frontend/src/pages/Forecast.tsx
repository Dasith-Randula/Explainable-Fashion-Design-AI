import { ArrowUpRight } from 'lucide-react'
import { useMemo } from 'react'
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
            <p>Smarter fashion for a brighter tomorrow.</p>
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
