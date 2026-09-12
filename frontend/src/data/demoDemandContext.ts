export type MarketContext = {
  id: string
  label: string
  season: string
  season_from_time: string
  category: string
  color: string
  fabric: string
  shop_label: number
  year: number
  month: number
  calendar_week: number
  day_of_week: number
  demand_lag_1: number
  demand_lag_3: number
  demand_rolling_mean_3: number
  demand_rolling_std_3: number
  restock_past_1: number
  price_past_1: number
  discount_past_1: number
}

// Each scenario is a complete row copied from data/interim/visuelle_demand_full.csv.
// Keeping the source rows here makes the demo deterministic while preserving the
// exact feature values expected by the trained demand pipeline.
export const marketContexts: MarketContext[] = [
  {
    id: 'ss17-long-sleeve-grey-shop-13', label: 'Winter / Long sleeve · Grey', season: 'SS17', season_from_time: 'winter', category: 'long sleeve', color: 'grey', fabric: 'acrylic', shop_label: 13, year: 2016, month: 12, calendar_week: 51, day_of_week: 0, demand_lag_1: 4, demand_lag_3: 1, demand_rolling_mean_3: 2.3333333333333335, demand_rolling_std_3: 1.5275252316519465, restock_past_1: 10, price_past_1: 0.0549442093112735, discount_past_1: 0,
  },
  {
    id: 'ss17-long-sleeve-violet-shop-41', label: 'Winter / Long sleeve · Violet', season: 'SS17', season_from_time: 'winter', category: 'long sleeve', color: 'violet', fabric: 'acrylic', shop_label: 41, year: 2016, month: 12, calendar_week: 51, day_of_week: 0, demand_lag_1: 1, demand_lag_3: 1, demand_rolling_mean_3: 1, demand_rolling_std_3: 0, restock_past_1: 2, price_past_1: 0.0549442093112735, discount_past_1: 0,
  },
  {
    id: 'ss17-printed-shirt-yellow-shop-4', label: 'Winter / Printed shirt · Yellow', season: 'SS17', season_from_time: 'winter', category: 'printed shirt', color: 'yellow', fabric: 'tulle', shop_label: 4, year: 2016, month: 12, calendar_week: 52, day_of_week: 0, demand_lag_1: 0, demand_lag_3: 2, demand_rolling_mean_3: 1.3333333333333333, demand_rolling_std_3: 1.1547005383792517, restock_past_1: 3, price_past_1: 0.0549442093112735, discount_past_1: 0,
  },
  {
    id: 'ss17-long-sleeve-brown-shop-3', label: 'Winter / Long sleeve · Brown', season: 'SS17', season_from_time: 'winter', category: 'long sleeve', color: 'brown', fabric: 'acrylic', shop_label: 3, year: 2016, month: 12, calendar_week: 52, day_of_week: 0, demand_lag_1: 9, demand_lag_3: 3, demand_rolling_mean_3: 6, demand_rolling_std_3: 3, restock_past_1: 16, price_past_1: 0.0549442093112735, discount_past_1: 0,
  },
  {
    id: 'ss17-printed-shirt-yellow-shop-26', label: 'Winter / Printed shirt · Yellow · Shop 26', season: 'SS17', season_from_time: 'winter', category: 'printed shirt', color: 'yellow', fabric: 'tulle', shop_label: 26, year: 2016, month: 12, calendar_week: 52, day_of_week: 0, demand_lag_1: 3, demand_lag_3: 1, demand_rolling_mean_3: 3, demand_rolling_std_3: 2, restock_past_1: 18, price_past_1: 0.0549442093112735, discount_past_1: 0,
  },
]

export const demoDemandContext = marketContexts[0]

export const getDemandFeatures = (context: MarketContext): Record<string, unknown> => {
  const { id: _id, label: _label, ...features } = context
  return features
}
