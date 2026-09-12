import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'

interface InspirationCardProps {
  badge: string
  title: string
  description: string
  image: string
}

function InspirationCard({ badge, title, description, image }: InspirationCardProps) {
  return (
    <article className="inspiration-card">
      <div className="inspiration-card__image-wrap">
        <img src={image} alt={title} />
      </div>

      <div className="inspiration-card__body">
        <span className="inspiration-card__badge">{badge}</span>
        <h3>{title}</h3>
        <p>{description}</p>

        <Link to="/explore" className="inspiration-card__button">
          View design <ArrowUpRight size={16} />
        </Link>
      </div>
    </article>
  )
}

export default InspirationCard
