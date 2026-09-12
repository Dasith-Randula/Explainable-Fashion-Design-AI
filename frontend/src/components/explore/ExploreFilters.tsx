import { ArrowUpRight, ChevronDown, Search } from 'lucide-react'

export type ExploreFilterValues = {
  search: string
  category: string
  color: string
  style: string
  occasion: string
  season: string
}

type FilterKey = keyof Omit<ExploreFilterValues, 'search'>

type ExploreFiltersProps = {
  filters: ExploreFilterValues
  onSearchChange: (value: string) => void
  onFilterChange: (field: FilterKey, value: string) => void
}

function ExploreFilters({ filters, onSearchChange, onFilterChange }: ExploreFiltersProps) {
  const filterFields: Array<{ key: FilterKey; label: string; options: string[] }> = [
    { key: 'category', label: 'Category', options: ['All', 'Tailoring', 'Layering', 'Casual', 'Footwear', 'Collection'] },
    { key: 'color', label: 'Color', options: ['All', 'Purple', 'Neutral'] },
    { key: 'style', label: 'Style', options: ['All', 'Minimalist', 'Streetwear', 'Athleisure', 'Monochrome', 'Layering'] },
    { key: 'occasion', label: 'Occasion', options: ['All', 'Evening', 'Day', 'Weekend', 'Everyday'] },
    { key: 'season', label: 'Season', options: ['All', 'Autumn', 'Spring', 'Summer', 'All season'] },
  ]

  return (
    <div className="explore-filters">
      <div className="explore-filters__search">
        <Search size={18} />
        <input
          type="text"
          value={filters.search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search for outfits, styles, colors or keywords..."
          aria-label="Search for outfits or styles"
        />
      </div>

      <div className="explore-filters__controls">
        {filterFields.map((field) => (
          <label key={field.key} className="explore-select">
            <span>{field.label}</span>
            <select
              value={filters[field.key]}
              onChange={(event) => onFilterChange(field.key, event.target.value)}
              aria-label={field.label}
            >
              {field.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <ChevronDown size={16} />
          </label>
        ))}
      </div>

      <button type="button" className="explore-filters__button">
        Search <ArrowUpRight size={16} />
      </button>
    </div>
  )
}

export default ExploreFilters
