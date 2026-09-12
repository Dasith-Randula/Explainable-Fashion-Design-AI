import type { DesignStatus } from '../../data/designsData'

type DesignTabsProps = {
  activeTab: DesignStatus
  onTabChange: (tab: DesignStatus) => void
}

const tabs: DesignStatus[] = ['Saved', 'Drafts', 'Generated', 'Favorites']

function DesignTabs({ activeTab, onTabChange }: DesignTabsProps) {
  return (
    <div className="mydesigns-tabs" aria-label="Design categories">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          className={`mydesigns-tab ${activeTab === tab ? 'is-active' : ''}`}
          onClick={() => onTabChange(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}

export default DesignTabs
