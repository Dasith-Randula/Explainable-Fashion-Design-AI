import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import type { categoryTrendData } from '../../data/forecastData'

type CategoryTrendsChartProps = {
  data: typeof categoryTrendData
}

function CategoryTrendsChart({ data }: CategoryTrendsChartProps) {
  return (
    <div className="forecast-chart-card">
      <div className="forecast-chart-card__header forecast-chart-card__header--tight">
        <h3>Category Trends</h3>
        <button type="button" className="forecast-chart-card__select">
          Next 6 months
        </button>
      </div>

      <div className="forecast-chart-card__body chart-body--compact">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 16, right: 8, left: 0, bottom: 0 }} barGap={8}>
            <CartesianGrid stroke="rgba(127, 95, 166, 0.18)" strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fill: '#6d5d7a', fontSize: 11 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6d5d7a', fontSize: 11 }} />
            <Bar dataKey="predicted" radius={[6, 6, 0, 0]} fill="#5e3a86" maxBarSize={22} fillOpacity={1}>
              {data.map((entry) => (
                <Cell key={`${entry.category}-predicted`} fill="#5e3a86" />
              ))}
            </Bar>
            <Bar dataKey="current" radius={[6, 6, 0, 0]} fill="#c7b0e2" maxBarSize={22} fillOpacity={1}>
              {data.map((entry) => (
                <Cell key={`${entry.category}-current`} fill="#c7b0e2" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="forecast-category-labels">
        {data.map((entry) => (
          <div key={entry.category} className="forecast-category-label">
            <span className="forecast-category-label__value">+{entry.growth}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CategoryTrendsChart
