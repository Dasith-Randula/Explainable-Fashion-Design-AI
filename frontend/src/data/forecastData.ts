import purpleOutfitFlatlay from '../../assets/purple-outfit-flatlay.png'
import purpleOutfitProduct from '../../assets/purple-outfit-product.png'
import purpleSneakersDetail from '../../assets/purple-sneakers-detail.png'
import purpleSneakersModel from '../../assets/purple-sneakers-model.png'

export type SummaryCardData = {
  id: string
  title: string
  value?: string
  change?: string
  caption?: string
  badge?: string
  icon?: 'trend' | 'chart' | 'garment' | 'sparkle'
  colourSwatches?: string[]
  detailText?: string
  secondaryText?: string
}

export const summaryCards: SummaryCardData[] = [
  {
    id: 'trend-score',
    title: 'Trend Score',
    value: '92 / 100',
    change: '+18%',
    caption: 'Higher than last month',
    icon: 'trend',
  },
  {
    id: 'demand-prediction',
    title: 'Demand Prediction',
    value: '+64%',
    change: '+22%',
    caption: 'Expected demand — demo outlook',
    icon: 'chart',
  },
  {
    id: 'popular-colors',
    title: 'Popular Colors',
    colourSwatches: ['#3f1a5d', '#7d55ab', '#c3a6df', '#d9d4e3'],
    detailText: 'Purple tones dominate',
    secondaryText: '42% of sample demand',
    badge: '↗',
  },
  {
    id: 'top-categories',
    title: 'Top Categories',
    value: 'Outerwear',
    change: '+71%',
    caption: 'Highest projected growth',
    icon: 'garment',
    badge: '↗',
  },
]

export const monthlyDemandData = [
  { month: 'Jan', demand: 8, confidence: 12 },
  { month: 'Feb', demand: 15, confidence: 17 },
  { month: 'Mar', demand: 22, confidence: 24 },
  { month: 'Apr', demand: 26, confidence: 30 },
  { month: 'May', demand: 31, confidence: 37 },
  { month: 'Jun', demand: 39, confidence: 45 },
  { month: 'Jul', demand: 46, confidence: 53 },
  { month: 'Aug', demand: 50, confidence: 58 },
  { month: 'Sep', demand: 56, confidence: 63 },
  { month: 'Oct', demand: 62, confidence: 68 },
  { month: 'Nov', demand: 67, confidence: 72 },
  { month: 'Dec', demand: 74, confidence: 78 },
]

export const categoryTrendData = [
  { category: 'Outerwear', predicted: 92, current: 54, growth: 71 },
  { category: 'Dresses', predicted: 84, current: 60, growth: 48 },
  { category: 'Tops', predicted: 70, current: 50, growth: 32 },
  { category: 'Bottoms', predicted: 63, current: 46, growth: 28 },
  { category: 'Activewear', predicted: 74, current: 52, growth: 41 },
  { category: 'Accessories', predicted: 58, current: 42, growth: 19 },
]

export const popularityCards = [
  {
    id: 1,
    title: 'Purple Utility Look',
    value: '96%',
    label: 'High demand',
    season: 'Fall 2024',
    image: purpleOutfitProduct,
  },
  {
    id: 2,
    title: 'Violet Collection',
    value: '88%',
    label: 'Strong demand',
    season: 'Fall 2024',
    image: purpleOutfitFlatlay,
  },
  {
    id: 3,
    title: 'Wide Leg Style',
    value: '81%',
    label: 'Growing',
    season: 'Spring 2025',
    image: purpleSneakersModel,
  },
  {
    id: 4,
    title: 'Chunky Sneakers',
    value: '76%',
    label: 'Growing',
    season: 'Spring 2025',
    image: purpleSneakersDetail,
  },
]

export const insights = [
  'Purple outerwear shows stronger demand in the current sample outlook.',
  'Monochrome purple looks show higher preference in the demo comparison.',
  'Utility and oversized silhouettes remain strong in the sample forecast.',
]
