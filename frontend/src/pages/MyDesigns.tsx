import { Plus, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SiteFooter from '../components/SiteFooter'
import SiteHeader from '../components/SiteHeader'
import DesignCard from '../components/my-designs/DesignCard'
import DesignTabs from '../components/my-designs/DesignTabs'
import DesignToolbar from '../components/my-designs/DesignToolbar'
import FeaturedDesign from '../components/my-designs/FeaturedDesign'
import type { DesignRecord, DesignStatus, ViewMode } from '../data/designsData'
import { sortOptions } from '../data/designsData'
import { loadDesigns, saveDesigns } from '../utils/designStorage'
import '../styles/my-designs.css'

const defaultStatus: DesignStatus = 'Saved'

function MyDesigns() {
  const [designs, setDesigns] = useState<DesignRecord[]>([])
  const [activeTab, setActiveTab] = useState<DesignStatus>(defaultStatus)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState(sortOptions[0])
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const navigate = useNavigate()

  useEffect(() => {
    setDesigns(loadDesigns())
  }, [])

  useEffect(() => {
    if (designs.length > 0) {
      saveDesigns(designs)
    }
  }, [designs])

  const filteredDesigns = useMemo(() => {
    const term = search.trim().toLowerCase()

    return designs
      .filter((design) => {
        if (!term) {
          return true
        }

        const searchSubject = [design.title, design.status, design.category, design.tags.join(' ')]
          .join(' ')
          .toLowerCase()

        return searchSubject.includes(term)
      })
      .sort((a, b) => {
        if (sortBy === 'Newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        }

        if (sortBy === 'Oldest') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        }

        if (sortBy === 'Name A–Z') {
          return a.title.localeCompare(b.title)
        }

        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      })
  }, [activeTab, designs, search, sortBy])

  const featuredDesign = useMemo(() => designs.find((design) => design.featured) ?? designs[0], [designs])

  const handleDuplicate = (id: number) => {
    setDesigns((previous) => {
      const item = previous.find((design) => design.id === id)

      if (!item) {
        return previous
      }

      const duplicate: DesignRecord = {
        ...item,
        id: Date.now(),
        title: `${item.title} copy`,
        status: 'Saved',
        featured: false,
        favorite: false,
        updatedAt: new Date().toISOString(),
      }

      return [duplicate, ...previous]
    })
  }

  const handleDownload = async (design: DesignRecord) => {
    const response = await fetch(design.image)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${design.title.toLowerCase().replace(/\s+/g, '-')}.png`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const handleDelete = (id: number) => {
    const confirmed = window.confirm('Delete this design?')

    if (!confirmed) {
      return
    }

    setDesigns((previous) => previous.filter((item) => item.id !== id))
  }

  const handleClearSearch = () => {
    setSearch('')
  }

  const renderEmptyState = () => (
    <div className="mydesigns-empty-state">
      <p>No designs found.</p>
      <button type="button" className="mydesigns-empty-state__button" onClick={handleClearSearch}>
        Clear search
      </button>
    </div>
  )

  return (
    <div className="mydesigns-page">
      <SiteHeader />

      <main className="page-shell mydesigns-shell">
        <section className="mydesigns-header">
          <div className="mydesigns-header__content">
            <p className="mydesigns-eyebrow">YOUR CREATIVE SPACE</p>
            <h1>My Designs</h1>
            <p>
              All your ideas, concepts and creations in one place. Continue building, explore new variations, or organise your favourites.
            </p>
          </div>

          <button type="button" className="mydesigns-primary-button" onClick={() => navigate('/design-studio')}>
            <Plus size={18} />
            New Design
          </button>
        </section>

        <div className="mydesigns-controls">
          <DesignTabs activeTab={activeTab} onTabChange={setActiveTab} />

          <DesignToolbar
            sortBy={sortBy}
            onSortChange={setSortBy}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>

        {featuredDesign ? (
          <FeaturedDesign design={featuredDesign} />
        ) : null}

        <section className="mydesigns-grid-section">
          <div className="mydesigns-grid-section__header">
            <h2>
              All designs <span>{filteredDesigns.length} designs</span>
            </h2>

            <div className="mydesigns-toolbar__search">
              <Search size={16} />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search your designs..."
                aria-label="Search your designs"
              />
            </div>
          </div>

          {filteredDesigns.length > 0 ? (
            <div className={`mydesigns-grid ${viewMode === 'list' ? 'mydesigns-grid--list' : ''}`}>
              {filteredDesigns.map((design) => (
                <DesignCard
                  key={design.id}
                  design={design}
                  onDuplicate={handleDuplicate}
                  onDownload={handleDownload}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            renderEmptyState()
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}

export default MyDesigns
