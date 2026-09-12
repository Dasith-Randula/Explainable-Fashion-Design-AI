import type { LucideIcon } from 'lucide-react'

interface FeatureCardProps {
  step: string
  title: string
  description: string
  icon: LucideIcon
}

function FeatureCard({ step, title, description, icon: Icon }: FeatureCardProps) {
  return (
    <article className="feature-card">
      <div className="feature-card__header">
        <div className="feature-card__step">{step}</div>
        <div className="feature-card__icon">
          <Icon size={18} strokeWidth={2} />
        </div>
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  )
}

export default FeatureCard
