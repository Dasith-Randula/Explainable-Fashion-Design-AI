import purpleOutfitProduct from '../../../assets/purple-outfit-product.png'
import purpleSneakersModel from '../../../assets/purple-sneakers-model.png'

function HeroImageStack() {
  return (
    <div className="hero-visual" aria-label="Fashion hero visual composition">
      <div className="hero-decor hero-decor--top">Powered by AI for what’s next</div>
      <div className="hero-decor hero-decor--side">Ideas into Outfits</div>

      <figure className="hero-card hero-card--large">
        <img src={purpleOutfitProduct} alt="Purple outfit product" />
        <figcaption className="hero-card__caption">
          <span className="hero-card__eyebrow">THE PURPLE EDIT</span>
          <span className="hero-card__title">A FRESH PERSPECTIVE</span>
        </figcaption>
      </figure>

      <figure className="hero-card hero-card--small">
        <img src={purpleSneakersModel} alt="Purple sneakers model" />
        <figcaption className="hero-card__caption">
          <span className="hero-card__eyebrow">ANOTHER PERSPECTIVE</span>
          <span className="hero-card__title">SAME ENERGY, NEW IDEAS</span>
        </figcaption>
      </figure>

      <div className="hero-mini-links" aria-label="Explore related actions">
        <span>EXPLORE</span>
        <span>CREATE</span>
        <span>FORECAST</span>
        <span>REPEAT</span>
      </div>
    </div>
  )
}

export default HeroImageStack
