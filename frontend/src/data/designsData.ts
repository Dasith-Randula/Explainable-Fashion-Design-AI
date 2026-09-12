import lavenderOutfitFlatlay from '../../assets/lavender-outfit-flatlay.jpg'
import purpleCoatModel from '../../assets/purple-coat-model.png'
import purpleOutfitProduct from '../../assets/purple-outfit-product.png'
import purpleSneakersModel from '../../assets/purple-sneakers-model.png'

export type DesignStatus = 'Saved' | 'Drafts' | 'Generated' | 'Favorites'
export type ViewMode = 'grid' | 'list'

export type DesignRecord = {
  id: number
  title: string
  description: string
  image: string
  status: DesignStatus
  category: string
  tags: string[]
  createdAt: string
  updatedAt: string
  featured: boolean
  favorite: boolean
}

export const initialDesigns: DesignRecord[] = [
  {
    id: 1,
    title: 'The violet edit',
    description: 'A modern take on classic tailoring. Clean lines, rich tones, endless possibilities.',
    image: purpleCoatModel,
    status: 'Saved',
    category: 'Evening Wear',
    tags: ['elegant', 'tailoring', 'violet'],
    createdAt: '2024-03-12',
    updatedAt: '2024-03-20',
    featured: true,
    favorite: false,
  },
  {
    id: 2,
    title: 'The purple perspective',
    description: 'A modern take on classic tailoring. Clean lines, rich tones, endless possibilities.',
    image: purpleOutfitProduct,
    status: 'Generated',
    category: 'Statement',
    tags: ['purple', 'editorial'],
    createdAt: '2024-03-18',
    updatedAt: '2024-03-18',
    featured: false,
    favorite: false,
  },
  {
    id: 3,
    title: 'Street minimal',
    description: 'A modern take on classic tailoring. Clean lines, rich tones, endless possibilities.',
    image: purpleSneakersModel,
    status: 'Drafts',
    category: 'Casual',
    tags: ['casual', 'minimal'],
    createdAt: '2024-03-18',
    updatedAt: '2024-03-18',
    featured: false,
    favorite: false,
  },
  {
    id: 4,
    title: 'City tones',
    description: 'A modern take on classic tailoring. Clean lines, rich tones, endless possibilities.',
    image: lavenderOutfitFlatlay,
    status: 'Favorites',
    category: 'Accessories',
    tags: ['lavender', 'flatlay'],
    createdAt: '2024-03-10',
    updatedAt: '2024-03-10',
    featured: false,
    favorite: true,
  },
]

export const tabs = ['Saved', 'Drafts', 'Generated', 'Favorites']

export const sortOptions = ['Recently updated', 'Newest', 'Oldest', 'Name A–Z']
