import { ArrowUpRight } from 'lucide-react'
import purpleOutfitMen from '../../../assets/purple-outfit-men.jpg'
import purpleOutfitProduct from '../../../assets/purple-outfit-product.png'
import purpleSneakersDetail from '../../../assets/purple-sneakers-detail.png'

const collections = [
  {
    title: 'Purple Perspective',
    subtitle: 'Bold tones, new angles',
    image: purpleOutfitProduct,
  },
  {
    title: 'Street Elevated',
    subtitle: 'Everyday, reimagined',
    image: purpleSneakersDetail,
  },
  {
    title: 'Future Classics',
    subtitle: 'Timeless, with a twist',
    image: purpleOutfitMen,
  },
]

function TrendingCollections() {
  return (
    <aside className="explore-trending-card">
      <div className="explore-trending-card__header">
        <h2>Trending collections</h2>
        <button type="button" className="explore-trending-card__link">
          View all <ArrowUpRight size={16} />
        </button>
      </div>

      <div className="explore-trending-card__items">
        {collections.map((collection) => (
          <div key={collection.title} className="explore-trending-card__item">
            <img src={collection.image} alt={collection.title} />
            <div className="explore-trending-card__overlay">
              <span>{collection.title}</span>
              <small>{collection.subtitle}</small>
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}

export default TrendingCollections
