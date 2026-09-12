import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SiteFooter from '../components/SiteFooter'
import SiteHeader from '../components/SiteHeader'
import type { AnalysisResponse } from '../api/types'
import { analyzeDesign } from '../api/analysis'
import { predictDemand } from '../api/demand'
import { demoDemandContext, getDemandFeatures, marketContexts, type MarketContext } from '../data/demoDemandContext'
import { formatReadableFeatureName } from '../utils/analysisExplanation'

const STORAGE_KEY = 'threadwise-insights-analysis'
const IMAGE_STORAGE_KEY = 'threadwise_analysis_image'

type SavedInsightsData = {
  analysisResult: AnalysisResponse
  uploadedImage: string
  uploadedFileName?: string | null
  formValues?: Record<string, string>
  selectedMarketContext?: MarketContext
}

type ComparisonRow = {
  context: MarketContext
  prediction: number | null
  error?: string
}

const normalizeValueForComparison = (value?: string | null) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')

const isUserFacingCategoricalFeature = (featureName: string, demoContext: typeof demoDemandContext) => {
  const cleanedFeature = featureName.replace(/^cat__/i, '').toLowerCase().replace(/\s+/g, '_')

  const allowedCategories = [
    `category_${normalizeValueForComparison(demoContext.category)}`,
    `season_from_time_${normalizeValueForComparison(demoContext.season_from_time)}`,
    `color_${normalizeValueForComparison(demoContext.color)}`,
    `fabric_${normalizeValueForComparison(demoContext.fabric)}`,
  ]

  return !cleanedFeature.startsWith('category_') &&
    !cleanedFeature.startsWith('season_from_time_') &&
    !cleanedFeature.startsWith('color_') &&
    !cleanedFeature.startsWith('fabric_')
    ? true
    : allowedCategories.includes(cleanedFeature)
}

const formatFilenameForDisplay = (value?: string | number | null) => {
  if (value === null || value === undefined || value === '') {
    return 'Visual match'
  }

  const normalized = String(value).trim()
  const cleanName = normalized.replace(/\.[^/.]+$/, '').replace(/^.*[\\/]/, '')

  if (/Tees|Tanks/i.test(cleanName)) {
    return 'Tops / Tees'
  }

  if (/Cardigans/i.test(cleanName)) {
    return 'Cardigans'
  }

  if (/Dresses/i.test(cleanName)) {
    return 'Dresses'
  }

  if (/Jackets|Coats/i.test(cleanName)) {
    return 'Jackets / Coats'
  }

  if (/Sweaters|Knitwear/i.test(cleanName)) {
    return 'Sweaters / Knitwear'
  }

  return cleanName.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim() || 'Visual match'
}

const getConfidenceBand = (confidence?: number | null) => {
  if (confidence === null || confidence === undefined) {
    return 'Uncertain'
  }

  if (confidence < 0.5) {
    return 'Uncertain'
  }

  if (confidence < 0.75) {
    return 'Moderate'
  }

  return 'Strong'
}

const getConfidencePercent = (confidence?: number | null) => {
  if (confidence === null || confidence === undefined) {
    return 0
  }

  return Math.max(0, Math.min(100, confidence * 100))
}

const getSelectedContextLabel = (marketContext: typeof demoDemandContext) => {
  const seasonLabel = marketContext.season_from_time
    ? `${marketContext.season_from_time.charAt(0).toUpperCase() + marketContext.season_from_time.slice(1)} / ${marketContext.season}`
    : marketContext.season

  return `${seasonLabel} ${marketContext.category ? marketContext.category.charAt(0).toUpperCase() + marketContext.category.slice(1) : ''}`.trim()
}

