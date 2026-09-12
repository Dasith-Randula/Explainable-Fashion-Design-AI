type TrendingTagsProps = {
  selectedTag: string
  onSelect: (tag: string) => void
}

const tags = ['Purple', 'Minimalist', 'Streetwear', 'Y2K', 'Tailoring', 'Monochrome', 'Athleisure', 'Sustainable', 'Layering', 'Co-ords', 'Denim', 'Textures']

function TrendingTags({ selectedTag, onSelect }: TrendingTagsProps) {
  return (
    <div className="explore-tags" aria-label="Trending tags">
      {tags.map((tag) => (
        <button
          key={tag}
          type="button"
          className={`explore-tag ${selectedTag === tag ? 'is-selected' : ''}`}
          onClick={() => onSelect(tag)}
        >
          {tag}
        </button>
      ))}
    </div>
  )
}

export default TrendingTags
