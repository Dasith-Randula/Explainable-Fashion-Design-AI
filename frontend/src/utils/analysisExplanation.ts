const FEATURE_LABEL_OVERRIDES: Record<string, string> = {
  num__restock_past_1: 'Previous restocking activity',
  num__calendar_week: 'Calendar timing',
  num__demand_lag_1: 'Recent demand',
  num__demand_lag_3: 'Older demand history',
  num__demand_rolling_mean_3: 'Recent average demand',
  cat__fabric_acrylic: 'Acrylic fabric',
  'cat__category_long sleeve': 'Long-sleeve category',
  cat__season_from_time_summer: 'Summer season',
  cat__color_black: 'Black colour',
}

const capitalizeWords = (value: string): string =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      if (word.toUpperCase() === word) {
        return word
      }

      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')

export const formatReadableFeatureName = (featureName: string): string => {
  const normalized = featureName?.trim()

  if (!normalized) {
    return 'Unknown feature'
  }

  if (FEATURE_LABEL_OVERRIDES[normalized]) {
    return FEATURE_LABEL_OVERRIDES[normalized]
  }

  const withoutPrefix = normalized.replace(/^(num|cat)__/i, '')
  const readable = withoutPrefix
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return readable ? capitalizeWords(readable) : 'Unknown feature'
}
