import { BarChart3, ChartNoAxesCombined, Sparkles, TrendingUp } from 'lucide-react'
import type { SummaryCardData } from '../../data/forecastData'

type ForecastSummaryCardProps = {
  card: SummaryCardData
}

function ForecastSummaryCard({ card }: ForecastSummaryCardProps) {
  const iconMap = {
    trend: <TrendingUp size={18} />,
    chart: <BarChart3 size={18} />,
    garment: <ChartNoAxesCombined size={18} />,
    sparkle: <Sparkles size={18} />,
  }

  return (
    <article className="forecast-summary-card">
      <div className="forecast-summary-card__top">
        <h3>{card.title}</h3>
        {card.badge ? <button type="button" className="forecast-summary-card__badge">{card.badge}</button> : null}
      </div>

      {card.icon ? (
        <div className="forecast-summary-card__icon-wrap">{iconMap[card.icon]}</div>
      ) : null}

      {card.colourSwatches ? (
        <div className="forecast-summary-card__color-group">
          {card.colourSwatches.map((swatch) => (
            <span key={swatch} className="forecast-summary-card__swatch" style={{ background: swatch }} />
          ))}
          <button type="button" className="forecast-summary-card__badge forecast-summary-card__badge--small">↗</button>
        </div>
      ) : null}

      {card.value ? <div className="forecast-summary-card__value">{card.value}</div> : null}

      {card.detailText ? <div className="forecast-summary-card__detail-text">{card.detailText}</div> : null}
      {card.secondaryText ? <div className="forecast-summary-card__secondary-text">{card.secondaryText}</div> : null}

      {card.change ? <div className="forecast-summary-card__change">▲ {card.change}</div> : null}
      {card.caption ? <div className="forecast-summary-card__caption">{card.caption}</div> : null}
    </article>
  )
}

export default ForecastSummaryCard
