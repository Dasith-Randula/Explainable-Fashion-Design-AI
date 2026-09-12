import { ArrowUpRight, ListFilter, Rows3 } from 'lucide-react'
import { useMemo, useState } from 'react'
import SiteFooter from '../components/SiteFooter'
import SiteHeader from '../components/SiteHeader'
import ExploreCard from '../components/explore/ExploreCard'
import ExploreFilters, { type ExploreFilterValues } from '../components/explore/ExploreFilters'
import TrendingCollections from '../components/explore/TrendingCollections'
import TrendingTags from '../components/explore/TrendingTags'
import { exploreCards } from '../data/exploreData'
import '../styles/explore.css'

const defaultFilters: ExploreFilterValues = {
  search: '',
  category: 'All',
  color: 'All',
  style: 'All',
  occasion: 'All',
  season: 'All',
}

type SortOption = 'Most relevant' | 'Newest' | 'Popular'

type ViewMode = 'grid' | 'list'

function Explore() {
  const [cards, setCards] = useState(exploreCards)
  const [filters, setFilters] = useState<ExploreFilterValues>(defaultFilters)
  const [selectedTag, setSelectedTag] = useState('Purple')
  const [sortBy, setSortBy] = useState<SortOption>('Most relevant')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [email, setEmail] = useState('')
  const [subscriptionMessage, setSubscriptionMessage] = useState('')

  const filteredCards = useMemo(() => {
    const normalizedSearch = filters.search.trim().toLowerCase()

    return cards.filter((card) => {
      const searchText = `${card.title} ${card.description} ${card.tags.join(' ')}`.toLowerCase()
      const searchMatch = !normalizedSearch || searchText.includes(normalizedSearch)
      const categoryMatch = filters.category === 'All' || card.category === filters.category
      const colorMatch = filters.color === 'All' || card.color === filters.color
      const styleMatch = filters.style === 'All' || card.style === filters.style
      const occasionMatch = filters.occasion === 'All' || card.occasion === filters.occasion
      const seasonMatch = filters.season === 'All' || card.season === filters.season
      const tagMatch = !selectedTag || selectedTag === 'All' || card.tags.includes(selectedTag)

      return searchMatch && categoryMatch && colorMatch && styleMatch && occasionMatch && seasonMatch && tagMatch
    })
  }, [cards, filters, selectedTag])

  const sortedCards = useMemo(() => {
    const nextCards = [...filteredCards]

    if (sortBy === 'Newest') {
      return nextCards.reverse()
    }

    if (sortBy === 'Popular') {
      return nextCards.sort((a, b) => Number(b.favourite) - Number(a.favourite))
    }

    return nextCards.sort((a, b) => {
      if (a.favourite !== b.favourite) {
        return Number(b.favourite) - Number(a.favourite)
      }

      return a.title.localeCompare(b.title)
    })
  }, [filteredCards, sortBy])

  const handleSearchChange = (value: string) => {
    setFilters((previous) => ({ ...previous, search: value }))
  }

  const handleFilterChange = (field: keyof ExploreFilterValues, value: string) => {
    setFilters((previous) => ({ ...previous, [field]: value }))
  }

  const handleToggleFavourite = (id: number) => {
    setCards((previous) =>
      previous.map((card) =>
        card.id === id
          ? {
              ...card,
              favourite: !card.favourite,
            }
          : card,
      ),
    )
  }

  const handleClearFilters = () => {
    setFilters(defaultFilters)
    setSelectedTag('Purple')
    setSortBy('Most relevant')
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubscriptionMessage('Demo subscription saved locally.')
    setEmail('')
  }

  return (
    <div className="explore-page">
      <SiteHeader />

      <main className="page-shell explore-shell">
        <section className="explore-intro">
          <div className="explore-intro__content">
            <p className="hero-eyebrow">DISCOVER. EXPLORE. GET INSPIRED.</p>
            <h1 className="hero-title">
              <span className="hero-title__line hero-title__line--dark">Explore fashion ideas</span>
              <span className="hero-title__line hero-title__line--gradient">for what’s next.</span>
            </h1>
            <p className="hero-description">
              Browse curated looks, styles and creative concepts. Find inspiration, remix a look, or explore your next design direction.
            </p>
            <div className="explore-intro__decor" aria-hidden="true">
              Ideas
              <span>wear</span>
              <span>better</span>
              <span>here.</span>
            </div>
          </div>

          <div className="explore-intro__visual">
            <TrendingCollections />
          </div>
        </section>

        <ExploreFilters
          filters={filters}
          onSearchChange={handleSearchChange}
          onFilterChange={handleFilterChange}
        />

        <TrendingTags selectedTag={selectedTag} onSelect={setSelectedTag} />

        <section className="explore-results">
          <div className="explore-results__header">
            <div>
              <h2>Inspiration for you</h2>
              <p>Curated looks, AI concepts and creative favourites.</p>
            </div>

            <div className="explore-results__controls">
              <label className="explore-sort">
                <span>Most relevant</span>
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortOption)}>
                  <option value="Most relevant">Most relevant</option>
                  <option value="Newest">Newest</option>
                  <option value="Popular">Popular</option>
                </select>
              </label>

              <div className="explore-view-toggle" aria-label="Card display options">
                <button
                  type="button"
                  className={viewMode === 'grid' ? 'is-active' : ''}
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                >
                  <Rows3 size={18} />
                </button>
                <button
                  type="button"
                  className={viewMode === 'list' ? 'is-active' : ''}
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                >
                  <ListFilter size={18} />
                </button>
              </div>
            </div>
          </div>

          {sortedCards.length > 0 ? (
            <div className={`explore-grid ${viewMode === 'list' ? 'explore-grid--list' : ''}`}>
              {sortedCards.map((item) => (
                <ExploreCard key={item.id} item={item} onToggleFavourite={handleToggleFavourite} />
              ))}
            </div>
          ) : (
            <div className="explore-empty-state">
              <p>No matching inspiration found.</p>
              <button type="button" className="explore-empty-state__button" onClick={handleClearFilters}>
                Clear filters
              </button>
            </div>
          )}
        </section>

        <section className="stay-inspired">
          <div className="stay-inspired__content">
            <div>
              <h2>Stay inspired</h2>
              <p>Get new collections, trend insights and creative ideas.</p>
            </div>

            <form className="stay-inspired__form" onSubmit={handleSubmit}>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email"
                aria-label="Email address"
              />
              <button type="submit">
                Subscribe <ArrowUpRight size={16} />
              </button>
            </form>
          </div>

          {subscriptionMessage && <p className="stay-inspired__message">{subscriptionMessage}</p>}
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}

export default Explore
