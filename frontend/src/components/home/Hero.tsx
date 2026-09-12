import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import HeroImageStack from './HeroImageStack'

function Hero() {
  return (
    <section className="home-hero">
      <div className="home-hero__content">
        <p className="hero-eyebrow">FASHION MEETS INTELLIGENCE</p>

        <h1 className="hero-title">
          <span className="hero-title__line hero-title__line--dark">IMAGINE THE LOOK.</span>
          <span className="hero-title__line hero-title__line--gradient">DESIGN WHAT’S NEXT.</span>
        </h1>

        <p className="hero-description">
          A creative space for fashion ideas, demand insights
          <br />
          and explanations that make sense.
        </p>

        <div className="hero-actions">
          <Link to="/design-studio" className="primary-button">
            Open Design Studio <ArrowUpRight size={18} />
          </Link>
          <Link to="/explore" className="secondary-button">
            Find inspiration
          </Link>
        </div>

        <div className="hero-stats" aria-label="Demo stats">
          <div className="hero-stat">
            <span className="hero-stat__value">10K+</span>
            <span className="hero-stat__label">Creators</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat__value">50K+</span>
            <span className="hero-stat__label">Designs generated</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat__value">90%</span>
            <span className="hero-stat__label">Find it inspiring</span>
          </div>
        </div>
      </div>

      <div className="home-hero__visual">
        <HeroImageStack />
      </div>
    </section>
  )
}

export default Hero
