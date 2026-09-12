import type { popularityCards } from '../../data/forecastData'

type PopularityCardProps = {
  item: (typeof popularityCards)[number]
}

function PopularityCard({ item }: PopularityCardProps) {
  return (
    <article className="forecast-popularity-card">
      <div className="forecast-popularity-card__image">
        <img src={item.image} alt={item.title} />
      </div>
      <div className="forecast-popularity-card__body">
        <div className="forecast-popularity-card__title-row">
          <h4>{item.title}</h4>
        </div>
        <div className="forecast-popularity-card__value">{item.value}</div>
        <div className="forecast-popularity-card__label">{item.label}</div>
        <div className="forecast-popularity-card__season">{item.season}</div>
      </div>
    </article>
  )
}

export default PopularityCard
