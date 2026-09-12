import { ArrowUpRight, Heart, MoreHorizontal } from 'lucide-react'
import type { ExploreCardItem } from '../../data/exploreData'

type ExploreCardProps = {
  item: ExploreCardItem
  onToggleFavourite: (id: number) => void
}

function ExploreCard({ item, onToggleFavourite }: ExploreCardProps) {
  return (
    <article className="explore-card">
      <div className="explore-card__image-wrap">
        <img src={item.image} alt={item.title} />
        <button
          type="button"
          className={`explore-card__favourite ${item.favourite ? 'is-favourite' : ''}`}
          onClick={() => onToggleFavourite(item.id)}
          aria-label={item.favourite ? `Remove ${item.title} from favourites` : `Add ${item.title} to favourites`}
        >
          <Heart size={16} fill={item.favourite ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="explore-card__content">
        <div className="explore-card__header">
          <span className="explore-card__type">{item.type}</span>
          <button type="button" className="explore-card__more" aria-label={`More actions for ${item.title}`}>
            <MoreHorizontal size={16} />
          </button>
        </div>

        <h3>{item.title}</h3>
        <p>{item.description}</p>

        <div className="explore-card__actions">
          <button type="button" className="explore-card__button">
            {item.actionLabel} <ArrowUpRight size={16} />
          </button>
          <button type="button" className="explore-card__more-inline" aria-label={`More actions for ${item.title}`}>
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>
    </article>
  )
}

export default ExploreCard
