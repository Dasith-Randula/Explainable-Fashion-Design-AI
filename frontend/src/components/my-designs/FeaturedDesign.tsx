import { MoreHorizontal } from 'lucide-react'
import type { DesignRecord } from '../../data/designsData'

type FeaturedDesignProps = {
  design: DesignRecord
}

function FeaturedDesign({ design }: FeaturedDesignProps) {
  return (
    <section className="mydesigns-featured">
      <div className="mydesigns-featured__label">FEATURED DESIGN</div>

      <div className="mydesigns-featured__content">
        <div className="mydesigns-featured__details">
          <h2>{design.title}</h2>
          <p>{design.description}</p>

          <div className="mydesigns-featured__actions">
            <button type="button" className="mydesigns-primary-button">
              Open design <span aria-hidden="true">↗</span>
            </button>
            <button type="button" className="mydesigns-icon-button" aria-label="More options">
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>

        <div className="mydesigns-featured__visual">
          <div className="mydesigns-featured__main-image">
            <img src={design.image} alt={design.title} />
          </div>

          <div className="mydesigns-featured__thumbs">
            <div className="mydesigns-featured__thumb mydesigns-featured__thumb--one">
              <img src={design.image} alt={`${design.title} detail 1`} />
            </div>
            <div className="mydesigns-featured__thumb mydesigns-featured__thumb--two">
              <img src={design.image} alt={`${design.title} detail 2`} />
            </div>
            <div className="mydesigns-featured__thumb mydesigns-featured__thumb--three">
              <img src={design.image} alt={`${design.title} detail 3`} />
            </div>
          </div>
        </div>

        <aside className="mydesigns-featured__meta">
          <div className="mydesigns-featured__badge">SAVED</div>

          <dl>
            <div>
              <dt>Created</dt>
              <dd>{new Date(design.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</dd>
            </div>
            <div>
              <dt>Last edited</dt>
              <dd>{new Date(design.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</dd>
            </div>
            <div>
              <dt>Category</dt>
              <dd>{design.category}</dd>
            </div>
            <div>
              <dt>Tags</dt>
              <dd className="mydesigns-featured__tags">
                {design.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
                <button type="button" className="mydesigns-featured__add-tag">+ Add tag</button>
              </dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
  )
}

export default FeaturedDesign
