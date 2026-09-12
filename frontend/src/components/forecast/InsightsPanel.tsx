import { Sparkles } from 'lucide-react'
import type { insights } from '../../data/forecastData'

type InsightsPanelProps = {
  items: typeof insights
}

function InsightsPanel({ items }: InsightsPanelProps) {
  return (
    <aside className="forecast-insights-panel">
      <div className="forecast-insights-panel__header">
        <h3>
          <span className="forecast-insights-panel__sparkle">
            <Sparkles size={16} />
          </span>
          AI Insights
        </h3>
        <button type="button" className="forecast-insights-panel__link">
          See all →
        </button>
      </div>

      <div className="forecast-insights-panel__list">
        {items.map((item, index) => (
          <div key={item} className="forecast-insights-panel__item">
            <span className="forecast-insights-panel__index">{index + 1}.</span>
            <p>{item}</p>
          </div>
        ))}
      </div>
    </aside>
  )
}

export default InsightsPanel
