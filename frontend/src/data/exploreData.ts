import purpleOutfitFlatlay from '../../assets/purple-outfit-flatlay.png'
import purpleOutfitMen from '../../assets/purple-outfit-men.jpg'
import purpleOutfitProduct from '../../assets/purple-outfit-product.png'
import purpleSneakersDetail from '../../assets/purple-sneakers-detail.png'
import purpleSneakersModel from '../../assets/purple-sneakers-model.png'

export type ExploreCardItem = {
  id: number
  title: string
  description: string
  type: 'Look' | 'Detail' | 'Collection'
  image: string
  category: string
  color: string
  style: string
  occasion: string
  season: string
  tags: string[]
  favourite: boolean
  actionLabel: string
}

export const exploreCards: ExploreCardItem[] = [
  {
    id: 1,
    title: 'Purple attitude',
    description: 'Bold styling with a confident editorial edge.',
    type: 'Look',
    image: purpleOutfitMen,
    category: 'Tailoring',
    color: 'Purple',
    style: 'Minimalist',
    occasion: 'Evening',
    season: 'Autumn',
    tags: ['Purple', 'Minimalist', 'Tailoring', 'Editorial'],
    favourite: false,
    actionLabel: 'View design',
  },
  {
    id: 2,
    title: 'The purple edit',
    description: 'Statement layers for a bolder tomorrow.',
    type: 'Look',
    image: purpleOutfitProduct,
    category: 'Layering',
    color: 'Purple',
    style: 'Streetwear',
    occasion: 'Day',
    season: 'Spring',
    tags: ['Purple', 'Streetwear', 'Layering', 'Statement'],
    favourite: true,
    actionLabel: 'Use as inspiration',
  },
  {
    id: 3,
    title: 'Another perspective',
    description: 'Casual, confident, effortless.',
    type: 'Look',
    image: purpleSneakersModel,
    category: 'Casual',
    color: 'Neutral',
    style: 'Athleisure',
    occasion: 'Weekend',
    season: 'Summer',
    tags: ['Purple', 'Athleisure', 'Casual', 'Effortless'],
    favourite: false,
    actionLabel: 'Use as inspiration',
  },
  {
    id: 4,
    title: 'Step forward',
    description: 'Iconic sneakers. Infinite outfits.',
    type: 'Detail',
    image: purpleSneakersDetail,
    category: 'Footwear',
    color: 'Purple',
    style: 'Monochrome',
    occasion: 'Everyday',
    season: 'All season',
    tags: ['Purple', 'Monochrome', 'Streetwear', 'Textures'],
    favourite: false,
    actionLabel: 'View design',
  },
  {
    id: 5,
    title: 'Styled your way',
    description: 'Mix, match and make it yours.',
    type: 'Collection',
    image: purpleOutfitFlatlay,
    category: 'Collection',
    color: 'Neutral',
    style: 'Layering',
    occasion: 'Everyday',
    season: 'All season',
    tags: ['Purple', 'Layering', 'Co-ords', 'Denim'],
    favourite: false,
    actionLabel: 'Explore collection',
  },
]
