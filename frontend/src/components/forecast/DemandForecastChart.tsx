import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { monthlyDemandData } from '../../data/forecastData'

type DemandForecastChartProps = {
  data: typeof monthlyDemandData
}

function DemandForecastChart({ data }: DemandForecastChartProps) {
  return (
    <div className="forecast-chart-card forecast-chart-card--wide">
      <div className="forecast-chart-card__header">
        <h3>Demand Forecast (Next 12 Months)</h3>
        <div className="forecast-chart-legend">
          <span><i className="legend-dot legend-dot--purple" /> Total Demand</span>
          <span><i className="legend-dot legend-dot--lavender" /> Confidence Range</span>
        </div>
      </div>

      <div className="forecast-chart-card__body chart-body--large">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 20, right: 24, left: 0, bottom: 6 }}>
            <defs>
              <linearGradient id="demandFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#cfa3f0" stopOpacity={0.38} />
                <stop offset="100%" stopColor="#cfa3f0" stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(127, 95, 166, 0.18)" strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6d5d7a', fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6d5d7a', fontSize: 12 }} domain={[0, 80]} />
            <Tooltip
              contentStyle={{
                background: 'rgba(255,255,255,0.96)',
                border: '1px solid #e7d9f0',
                borderRadius: '14px',
                boxShadow: '0 10px 22px rgba(109, 93, 122, 0.08)',
              }}
            />
            <Area type="monotone" dataKey="confidence" stroke="transparent" fill="url(#demandFill)" />
            <Line type="monotone" dataKey="demand" stroke="#7a4fb1" strokeWidth={3} dot={{ fill: '#7a4fb1', r: 4 }} activeDot={{ r: 6 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="forecast-highlight">
        <div className="forecast-highlight__label">Dec</div>
        <div className="forecast-highlight__value">74</div>
        <div className="forecast-highlight__delta">+64%</div>
      </div>
    </div>
  )
}

export default DemandForecastChart
