import { Copy, Download, MoreHorizontal, PencilLine, Trash2 } from 'lucide-react'
import type { DesignRecord } from '../../data/designsData'

type DesignCardProps = {
  design: DesignRecord
  onDuplicate: (id: number) => void
  onDownload: (design: DesignRecord) => void
  onDelete: (id: number) => void
}

function DesignCard({ design, onDuplicate, onDownload, onDelete }: DesignCardProps) {
  return (
    <article className="mydesigns-card">
      <div className="mydesigns-card__image-wrap">
        <img src={design.image} alt={design.title} />
        <button type="button" className="mydesigns-card__menu" aria-label={`More options for ${design.title}`}>
          <MoreHorizontal size={16} />
        </button>
      </div>

      <div className="mydesigns-card__content">
        <div className="mydesigns-card__status-row">
          <span className={`mydesigns-card__status mydesigns-card__status--${design.status.toLowerCase()}`}>
            {design.status.toUpperCase()}
          </span>
        </div>

        <h3>{design.title}</h3>
        <p>{new Date(design.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>

        <div className="mydesigns-card__actions">
          <button type="button" className="mydesigns-card__action">
            <PencilLine size={15} />
            Open
          </button>
          <button type="button" className="mydesigns-card__action" onClick={() => onDuplicate(design.id)}>
            <Copy size={15} />
            Duplicate
          </button>
          <button type="button" className="mydesigns-card__action" onClick={() => onDownload(design)}>
            <Download size={15} />
            Download
          </button>
          <button type="button" className="mydesigns-card__action mydesigns-card__action--danger" onClick={() => onDelete(design.id)}>
            <Trash2 size={15} />
            Delete
          </button>
        </div>
      </div>
    </article>
  )
}

export default DesignCard
