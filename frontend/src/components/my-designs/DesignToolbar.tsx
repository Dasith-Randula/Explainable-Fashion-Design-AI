import { Grid2x2, List } from 'lucide-react'

type DesignToolbarProps = {
  sortBy: string
  onSortChange: (value: string) => void
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
}

function DesignToolbar({ sortBy, onSortChange, viewMode, onViewModeChange }: DesignToolbarProps) {
  return (
    <div className="mydesigns-toolbar">
      <div className="mydesigns-toolbar__controls">
        <label className="mydesigns-toolbar__sort">
          <span>Sort by:</span>
          <select value={sortBy} onChange={(event) => onSortChange(event.target.value)}>
            <option value="Recently updated">Recently updated</option>
            <option value="Newest">Newest</option>
            <option value="Oldest">Oldest</option>
            <option value="Name A–Z">Name A–Z</option>
          </select>
        </label>

        <div className="mydesigns-toolbar__view-toggle">
          <button
            type="button"
            className={viewMode === 'grid' ? 'is-active' : ''}
            onClick={() => onViewModeChange('grid')}
            aria-label="Grid view"
          >
            <Grid2x2 size={16} />
          </button>
          <button
            type="button"
            className={viewMode === 'list' ? 'is-active' : ''}
            onClick={() => onViewModeChange('list')}
            aria-label="List view"
          >
            <List size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default DesignToolbar