function Insights() {
  const navigate = useNavigate()
  const [savedData, setSavedData] = useState<SavedInsightsData | null>(null)
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false)
  const [selectedMarketContextId, setSelectedMarketContextId] = useState(demoDemandContext.id)
  const [isRerunningDemand, setIsRerunningDemand] = useState(false)
  const [marketContextError, setMarketContextError] = useState('')
  const [comparisonRows, setComparisonRows] = useState<ComparisonRow[]>([])

  useEffect(() => {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)

    if (!raw) {
      setSavedData(null)
      return
    }

    try {
      const parsed = JSON.parse(raw) as SavedInsightsData
      const persistedImage = window.sessionStorage.getItem(IMAGE_STORAGE_KEY)

      setSavedData({
        ...parsed,
        uploadedImage: persistedImage || parsed.uploadedImage || '',
      })
      setSelectedMarketContextId(parsed.selectedMarketContext?.id ?? demoDemandContext.id)
    } catch {
      setSavedData(null)
    }
  }, [])

  const analysisResult = savedData?.analysisResult ?? null
  const marketContext = savedData?.selectedMarketContext ?? demoDemandContext

  const dataUrlToFile = async (dataUrl: string) => {
    const response = await fetch(dataUrl)
    const blob = await response.blob()
    return new File([blob], savedData?.uploadedFileName || 'design-reference.png', { type: blob.type || 'image/png' })
  }

  const handleMarketContextChange = async (contextId: string) => {
    const nextContext = marketContexts.find((context) => context.id === contextId)
    if (!nextContext || !savedData?.uploadedImage) {
      return
    }

    setSelectedMarketContextId(contextId)
    setIsRerunningDemand(true)
    setMarketContextError('')

    try {
      const imageFile = await dataUrlToFile(savedData.uploadedImage)
      const response = await analyzeDesign({
        image: imageFile,
        topK: 5,
        demandFeatures: getDemandFeatures(nextContext),
      })
      const nextSavedData = { ...savedData, analysisResult: response, selectedMarketContext: nextContext }
      setSavedData(nextSavedData)
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextSavedData))
    } catch {
      setMarketContextError('The selected market context could not be analyzed. Please try again.')
    } finally {
      setIsRerunningDemand(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    const loadComparison = async () => {
      const rows = await Promise.all(marketContexts.map(async (context) => {
        try {
          const result = await predictDemand(getDemandFeatures(context))
          return { context, prediction: result.prediction }
        } catch {
          return { context, prediction: null, error: 'Unavailable' }
        }
      }))
      if (!cancelled) {
        setComparisonRows(rows)
      }
    }

    if (savedData) {
      void loadComparison()
    }
    return () => {
      cancelled = true
    }
  }, [savedData])

  const summary = useMemo(() => {
    if (!analysisResult) {
      return null
    }

    const positiveFactors = (analysisResult.explainability?.top_positive_factors ?? []).filter((factor) => {
      const feature = String((factor as { feature?: string }).feature ?? '')
      return isUserFacingCategoricalFeature(feature, marketContext) || !feature.toLowerCase().startsWith('cat__')
    })

    const negativeFactors = (analysisResult.explainability?.top_negative_factors ?? []).filter((factor) => {
      const feature = String((factor as { feature?: string }).feature ?? '')
      return isUserFacingCategoricalFeature(feature, marketContext) || !feature.toLowerCase().startsWith('cat__')
    })

    const positiveDisplayFactors = positiveFactors.slice(0, 4)
    const negativeDisplayFactors = negativeFactors.slice(0, 4)

    const confidence = analysisResult.visual?.classifier?.confidence ?? null
    const detectedAttribute = analysisResult.visual?.classifier?.label ?? 'Unavailable'

    return {
      confidence,
      confidenceBand: getConfidenceBand(confidence),
      detectedAttribute,
      detectedAttributeDisplay:
        confidence !== null && confidence !== undefined && confidence < 0.5 && detectedAttribute !== 'Unavailable'
          ? `${detectedAttribute}-like material`
          : detectedAttribute,
      positiveBullets: positiveDisplayFactors.map((factor) => {
        const feature = String((factor as { feature?: string }).feature ?? 'Unknown feature')
        return formatReadableFeatureName(feature)
      }),
      negativeBullets: negativeDisplayFactors.map((factor) => {
        const feature = String((factor as { feature?: string }).feature ?? 'Unknown feature')
        return formatReadableFeatureName(feature)
      }),
      positiveContributions: positiveDisplayFactors.map((factor) => {
        const feature = String((factor as { feature?: string }).feature ?? 'Unknown feature')
        const shapValue = Number((factor as { shap_value?: number }).shap_value ?? 0)
        return {
          label: formatReadableFeatureName(feature),
          shapValue,
        }
      }),
      negativeContributions: negativeDisplayFactors.map((factor) => {
        const feature = String((factor as { feature?: string }).feature ?? 'Unknown feature')
        const shapValue = Number((factor as { shap_value?: number }).shap_value ?? 0)
        return {
          label: formatReadableFeatureName(feature),
          shapValue,
        }
      }),
    }
  }, [analysisResult, marketContext])

  if (!savedData || !analysisResult) {
    return (
      <div style={styles.pageShell}>
        <SiteHeader />
        <main style={styles.noDataMain}>
          <div style={styles.noDataCard}>
            <h2 style={styles.noDataTitle}>No analysis available</h2>
            <button type="button" style={styles.primaryButton} onClick={() => navigate('/design-studio')}>
              Back to Design Studio
            </button>
          </div>
        </main>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div style={styles.pageShell}>
      <SiteHeader />

      <style>{`
        .insights-visual-body {
          display: grid;
          grid-template-columns: 150px minmax(180px, 1fr) 160px;
          gap: 12px;
          align-items: center;
        }

        .insights-visual-meta {
          display: grid;
          grid-template-columns: minmax(180px, 1fr) 160px;
          gap: 12px;
          align-items: stretch;
          grid-column: 2 / span 2;
        }

        .insights-visual-stat {
          min-width: 0;
          white-space: normal;
          word-break: normal;
          overflow-wrap: break-word;
        }

        .insights-visual-value {
          white-space: normal;
          word-break: normal;
          overflow-wrap: break-word;
        }

        @media (max-width: 980px) {
          .insights-visual-body {
            grid-template-columns: 150px minmax(0, 1fr);
          }

          .insights-visual-meta {
            grid-column: 1 / -1;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .insights-visual-body {
            grid-template-columns: 1fr;
          }

          .insights-visual-meta {
            grid-column: auto;
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <main style={styles.mainContent}>
        <div style={styles.headerRow}>
          <div>
            <h1 style={styles.pageTitle}>AI Design Insights</h1>
            <p style={styles.pageSubtitle}>Understand how your design may perform in the selected market context.</p>
          </div>

          <div style={styles.headerButtons}>
            <button type="button" style={styles.secondaryButton} onClick={() => navigate('/design-studio')}>
              Back to Design Studio
            </button>
            <button type="button" style={styles.primaryButton} onClick={() => navigate('/design-studio')}>
              Analyze Another Design
            </button>
          </div>
        </div>

        <div style={styles.pageGrid}>
          <aside style={styles.leftColumn}>
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.sectionPin}>✦</span>
                <h2 style={styles.cardTitle}>Your Design</h2>
              </div>

              <div style={styles.imageWrap}>
                {savedData.uploadedImage ? (
                  <img src={savedData.uploadedImage} alt="" style={styles.previewImage} />
                ) : (
                  <div style={styles.imagePlaceholder}>Design preview unavailable</div>
                )}
              </div>

              <div style={styles.formSummary}>
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>Silhouette</span>
                  <span style={styles.summaryValue}>{savedData.formValues?.category ?? '—'}</span>
                </div>
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>Sleeve Length</span>
                  <span style={styles.summaryValue}>{savedData.formValues?.sleeveLength ?? '—'}</span>
                </div>
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>Neckline</span>
                  <span style={styles.summaryValue}>{savedData.formValues?.neckline ?? '—'}</span>
                </div>
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>Color</span>
                  <span style={styles.summaryValue}>{savedData.formValues?.color ?? '—'}</span>
                </div>
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>Fabric</span>
                  <span style={styles.summaryValue}>{savedData.formValues?.fabric ?? '—'}</span>
                </div>
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>Mood</span>
                  <span style={styles.summaryValue}>{savedData.formValues?.style ?? '—'}</span>
                </div>
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>Occasion</span>
                  <span style={styles.summaryValue}>{savedData.formValues?.occasion ?? '—'}</span>
                </div>
              </div>
            </div>
          </aside>

          <section style={styles.rightColumn}>
            <div style={styles.contextCard}>
              <div style={styles.contextHeaderRow}>
                <div style={styles.contextTitleWrap}>
                  <span style={styles.contextIcon}>◉</span>
                  <h2 style={styles.contextTitle}>Selected Market Context</h2>
                </div>
                <span style={styles.demoBadge}>Verified market scenario</span>
              </div>

              <label style={styles.contextSelectorLabel} htmlFor="insights-market-context">Market context</label>
              <select
                id="insights-market-context"
                style={styles.contextSelector}
                value={selectedMarketContextId}
                disabled={isRerunningDemand}
                onChange={(event) => void handleMarketContextChange(event.target.value)}
              >
                {marketContexts.map((context) => (
                  <option key={context.id} value={context.id}>{context.label}</option>
                ))}
              </select>
              {isRerunningDemand ? <p style={styles.contextStatus}>Refreshing XGBoost, SHAP and refinement results…</p> : null}
              {marketContextError ? <p style={styles.contextError}>{marketContextError}</p> : null}

              <div style={styles.contextHeadline}>{getSelectedContextLabel(marketContext)}</div>

              <div style={styles.contextGrid}>
                <div style={styles.contextItem}>
                  <span style={styles.contextLabel}>Season</span>
                  <strong style={styles.contextValue}>
                    {marketContext.season_from_time
                      ? `${marketContext.season_from_time.charAt(0).toUpperCase() + marketContext.season_from_time.slice(1)} / ${marketContext.season}`
                      : marketContext.season}
                  </strong>
                </div>
                <div style={styles.contextItem}>
                  <span style={styles.contextLabel}>Category</span>
                  <strong style={styles.contextValue}>
                    {marketContext.category ? marketContext.category.charAt(0).toUpperCase() + marketContext.category.slice(1) : 'Not available'}
                  </strong>
                </div>
                <div style={styles.contextItem}>
                  <span style={styles.contextLabel}>Color</span>
                  <strong style={styles.contextValue}>
                    {marketContext.color ? marketContext.color.charAt(0).toUpperCase() + marketContext.color.slice(1) : 'Not available'}
                  </strong>
                </div>
                <div style={styles.contextItem}>
                  <span style={styles.contextLabel}>Fabric</span>
                  <strong style={styles.contextValue}>
                    {marketContext.fabric ? marketContext.fabric.charAt(0).toUpperCase() + marketContext.fabric.slice(1) : 'Not available'}
                  </strong>
                </div>
              </div>

              <div style={styles.dataSourceRow}>
                <span style={styles.contextLabel}>Data source</span>
                <strong style={styles.contextValue}>Visuelle processed dataset</strong>
              </div>
            </div>

            <div style={styles.comparisonCard}>
              <div style={styles.cardHeader}>
                <span style={styles.sectionPin}>▥</span>
                <h3 style={styles.cardTitle}>Verified market scenarios from the Visuelle dataset</h3>
              </div>
              <p style={styles.supportingText}>Real XGBoost predictions for the configured historical contexts.</p>
              <div style={styles.comparisonList}>
                {comparisonRows.map((row) => {
                  const maxPrediction = Math.max(...comparisonRows.map((item) => item.prediction ?? 0), 1)
                  const width = row.prediction === null ? 0 : Math.max(4, (row.prediction / maxPrediction) * 100)
                  return (
                    <div key={row.context.id} style={styles.scenarioRow}>
                      <div style={styles.scenarioRowTop}>
                        <span style={styles.scenarioLabel}>{row.context.label}</span>
                        <strong style={styles.scenarioValue}>{row.prediction === null ? 'Unavailable' : row.prediction.toFixed(3)}</strong>
                      </div>
                      <div style={styles.scenarioTrack}>
                        <span style={{ ...styles.scenarioFill, width: `${width}%`, opacity: row.context.id === marketContext.id ? 1 : 0.55 }} />
                      </div>
                    </div>
                  )
                })}
              </div>
              <p style={styles.contextNote}>Market scenarios use historical dataset context and are not inferred directly from the uploaded image.</p>
            </div>

            <div style={styles.firstRow}>
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <span style={styles.sectionPin}>◌</span>
                  <h3 style={styles.cardTitle}>Visual Understanding</h3>
                </div>

                <div className="insights-visual-body" style={styles.visualBody}>
                  <div style={styles.gaugeWrap}>
                    <div
                      style={{
                        ...styles.gaugeRing,
                        background: `conic-gradient(#8b5cf6 0 ${getConfidencePercent(summary?.confidence)}%, rgba(139, 92, 246, 0.12) ${getConfidencePercent(summary?.confidence)}% 100%)`,
                      }}
                    >
                      <div style={styles.gaugeInner}>
                        <span style={styles.gaugeValue}>{getConfidencePercent(summary?.confidence).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="insights-visual-meta" style={styles.visualMeta}>
                    <div className="insights-visual-stat" style={styles.visualStat}>
                      <span style={styles.visualLabel}>Detected attribute</span>
                      <strong className="insights-visual-value" style={styles.visualValue}>{summary?.detectedAttributeDisplay ?? 'Unavailable'}</strong>
                    </div>
                    <div className="insights-visual-stat" style={styles.visualStat}>
                      <span style={styles.visualLabel}>Confidence</span>
                      <strong className="insights-visual-value" style={styles.visualValue}>{summary?.confidenceBand ?? 'Uncertain'}</strong>
                    </div>
                  </div>
                </div>

                <p style={styles.supportingText}>
                  The model identified this as the closest learned visual attribute, but the uploaded design may contain features outside the training data.
                </p>
              </div>

              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <span style={styles.sectionPin}>◫</span>
                  <h3 style={styles.cardTitle}>Closest visual matches</h3>
                </div>

                <div style={styles.matchList}>
                  {(analysisResult.visual?.clip?.similar_items ?? []).slice(0, 4).map((item, index) => {
                    const similarity = typeof item.similarity === 'number' ? item.similarity * 100 : 0
                    const label = formatFilenameForDisplay(
                      typeof item.metadata?.filename !== 'undefined'
                        ? String(item.metadata.filename)
                        : typeof item.metadata?.image_id !== 'undefined'
                          ? String(item.metadata.image_id)
                          : typeof item.metadata?.id !== 'undefined'
                            ? String(item.metadata.id)
                            : `Visual match ${index + 1}`,
                    )

                    return (
                      <div key={`${item.rank ?? index}-match`} style={styles.matchRow}>
                        <div style={styles.matchMeta}>
                          <span style={styles.matchLabel}>{label}</span>
                        </div>
                        <div style={styles.matchBarTrack}>
                          <span
                            style={{
                              ...styles.matchBarFill,
                              width: `${Math.max(6, Math.min(100, similarity))}%`,
                            }}
                          />
                        </div>
                        <span style={styles.matchValue}>{similarity.toFixed(1)}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <span style={styles.sectionPin}>◔</span>
                  <h3 style={styles.cardTitle}>Market Demand Outlook</h3>
                </div>

                <div style={styles.marketOutlookBody}>
                  <div style={styles.marketOutlookTop}>
                    <span style={styles.marketOutlookLabel}>Predicted demand</span>
                    <span style={styles.marketOutlookBadge}>Real model output</span>
                  </div>

                  <div style={styles.marketOutlookValue}>{(analysisResult.demand?.prediction ?? 0).toFixed(3)}</div>

                  <div style={styles.marketOutlookModelRow}>
                    <span style={styles.contextLabel}>Model</span>
                    <strong style={styles.contextValue}>{analysisResult.demand?.model ?? 'XGBoost'}</strong>
                  </div>

                  <p style={styles.supportingText}>
                    The model evaluated this design using the selected verified market context.
                  </p>
                </div>
              </div>
            </div>

            <div style={styles.marketDemandRow}>
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <span style={styles.sectionPin}>◔</span>
                  <h3 style={styles.cardTitle}>Current Market Demand</h3>
                </div>

                <div style={styles.currentDemandBody}>
                  <div style={styles.currentDemandHeader}>
                    <span style={styles.currentDemandLabel}>Predicted demand</span>
                    <strong style={styles.currentDemandValue}>{(analysisResult.demand?.prediction ?? 0).toFixed(3)}</strong>
                  </div>

                  <div style={styles.currentDemandMeta}>
                    <div style={styles.currentDemandMetaItem}>
                      <span style={styles.contextLabel}>Model</span>
                      <strong style={styles.contextValue}>{analysisResult.demand?.model ?? 'XGBoost'}</strong>
                    </div>
                    <div style={styles.currentDemandMetaItem}>
                      <span style={styles.contextLabel}>Selected context</span>
                      <strong style={styles.contextValue}>{getSelectedContextLabel(marketContext)}</strong>
                    </div>
                  </div>

                  <div style={styles.currentDemandBarTrack}>
                    <span
                      style={{
                        ...styles.currentDemandBarFill,
                        width: `${Math.min(100, Math.max(25, ((analysisResult.demand?.prediction ?? 0) / 5) * 100))}%`,
                      }}
                    />
                  </div>

                  <p style={styles.currentDemandNote}>Illustrative context visualization</p>
                </div>
              </div>

              <div style={{ ...styles.card, ...styles.positiveTintCard }}>
                <div style={styles.cardHeader}>
                  <span style={styles.sectionPin}>✓</span>
                  <h3 style={styles.cardTitle}>What helps this design</h3>
                </div>

                <ul style={styles.list}>
                  {summary?.positiveBullets.length ? (
                    summary.positiveBullets.map((item, index) => <li key={`positive-${index}`} style={styles.listItem}>{item}</li>)
                  ) : (
                    <li style={styles.listItem}>No clear positive factors were returned for this prediction.</li>
                  )}
                </ul>
              </div>

              <div style={{ ...styles.card, ...styles.negativeTintCard }}>
                <div style={styles.cardHeader}>
                  <span style={styles.sectionPin}>−</span>
                  <h3 style={styles.cardTitle}>What may limit this design</h3>
                </div>

                <ul style={styles.list}>
                  {summary?.negativeBullets.length ? (
                    summary.negativeBullets.map((item, index) => <li key={`negative-${index}`} style={styles.listItem}>{item}</li>)
                  ) : (
                    <li style={styles.listItem}>No clear limiting factors were returned for this prediction.</li>
                  )}
                </ul>
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.sectionPin}>✧</span>
                <h3 style={styles.cardTitle}>Why this prediction?</h3>
              </div>

              <div style={styles.contributionGrid}>
                <div style={styles.contributionColumn}>
                  <p style={styles.contributionHeading}>Positive factors</p>
                  {summary?.positiveContributions.length ? (
                    <div style={styles.contributionList}>
                      {summary.positiveContributions.map((item, index) => {
                        const maxMagnitude = Math.max(
                          ...summary.positiveContributions.map((contribution) => Math.abs(contribution.shapValue)),
                          0.0001,
                        )
                        const width = Math.max(12, (Math.abs(item.shapValue) / maxMagnitude) * 100)

                        return (
                          <div key={`positive-${index}`} style={styles.contributionItem}>
                            <div style={styles.contributionLabelRow}>
                              <span style={styles.contributionLabel}>{item.label}</span>
                              <span style={styles.contributionValue}>{item.shapValue.toFixed(3)}</span>
                            </div>
                            <div style={styles.contributionTrack}>
                              <span
                                style={{
                                  ...styles.contributionBarPositive,
                                  width: `${width}%`,
                                }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p style={styles.emptyStateSmall}>No positive SHAP factors were returned for this prediction.</p>
                  )}
                </div>

                <div style={styles.contributionColumn}>
                  <p style={styles.contributionHeading}>Negative factors</p>
                  {summary?.negativeContributions.length ? (
                    <div style={styles.contributionList}>
                      {summary.negativeContributions.map((item, index) => {
                        const maxMagnitude = Math.max(
                          ...summary.negativeContributions.map((contribution) => Math.abs(contribution.shapValue)),
                          0.0001,
                        )
                        const width = Math.max(12, (Math.abs(item.shapValue) / maxMagnitude) * 100)

                        return (
                          <div key={`negative-${index}`} style={styles.contributionItem}>
                            <div style={styles.contributionLabelRow}>
                              <span style={styles.contributionLabel}>{item.label}</span>
                              <span style={styles.contributionValue}>{item.shapValue.toFixed(3)}</span>
                            </div>
                            <div style={styles.contributionTrack}>
                              <span
                                style={{
                                  ...styles.contributionBarNegative,
                                  width: `${width}%`,
                                }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p style={styles.emptyStateSmall}>No negative SHAP factors were returned for this prediction.</p>
                  )}
                </div>
              </div>
            </div>


            <div style={{ ...styles.card, ...styles.recommendationCard }}>
              <div style={styles.cardHeader}>
                <span style={styles.sectionPin}>✦</span>
                <h3 style={styles.cardTitle}>AI Recommendation</h3>
              </div>

              {analysisResult.refinement?.improved === true ? (
                <>
                  <p style={styles.recommendationTitle}>Recommended refinement</p>

                  {analysisResult.refinement?.changes && analysisResult.refinement.changes.length > 0 ? (
                    <div style={styles.changeListWrap}>
                      <ul style={styles.list}>
                        {analysisResult.refinement.changes.map((change, index) => (
                          <li key={`change-${index}`} style={styles.listItem}>
                            {String((change as { feature?: string }).feature ?? 'Attribute')}: {String((change as { from_value?: unknown }).from_value ?? '—')} → {String((change as { to_value?: unknown }).to_value ?? '—')}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  <p style={styles.recommendationTitle}>Keep the current configuration.</p>
                  <p style={styles.supportingText}>
                    The refinement process tested alternative design attributes, but none improved the model score for this market context.
                  </p>
                </>
              )}
            </div>

            <div style={styles.contextNoteCard}>
              <p style={styles.contextNote}>
                Demand and refinement insights use the selected verified Visuelle market scenario. They are not inferred directly from the uploaded image and should not be treated as universal fashion advice.
              </p>
            </div>

            <div style={styles.technicalCard}>
              <button
                type="button"
                style={styles.technicalToggle}
                onClick={() => setShowTechnicalDetails((previous) => !previous)}
              >
                <span>Technical details</span>
                <span>{showTechnicalDetails ? '▴' : '▾'}</span>
              </button>

              {showTechnicalDetails ? (
                <div style={styles.technicalContent}>
                  <div style={styles.technicalSection}>
                    <h4 style={styles.technicalHeading}>Visual model</h4>
                    <ul style={styles.technicalList}>
                      <li>Predicted label: {analysisResult.visual?.classifier?.label ?? 'Unavailable'}</li>
                      <li>Confidence: {analysisResult.visual?.classifier?.confidence ?? 'Unavailable'}</li>
                      <li>Class index: {analysisResult.visual?.classifier?.class_index ?? 'Unavailable'}</li>
                    </ul>
                  </div>

                  <div style={styles.technicalSection}>
                    <h4 style={styles.technicalHeading}>CLIP</h4>
                    <ul style={styles.technicalList}>
                      <li>Embedding dimension: {analysisResult.visual?.clip?.embedding_dimension ?? 'Unavailable'}</li>
                      <li>
                        Raw filenames:{' '}
                        {analysisResult.visual?.clip?.similar_items?.length
                          ? analysisResult.visual.clip.similar_items
                              .slice(0, 5)
                              .map((item) => {
                                const imageIdentifier =
                                  typeof item.metadata?.filename !== 'undefined'
                                    ? String(item.metadata.filename)
                                    : typeof item.metadata?.image_id !== 'undefined'
                                      ? String(item.metadata.image_id)
                                      : typeof item.metadata?.id !== 'undefined'
                                        ? String(item.metadata.id)
                                        : 'Unavailable'
                                return imageIdentifier
                              })
                              .join(', ')
                          : 'Unavailable'}
                      </li>
                      <li>
                        Similarity values:{' '}
                        {analysisResult.visual?.clip?.similar_items?.length
                          ? analysisResult.visual.clip.similar_items
                              .slice(0, 5)
                              .map((item) => (item.similarity !== undefined ? item.similarity.toFixed(3) : '—'))
                              .join(', ')
                          : 'Unavailable'}
                      </li>
                    </ul>
                  </div>

                  <div style={styles.technicalSection}>
                    <h4 style={styles.technicalHeading}>Demand</h4>
                    <ul style={styles.technicalList}>
                      <li>Exact XGBoost prediction: {analysisResult.demand?.prediction ?? 'Unavailable'}</li>
                      <li>Model name: {analysisResult.demand?.model ?? 'Unavailable'}</li>
                    </ul>
                  </div>

                  <div style={styles.technicalSection}>
                    <h4 style={styles.technicalHeading}>SHAP</h4>
                    <ul style={styles.technicalList}>
                      <li>Base value: {analysisResult.explainability?.base_value ?? 'Unavailable'}</li>
                      <li>
                        Positive factors:{' '}
                        {analysisResult.explainability?.top_positive_factors?.length
                          ? analysisResult.explainability.top_positive_factors
                              .map((factor) => `${String((factor as { feature?: string }).feature ?? 'Unknown feature')} (${String((factor as { shap_value?: number }).shap_value ?? '0')})`)
                              .join(', ')
                          : 'Unavailable'}
                      </li>
                      <li>
                        Negative factors:{' '}
                        {analysisResult.explainability?.top_negative_factors?.length
                          ? analysisResult.explainability.top_negative_factors
                              .map((factor) => `${String((factor as { feature?: string }).feature ?? 'Unknown feature')} (${String((factor as { shap_value?: number }).shap_value ?? '0')})`)
                              .join(', ')
                          : 'Unavailable'}
                      </li>
                      <li>Reconstruction consistent: {analysisResult.explainability?.consistent === true ? 'true' : analysisResult.explainability?.consistent === false ? 'false' : 'Unavailable'}</li>
                    </ul>
                  </div>

                  <div style={styles.technicalSection}>
                    <h4 style={styles.technicalHeading}>Refinement</h4>
                    <ul style={styles.technicalList}>
                      <li>Original score: {analysisResult.refinement?.original_score ?? 'Unavailable'}</li>
                      <li>Refined score: {analysisResult.refinement?.refined_score ?? 'Unavailable'}</li>
                      <li>Score difference: {analysisResult.refinement?.score_difference ?? 'Unavailable'}</li>
                      <li>Improved: {analysisResult.refinement?.improved === true ? 'true' : analysisResult.refinement?.improved === false ? 'false' : 'Unavailable'}</li>
                      <li>
                        Exact returned changes:{' '}
                        {analysisResult.refinement?.changes?.length
                          ? analysisResult.refinement.changes
                              .map((change) => `${String((change as { feature?: string }).feature ?? 'Unknown feature')}: ${String((change as { from_value?: unknown }).from_value ?? '—')} → ${String((change as { to_value?: unknown }).to_value ?? '—')}`)
                              .join('; ')
                          : 'Unavailable'}
                      </li>
                    </ul>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}

const styles: Record<string, any> = {
  pageShell: {
    minHeight: '100vh',
    background: 'transparent',
  },
  mainContent: {
    maxWidth: 1500,
    margin: '24px auto 46px',
    padding: '0 28px',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 20,
    marginBottom: 22,
  },
  pageTitle: {
    margin: 0,
    fontSize: 'clamp(1.9rem, 2.1vw, 2.6rem)',
    lineHeight: 1,
    letterSpacing: '-0.07em',
    color: '#2c1f3d',
    fontWeight: 900,
  },
  pageSubtitle: {
    margin: '10px 0 0',
    color: '#5a4a6f',
    fontSize: '0.94rem',
  },
  headerButtons: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
  },
  primaryButton: {
    border: '1px solid rgba(139, 92, 246, 0.5)',
    background: 'linear-gradient(135deg, #b69afc 0%, #8f5fe6 100%)',
    color: '#ffffff',
    borderRadius: 16,
    padding: '12px 18px',
    fontWeight: 700,
    minHeight: 44,
    cursor: 'pointer',
    boxShadow: '0 10px 20px rgba(139, 92, 246, 0.18)',
  },
  secondaryButton: {
    border: '1px solid rgba(141, 114, 170, 0.35)',
    background: 'rgba(255,255,255,0.4)',
    color: '#4c3e62',
    borderRadius: 16,
    padding: '12px 18px',
    fontWeight: 700,
    minHeight: 44,
    cursor: 'pointer',
  },
  pageGrid: {
    display: 'grid',
    gridTemplateColumns: '260px minmax(0, 1fr)',
    gap: 26,
    alignItems: 'start',
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  card: {
    border: '1px solid rgba(145, 120, 174, 0.34)',
    borderRadius: 20,
    background: 'rgba(255,255,255,0.52)',
    padding: 22,
    boxShadow: '0 12px 24px rgba(95, 68, 130, 0.05)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionPin: {
    color: '#8a60d4',
    fontSize: '1.1rem',
    lineHeight: 1,
  },
  cardTitle: {
    margin: 0,
    fontSize: '1.04rem',
    lineHeight: 1.2,
    color: '#2a2140',
    letterSpacing: '-0.04em',
    fontWeight: 800,
    flex: 1,
  },
  imageWrap: {
    borderRadius: 18,
    border: '1px solid rgba(145, 120, 174, 0.24)',
    background: '#f1ebf7',
    overflow: 'hidden',
    height: 360,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    display: 'block',
  },
  imagePlaceholder: {
    color: '#6b5b7c',
    fontWeight: 700,
    textAlign: 'center',
    fontSize: '0.96rem',
    padding: 20,
  },
  formSummary: {
    marginTop: 18,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  summaryRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingBottom: 8,
    borderBottom: '1px solid rgba(145, 120, 174, 0.18)',
  },
  summaryLabel: {
    color: '#6f5e82',
    fontWeight: 700,
    fontSize: '0.82rem',
  },
  summaryValue: {
    color: '#2a2140',
    fontWeight: 700,
    fontSize: '0.9rem',
    textAlign: 'right',
  },
  contextCard: {
    border: '1px solid rgba(145, 120, 174, 0.34)',
    borderRadius: 20,
    background: 'rgba(255,255,255,0.52)',
    padding: 20,
    boxShadow: '0 12px 24px rgba(95, 68, 130, 0.05)',
  },
  contextHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 16,
  },
  contextTitleWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  contextIcon: {
    color: '#8d66d9',
    fontSize: '1.2rem',
    lineHeight: 1,
  },
  contextTitle: {
    margin: 0,
    fontSize: '1.1rem',
    color: '#2a2140',
    letterSpacing: '-0.04em',
    fontWeight: 800,
  },
  demoBadge: {
    alignSelf: 'center',
    borderRadius: 999,
    border: '1px solid rgba(139, 92, 246, 0.24)',
    background: 'rgba(139, 92, 246, 0.08)',
    color: '#5d3e98',
    fontSize: '0.76rem',
    fontWeight: 700,
    padding: '7px 10px',
  },
  contextSelectorLabel: {
    display: 'block',
    color: '#6d5d82',
    fontSize: '0.74rem',
    fontWeight: 800,
    marginBottom: 6,
  },
  contextSelector: {
    width: '100%',
    border: '1px solid rgba(145, 120, 174, 0.34)',
    borderRadius: 10,
    background: '#fff',
    color: '#2a2140',
    padding: '10px 12px',
    fontSize: '0.86rem',
    fontWeight: 700,
  },
  contextStatus: {
    margin: '8px 0 0',
    color: '#6d5d82',
    fontSize: '0.78rem',
  },
  contextError: {
    margin: '8px 0 0',
    color: '#a33f58',
    fontSize: '0.78rem',
  },
  contextHeadline: {
    fontSize: '1.25rem',
    fontWeight: 900,
    color: '#2a2140',
    letterSpacing: '-0.05em',
    marginBottom: 18,
  },
  contextGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 12,
  },
  comparisonCard: {
    border: '1px solid rgba(145, 120, 174, 0.34)',
    borderRadius: 20,
    background: 'rgba(255,255,255,0.52)',
    padding: 20,
    boxShadow: '0 12px 24px rgba(95, 68, 130, 0.05)',
    marginTop: 20,
  },
  comparisonList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    marginTop: 18,
  },
  scenarioRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  scenarioRowTop: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
  },
  scenarioLabel: {
    color: '#4d3c63',
    fontSize: '0.78rem',
    fontWeight: 700,
  },
  scenarioValue: {
    color: '#2a2140',
    fontSize: '0.78rem',
  },
  scenarioTrack: {
    height: 9,
    borderRadius: 999,
    background: 'rgba(139, 92, 246, 0.12)',
    overflow: 'hidden',
  },
  scenarioFill: {
    display: 'block',
    height: '100%',
    borderRadius: 999,
    background: 'linear-gradient(90deg, #cdb3f5 0%, #8b5cf6 100%)',
  },
  contextItem: {
    borderRadius: 14,
    border: '1px solid rgba(145, 120, 174, 0.28)',
    background: 'rgba(245,242,248,0.9)',
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    minHeight: 76,
    justifyContent: 'center',
  },
  contextLabel: {
    color: '#6d5d82',
    fontSize: '0.74rem',
    fontWeight: 800,
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
  },
  contextValue: {
    color: '#2a2140',
    fontSize: '0.92rem',
    fontWeight: 700,
  },
  dataSourceRow: {
    borderRadius: 14,
    border: '1px solid rgba(145, 120, 174, 0.28)',
    background: 'rgba(245,242,248,0.9)',
    padding: '12px 14px',
    marginTop: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  firstRow: {
    display: 'grid',
    gridTemplateColumns: '1.1fr 1fr 1fr',
    gap: 20,
  },
  visualBody: {
    display: 'grid',
    gridTemplateColumns: '150px minmax(180px, 1fr) 160px',
    gap: 12,
    alignItems: 'center',
  },
  gaugeWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeRing: {
    width: 146,
    height: 146,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'inset 0 0 0 1px rgba(139, 92, 246, 0.12)',
  },
  gaugeInner: {
    width: 98,
    height: 98,
    borderRadius: '50%',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(245,240,249,0.96))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(145, 120, 174, 0.26)',
  },
  gaugeValue: {
    fontSize: '1.1rem',
    fontWeight: 800,
    color: '#2a2140',
  },
  visualMeta: {
    display: 'grid',
    gridTemplateColumns: 'minmax(180px, 1fr) 160px',
    gap: 12,
    alignItems: 'stretch',
    gridColumn: '2 / span 2',
  },
  visualStat: {
    borderRadius: 14,
    border: '1px solid rgba(145, 120, 174, 0.26)',
    background: 'rgba(245,242,248,0.85)',
    padding: '10px 10px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 4,
    minHeight: 96,
    width: '100%',
  },
  visualLabel: {
    color: '#6d5d82',
    fontWeight: 800,
    fontSize: '0.62rem',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    lineHeight: 1.15,
  },
  visualValue: {
    color: '#2a2140',
    fontSize: '0.76rem',
    fontWeight: 700,
    lineHeight: 1.15,
    whiteSpace: 'normal',
    wordBreak: 'normal',
    overflowWrap: 'break-word',
  },
  supportingText: {
    color: '#4d3c63',
    lineHeight: 1.6,
    margin: '16px 0 0',
    fontSize: '0.86rem',
  },
  matchList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  marketOutlookBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  marketOutlookTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  marketOutlookLabel: {
    color: '#6d5d82',
    fontSize: '0.82rem',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  marketOutlookBadge: {
    borderRadius: 999,
    border: '1px solid rgba(139, 92, 246, 0.26)',
    background: 'rgba(139, 92, 246, 0.08)',
    color: '#5d3e98',
    fontSize: '0.72rem',
    fontWeight: 700,
    padding: '6px 8px',
  },
  marketOutlookValue: {
    fontSize: '2.5rem',
    lineHeight: 1,
    letterSpacing: '-0.06em',
    fontWeight: 900,
    color: '#2a2140',
  },
  marketOutlookModelRow: {
    paddingTop: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  marketDemandRow: {
    display: 'grid',
    gridTemplateColumns: '1.6fr 1fr 1fr',
    gap: 20,
  },
  currentDemandBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  currentDemandHeader: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 16,
  },
  currentDemandLabel: {
    color: '#6d5d82',
    fontSize: '0.82rem',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  currentDemandValue: {
    color: '#2a2140',
    fontSize: '2rem',
    lineHeight: 1,
    letterSpacing: '-0.06em',
    fontWeight: 900,
  },
  currentDemandMeta: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 12,
  },
  currentDemandMetaItem: {
    borderRadius: 14,
    border: '1px solid rgba(145, 120, 174, 0.28)',
    background: 'rgba(245,242,248,0.9)',
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  currentDemandBarTrack: {
    height: 18,
    borderRadius: 999,
    background: 'rgba(139, 92, 246, 0.12)',
    overflow: 'hidden',
    position: 'relative',
  },
  currentDemandBarFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 999,
    background: 'linear-gradient(90deg, #d3baf7 0%, #8b5cf6 100%)',
  },
  currentDemandNote: {
    margin: 0,
    color: '#6d5d82',
    fontSize: '0.82rem',
    fontStyle: 'italic',
  },
  positiveTintCard: {
    background: 'rgba(231, 245, 237, 0.72)',
  },
  negativeTintCard: {
    background: 'rgba(246, 232, 236, 0.72)',
  },
  matchRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1.5fr) auto',
    gap: 10,
    alignItems: 'center',
    borderRadius: 14,
    border: '1px solid rgba(145, 120, 174, 0.26)',
    background: 'rgba(245,242,248,0.85)',
    padding: '10px 12px',
  },
  matchMeta: {
    minWidth: 0,
  },
  matchLabel: {
    fontWeight: 700,
    color: '#2a2140',
    fontSize: '0.82rem',
  },
  matchBarTrack: {
    height: 10,
    borderRadius: 999,
    background: 'rgba(139, 92, 246, 0.12)',
    overflow: 'hidden',
    position: 'relative',
  },
  matchBarFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 999,
    background: 'linear-gradient(90deg, #a78bfa 0%, #8b5cf6 100%)',
  },
  matchValue: {
    fontWeight: 700,
    color: '#5d3e98',
    fontSize: '0.78rem',
    minWidth: 52,
    textAlign: 'right',
  },
  comparisonWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  comparisonRow: {
    borderRadius: 14,
    border: '1px solid rgba(145, 120, 174, 0.26)',
    background: 'rgba(245,242,248,0.9)',
    padding: '10px 12px',
  },
  comparisonRowSelected: {
    borderColor: 'rgba(139, 92, 246, 0.5)',
    background: 'rgba(139, 92, 246, 0.06)',
  },
  comparisonLabelWrap: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  comparisonLabel: {
    fontWeight: 700,
    color: '#2a2140',
    fontSize: '0.86rem',
  },
  comparisonPrediction: {
    fontWeight: 700,
    color: '#5d3e98',
    fontSize: '0.78rem',
  },
  comparisonBarTrack: {
    height: 14,
    borderRadius: 999,
    background: 'rgba(139, 92, 246, 0.12)',
    overflow: 'hidden',
  },
  comparisonBarFill: {
    display: 'block',
    height: '100%',
    borderRadius: 999,
    background: 'linear-gradient(90deg, #b39af7 0%, #8b5cf6 100%)',
  },
  contributionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 18,
  },
  contributionColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  contributionHeading: {
    margin: 0,
    color: '#2a2140',
    fontWeight: 800,
    fontSize: '0.82rem',
  },
  contributionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  contributionItem: {
    borderRadius: 12,
    border: '1px solid rgba(145, 120, 174, 0.24)',
    background: 'rgba(245,242,248,0.7)',
    padding: '10px 12px',
  },
  contributionLabelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  contributionLabel: {
    color: '#2a2140',
    fontWeight: 700,
    fontSize: '0.82rem',
  },
  contributionValue: {
    color: '#5d3e98',
    fontWeight: 700,
    fontSize: '0.82rem',
  },
  contributionTrack: {
    height: 10,
    borderRadius: 999,
    background: 'rgba(139, 92, 246, 0.12)',
    overflow: 'hidden',
  },
  contributionBarPositive: {
    display: 'block',
    height: '100%',
    borderRadius: 999,
    background: 'linear-gradient(90deg, #a9e7b6 0%, #4db29a 100%)',
  },
  contributionBarNegative: {
    display: 'block',
    height: '100%',
    borderRadius: 999,
    background: 'linear-gradient(90deg, #f0b5b3 0%, #d86a6c 100%)',
  },
  twoColumnRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 20,
  },
  lavenderCard: {
    background: 'rgba(245,238,252,0.72)',
  },
  recommendationCard: {
    background: 'rgba(245,238,252,0.72)',
  },
  list: {
    margin: 0,
    paddingLeft: 18,
    color: '#2a2140',
    lineHeight: 1.7,
  },
  listItem: {
    marginBottom: 8,
  },
  recommendationTitle: {
    margin: '4px 0 0',
    color: '#2a2140',
    fontWeight: 800,
    fontSize: '0.92rem',
  },
  changeListWrap: {
    marginTop: 10,
  },
  contextNoteCard: {
    border: '1px solid rgba(145, 120, 174, 0.34)',
    borderRadius: 14,
    background: 'rgba(255,255,255,0.42)',
    padding: '14px 16px',
  },
  contextNote: {
    margin: 0,
    color: '#5c4d74',
    fontSize: '0.8rem',
    lineHeight: 1.5,
  },
  technicalCard: {
    border: '1px solid rgba(145, 120, 174, 0.34)',
    borderRadius: 16,
    background: 'rgba(255,255,255,0.42)',
    overflow: 'hidden',
  },
  technicalToggle: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: 'none',
    background: 'transparent',
    padding: '14px 16px',
    color: '#2a2140',
    fontWeight: 800,
    fontSize: '0.88rem',
    cursor: 'pointer',
  },
  technicalContent: {
    borderTop: '1px solid rgba(145, 120, 174, 0.25)',
    padding: '14px 16px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  technicalSection: {
    borderTop: '1px solid rgba(145, 120, 174, 0.18)',
    paddingTop: 12,
  },
  technicalHeading: {
    margin: '0 0 8px',
    color: '#2a2140',
    fontSize: '0.96rem',
    fontWeight: 800,
  },
  technicalList: {
    margin: 0,
    paddingLeft: 18,
    color: '#4c3c63',
    lineHeight: 1.7,
  },
  emptyStateSmall: {
    color: '#5b4a71',
    fontSize: '0.9rem',
    lineHeight: 1.5,
  },
  noDataMain: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '60px 24px 80px',
  },
  noDataCard: {
    width: 'min(520px, 100%)',
    border: '1px solid rgba(145, 120, 174, 0.35)',
    borderRadius: 20,
    background: 'rgba(255,255,255,0.55)',
    boxShadow: '0 10px 24px rgba(95, 68, 130, 0.05)',
    padding: '40px 24px',
    textAlign: 'center',
  },
  noDataTitle: {
    margin: '0 0 18px',
    color: '#2a2140',
    fontSize: '1.8rem',
    letterSpacing: '-0.05em',
  },
}

export default Insights
