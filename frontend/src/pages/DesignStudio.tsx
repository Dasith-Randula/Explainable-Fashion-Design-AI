import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BrainCircuit,
  ChartNoAxesColumnIncreasing,
  Database,
  Download,
  Eye,
  HelpCircle,
  ImageIcon,
  ImagePlus,
  RefreshCcw,
  Save,
  Search,
  SlidersHorizontal,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wand2,
} from 'lucide-react'
import { analyzeDesign } from '../api/analysis'
import { FRIENDLY_ERRORS, getFriendlyApiError } from '../api/errors'
import { demoDemandContext, getDemandFeatures, marketContexts, type MarketContext } from '../data/demoDemandContext'
import SiteFooter from '../components/SiteFooter'
import SiteHeader from '../components/SiteHeader'
import BackendStatus from '../components/system/BackendStatus'
import inspirationImage from '../../assets/purple-outfit-product.png'
import '../styles/design-studio.css'
import type { AnalysisResponse } from '../api/types'
import { formatReadableFeatureName } from '../utils/analysisExplanation'

const STORAGE_KEY = 'threadwise-insights-analysis'
const IMAGE_STORAGE_KEY = 'threadwise_analysis_image'

const initialForm = {
  category: 'Two-piece',
  sleeveLength: 'Long sleeve',
  neckline: 'Square neck',
  color: 'Deep purple',
  fabric: 'Structured crepe',
  style: 'Modern & confident',
  occasion: 'Evening / Party',
  description: '',
}

const categoryOptions = ['Two-piece', 'Dress', 'Top', 'Outerwear', 'Bottoms']
const sleeveOptions = ['Sleeveless', 'Short sleeve', 'Long sleeve']
const necklineOptions = ['Square neck', 'Round neck', 'V-neck', 'High neck']
const colorOptions = ['Deep purple', 'Black', 'White', 'Grey', 'Red']
const fabricOptions = ['Structured crepe', 'Cotton', 'Chiffon', 'Acrylic', 'Knit']
const styleOptions = ['Modern & confident', 'Minimal', 'Elegant', 'Streetwear', 'Casual']
const occasionOptions = ['Evening / Party', 'Casual', 'Workwear', 'Formal', 'Everyday']

const getConfidenceBand = (confidence?: number | null) => {
  if (confidence === null || confidence === undefined) {
    return 'Model confidence: Uncertain'
  }

  if (confidence < 0.5) {
    return 'Model confidence: Uncertain'
  }

  if (confidence < 0.75) {
    return 'Model confidence: Moderate'
  }

  return 'Model confidence: Strong'
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

  return !cleanedFeature.startsWith('category_') && !cleanedFeature.startsWith('season_from_time_') && !cleanedFeature.startsWith('color_') && !cleanedFeature.startsWith('fabric_')
    ? true
    : allowedCategories.includes(cleanedFeature)
}

const formatFeatureList = (items: string[]) => {
  if (items.length === 0) {
    return ''
  }

  if (items.length === 1) {
    return items[0]
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`
  }

  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}

function DesignStudio() {
  const navigate = useNavigate()
  const [formValues, setFormValues] = useState(initialForm)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const [analysisMessage, setAnalysisMessage] = useState('')
  const [analysisError, setAnalysisError] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [includeDemoDemandContext, setIncludeDemoDemandContext] = useState(true)
  const [selectedMarketContextId, setSelectedMarketContextId] = useState(demoDemandContext.id)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null)
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const selectedMarketContext: MarketContext = marketContexts.find((context) => context.id === selectedMarketContextId) ?? demoDemandContext

  useEffect(() => {
    return () => {
      if (uploadedImage?.startsWith('blob:')) {
        URL.revokeObjectURL(uploadedImage)
      }
    }
  }, [uploadedImage])

  const currentPreviewImage = uploadedImage ?? ''
  const hasUploadedImage = Boolean(uploadedImage)

  const analysisSummary = useMemo(() => {
    if (!analysisResult) {
      return null
    }

    const positiveFactors = (analysisResult.explainability?.top_positive_factors ?? []).filter((factor) => {
      const feature = String((factor as { feature?: string }).feature ?? '')
      return isUserFacingCategoricalFeature(feature, demoDemandContext) || !feature.toLowerCase().startsWith('cat__')
    })

    const negativeFactors = (analysisResult.explainability?.top_negative_factors ?? []).filter((factor) => {
      const feature = String((factor as { feature?: string }).feature ?? '')
      return isUserFacingCategoricalFeature(feature, demoDemandContext) || !feature.toLowerCase().startsWith('cat__')
    })

    const positiveDisplayFactors = positiveFactors.slice(0, 4)
    const negativeDisplayFactors = negativeFactors.slice(0, 4)

    const positiveSummary = positiveDisplayFactors.map((factor) => {
      const feature = String((factor as { feature?: string }).feature ?? 'Unknown feature')
      const shapValue = Number((factor as { shap_value?: number }).shap_value ?? 0)
      const readableFeature = formatReadableFeatureName(feature)
      const action = shapValue >= 0.5 ? 'strongly supported the prediction' : shapValue >= 0.2 ? 'supported the prediction' : 'contributed positively'

      return `${readableFeature} ${action}.`
    })

    const negativeSummary = negativeDisplayFactors.map((factor) => {
      const feature = String((factor as { feature?: string }).feature ?? 'Unknown feature')
      const readableFeature = formatReadableFeatureName(feature)

      return `${readableFeature} slightly reduced the model score.`
    })

    const positiveNames = positiveDisplayFactors.map((factor) =>
      formatReadableFeatureName(String((factor as { feature?: string }).feature ?? 'Unknown feature')),
    )

    const keyInsight = positiveNames.length
      ? `The strongest positive signals came from ${formatFeatureList(positiveNames)}.`
      : 'The available SHAP output does not reveal a clearly dominant positive driver.'

    const confidenceBand = getConfidenceBand(analysisResult.visual?.classifier?.confidence ?? null)
    const detectedAttribute = analysisResult.visual?.classifier?.label ?? 'Unavailable'

    return {
      visualAvailable: Boolean(analysisResult.visual?.available),
      demandAvailable: Boolean(analysisResult.demand?.available),
      explainabilityAvailable: Boolean(analysisResult.explainability?.available),
      refinementAvailable: Boolean(analysisResult.refinement?.available),
      demandPrediction: analysisResult.demand?.prediction ?? null,
      model: analysisResult.demand?.model ?? null,
      consistent: analysisResult.explainability?.consistent ?? null,
      improved: analysisResult.refinement?.improved ?? null,
      similarItems: analysisResult.visual?.clip?.similar_items ?? [],
      classifier: analysisResult.visual?.classifier ?? null,
      clip: analysisResult.visual?.clip ?? null,
      explainability: analysisResult.explainability,
      refinement: analysisResult.refinement,
      positiveSummary,
      negativeSummary,
      keyInsight,
      confidenceBand,
      detectedAttributeDisplay:
        confidenceBand === 'Model confidence: Uncertain' && detectedAttribute !== 'Unavailable'
          ? `${detectedAttribute}-like material`
          : detectedAttribute,
    }
  }, [analysisResult])

  const handleFieldChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleReset = () => {
    setFormValues(initialForm)
    setUploadedImage(null)
    setUploadedFile(null)
    setUploadedFileName(null)
    setAnalysisMessage('')
    setAnalysisError('')
    setAnalysisResult(null)
    setIsAnalyzing(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp']
    const isAcceptedType = acceptedTypes.includes(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name)

    if (!isAcceptedType) {
      event.target.value = ''
      setUploadedImage(null)
      setUploadedFile(null)
      setUploadedFileName(null)
      setAnalysisError(FRIENDLY_ERRORS.invalidImage)
      setAnalysisMessage('')
      return
    }

    if (uploadedImage?.startsWith('blob:')) {
      URL.revokeObjectURL(uploadedImage)
    }

    const objectUrl = URL.createObjectURL(file)
    setUploadedImage(objectUrl)
    setUploadedFile(file)
    setUploadedFileName(file.name)
    setAnalysisMessage('Reference image loaded for analysis.')
    setAnalysisError('')
  }

  const handleRemoveImage = () => {
    if (uploadedImage?.startsWith('blob:')) {
      URL.revokeObjectURL(uploadedImage)
    }
    setUploadedImage(null)
    setUploadedFile(null)
    setUploadedFileName(null)
    setAnalysisResult(null)
    setAnalysisError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleAnalyze = async () => {
    if (!uploadedFile) {
      setAnalysisError('Please upload a valid image first.')
      return
    }

    setIsAnalyzing(true)
    setAnalysisError('')
    setAnalysisResult(null)
    setAnalysisMessage('Analyzing design...')

    try {
      const response = await analyzeDesign({
        image: uploadedFile,
        topK: 5,
        demandFeatures: includeDemoDemandContext ? getDemandFeatures(selectedMarketContext) : undefined,
      })

      const imageDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = () => {
          resolve(String(reader.result ?? ''))
        }

        reader.onerror = () => {
          reject(new Error('Failed to read uploaded image'))
        }

        reader.readAsDataURL(uploadedFile)
      })

      setAnalysisResult(response)
      setAnalysisMessage('Analysis complete')

      const payload = {
        analysisResult: response,
        uploadedImage: imageDataUrl,
        uploadedFileName,
        formValues,
        selectedMarketContext: includeDemoDemandContext ? selectedMarketContext : undefined,
      }

      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
      window.sessionStorage.setItem(IMAGE_STORAGE_KEY, imageDataUrl)
      navigate('/insights')
    } catch (error) {
      const message = getFriendlyApiError(error, FRIENDLY_ERRORS.unknown)

      setAnalysisError(message)
      setAnalysisMessage('')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleAction = (action: string) => {
    setAnalysisMessage(`${action} is ready for the next step.`)
  }

  const handleDownload = () => {
    if (!hasUploadedImage) {
      return
    }

    const link = document.createElement('a')
    link.href = currentPreviewImage
    link.download = 'design-preview.png'
    link.click()
  }

  return (
    <div className="design-studio-page">
      <SiteHeader />

      <main className="design-studio-shell">
        <header className="design-studio-header">
          <div className="design-studio-header__title-wrap">
            <h1 className="design-studio-title">
              Design with <span>AI.</span>
            </h1>
            <p className="design-studio-subtitle">Your ideas. A more stylish tomorrow.</p>
            <BackendStatus />
          </div>

          <div className="design-studio-header__support">
            <p className="support-eyebrow">FASHION MEETS INTELLIGENCE</p>
            <p className="support-copy">Describe. Explore. Refine.</p>
            <p className="support-text">
              Turn your fashion ideas into thoughtful designs with the power of AI-assisted
              analysis.
            </p>
          </div>
        </header>

        <div className="design-studio-grid">
          <aside className="design-panel design-panel--controls">
            <div className="panel-head">
              <div className="panel-head__title">
                <SlidersHorizontal size={18} />
                <h2>Design Controls</h2>
              </div>
              <button type="button" className="reset-button" onClick={handleReset}>
                <RefreshCcw size={14} />
                Reset all
              </button>
            </div>

            <div className="form-grid">
              <div className="field-group">
                <label htmlFor="category">Silhouette</label>
                <select
                  id="category"
                  name="category"
                  value={formValues.category}
                  onChange={handleFieldChange}
                >
                  {categoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-group">
                <label htmlFor="sleeveLength">Sleeve Length</label>
                <select
                  id="sleeveLength"
                  name="sleeveLength"
                  value={formValues.sleeveLength}
                  onChange={handleFieldChange}
                >
                  {sleeveOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-group">
                <label htmlFor="neckline">Neckline</label>
                <select
                  id="neckline"
                  name="neckline"
                  value={formValues.neckline}
                  onChange={handleFieldChange}
                >
                  {necklineOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-group">
                <label htmlFor="color">Color</label>
                <select
                  id="color"
                  name="color"
                  value={formValues.color}
                  onChange={handleFieldChange}
                >
                  {colorOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-group">
                <label htmlFor="fabric">Fabric</label>
                <select
                  id="fabric"
                  name="fabric"
                  value={formValues.fabric}
                  onChange={handleFieldChange}
                >
                  {fabricOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-group">
                <label htmlFor="style">Mood</label>
                <select
                  id="style"
                  name="style"
                  value={formValues.style}
                  onChange={handleFieldChange}
                >
                  {styleOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-group">
                <label htmlFor="occasion">Occasion</label>
                <select
                  id="occasion"
                  name="occasion"
                  value={formValues.occasion}
                  onChange={handleFieldChange}
                >
                  {occasionOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="description-field">
              <div className="description-field__header">
                <label htmlFor="description">Design Prompt</label>
                <span>{formValues.description.length}/500</span>
              </div>
              <textarea
                id="description"
                name="description"
                placeholder="e.g. A modern two-piece set with clean lines, inspired by minimalist evening wear..."
                maxLength={500}
                value={formValues.description}
                onChange={handleFieldChange}
              />
            </div>

            <div className="upload-area">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                className="hidden-input"
              />

              <button type="button" className="upload-button" onClick={() => fileInputRef.current?.click()}>
                <ImageIcon size={18} />
                <span>
                  <strong>Upload reference image</strong>
                  <small>JPG, PNG or WEBP</small>
                </span>
              </button>

              {uploadedFileName ? (
                <div className="upload-status">
                  <span>{uploadedFileName}</span>
                  <button type="button" onClick={handleRemoveImage} aria-label="Remove uploaded image">
                    <Eye size={14} />
                  </button>
                </div>
              ) : (
                <div className="upload-status upload-status--default">
                  <span>No image selected yet</span>
                </div>
              )}
            </div>

            <div className="demo-demand-toggle">
              <div className="demo-demand-toggle__header">
                <div className="demo-demand-toggle__title">
                  <Database size={16} aria-hidden="true" />
                  <span>Market Context</span>
                </div>
                <label className="demo-demand-toggle__switch">
                <input
                  type="checkbox"
                  checked={includeDemoDemandContext}
                  onChange={(event) => setIncludeDemoDemandContext(event.target.checked)}
                />
                  <span className="demo-demand-toggle__track" aria-hidden="true">
                    <span className="demo-demand-toggle__thumb" />
                  </span>
                  <span className="sr-only">Use verified market context</span>
                </label>
              </div>
              {includeDemoDemandContext ? (
                <>
                  <label className="demo-demand-toggle__scenario-label" htmlFor="verified-market-context">
                    Verified market scenario
                  </label>
                  <div className="demo-demand-toggle__select-wrap">
                    <select
                      id="verified-market-context"
                      aria-label="Verified Visuelle market context"
                      value={selectedMarketContextId}
                      onChange={(event) => setSelectedMarketContextId(event.target.value)}
                    >
                      {marketContexts.map((context) => (
                        <option key={context.id} value={context.id}>
                          {context.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : null}
              <p className="demo-demand-toggle__supporting-copy">
                <strong>Verified Visuelle data</strong>
                <span>Historical market context is used for demand, SHAP and refinement analysis. It is not inferred directly from the uploaded image.</span>
              </p>
            </div>

            <button
              type="button"
              className="primary-cta"
              onClick={handleAnalyze}
              disabled={!hasUploadedImage || isAnalyzing}
            >
              <Sparkles size={17} />
              {isAnalyzing ? 'Analyzing design...' : 'Analyze Design →'}
            </button>

            {!hasUploadedImage ? (
              <p className="analysis-message analysis-message--warning">Upload a fashion image first.</p>
            ) : null}

            {analysisMessage ? <p className="analysis-message">{analysisMessage}</p> : null}
            {analysisError ? <p className="analysis-message analysis-message--error">{analysisError}</p> : null}
          </aside>

          <section className="design-panel design-panel--preview">
            <div className="panel-head">
              <div className="panel-head__title">
                <Eye size={18} />
                <h2>Your Design</h2>
              </div>
              <span className="preview-badge">Preview</span>
            </div>

            <div className="preview-surface">
              {!hasUploadedImage ? (
                <div className="preview-empty-state">
                  <div className="preview-empty-state__icon">
                    <ImagePlus size={34} />
                  </div>

                  <h3>Upload a fashion design to begin</h3>
                  <p>
                    Add a fashion image to analyze its visual attributes, demand potential,
                    customer preference and explainable AI insights.
                  </p>

                  <button
                    type="button"
                    className="preview-empty-state__button"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose image
                  </button>

                  <span className="preview-empty-state__hint">JPG, PNG or WEBP</span>

                  <div className="preview-empty-state__indicators">
                    <div className="preview-indicator">
                      <Eye size={14} />
                      <span>Visual analysis</span>
                    </div>
                    <div className="preview-indicator">
                      <Search size={14} />
                      <span>Similar designs</span>
                    </div>
                    <div className="preview-indicator">
                      <ChartNoAxesColumnIncreasing size={14} />
                      <span>Demand insights</span>
                    </div>
                    <div className="preview-indicator">
                      <BrainCircuit size={14} />
                      <span>Explainable AI</span>
                    </div>
                  </div>
                </div>
              ) : (
                <img src={currentPreviewImage} alt="Current design preview" />
              )}
            </div>

            {hasUploadedImage ? (
              <div className="preview-inline-actions">
                <button type="button" className="inline-action" onClick={() => fileInputRef.current?.click()}>
                  Change image
                </button>
                <button type="button" className="inline-action inline-action--muted" onClick={handleRemoveImage}>
                  Remove
                </button>
              </div>
            ) : null}

            <div className="preview-actions">
              <button type="button" className="action-button" onClick={() => handleAction('Refine')}>
                <Wand2 size={16} />
                Refine
              </button>
              <button
                type="button"
                className="action-button"
                onClick={() => handleAction('Explain Choices')}
              >
                <HelpCircle size={16} />
                Explain Choices
              </button>
              <button type="button" className="action-button" onClick={() => handleAction('Save Design')}>
                <Save size={16} />
                Save Design
              </button>
              <button
                type="button"
                className="action-button action-button--primary"
                onClick={handleDownload}
                disabled={!hasUploadedImage}
              >
                <Download size={16} />
                Download
              </button>
            </div>
          </section>

          <aside className="design-panel design-panel--inspiration">
            <div className="panel-head">
              <div className="panel-head__title">
                <ImageIcon size={18} />
                <h2>Inspiration</h2>
              </div>
              <button type="button" className="change-image-button">
                Change image
              </button>
            </div>

            <div className="inspiration-wrap">
              <div className="inspiration-photo-frame">
                <img src={inspirationImage} alt="Purple outfit inspiration" />
              </div>
              <div className="inspiration-caption">
                <span>THE PURPLE EDIT</span>
                <span>PERSPECTIVE</span>
              </div>
            </div>

            <div className="inspiration-quote">
              “Modern, confident, and effortlessly cool.
              <br />
              This look inspired the structured silhouette
              <br />
              and bold monochrome palette.”
            </div>
          </aside>
        </div>

        {analysisResult ? (
          <section className="analysis-results-section">
            <div className="analysis-results-header">
              <h2>AI Design Insights</h2>
              <p>A simple explanation of what the models found and what it means for your design.</p>
            </div>

            {analysisSummary?.visualAvailable ? (
              <div className="analysis-result-card">
                <h3>Visual Understanding</h3>

                <div className="analysis-insight-grid">
                  <div className="analysis-insight-field">
                    <span className="analysis-label">Detected attribute</span>
                    <strong>{analysisSummary.detectedAttributeDisplay}</strong>
                  </div>
                  <div className="analysis-insight-field">
                    <span className="analysis-label">Model confidence</span>
                    <strong>{analysisSummary.confidenceBand}</strong>
                  </div>
                </div>

                <p className="analysis-inline-text">
                  The model identified this as the closest learned visual attribute, but the uploaded design may contain features outside the training data.
                </p>
              </div>
            ) : null}

            {analysisSummary?.visualAvailable ? (
              <div className="analysis-result-card">
                <h3>Closest visual matches</h3>

                {analysisSummary.similarItems.length > 0 ? (
                  <div className="analysis-chip-list">
                    {analysisSummary.similarItems.slice(0, 5).map((item, index) => {
                      const imageIdentifier =
                        typeof item.metadata?.filename !== 'undefined'
                          ? String(item.metadata.filename)
                          : typeof item.metadata?.image_id !== 'undefined'
                            ? String(item.metadata.image_id)
                            : typeof item.metadata?.id !== 'undefined'
                              ? String(item.metadata.id)
                              : `Visual match ${index + 1}`

                      return (
                        <span key={`${item.rank ?? index}-match`} className="analysis-chip">
                          {formatFilenameForDisplay(imageIdentifier)}
                        </span>
                      )
                    })}
                  </div>
                ) : (
                  <p className="analysis-inline-text">No closely matched items were returned for this upload.</p>
                )}
              </div>
            ) : null}

            {analysisSummary?.demandAvailable ? (
              <div className="analysis-result-card">
                <h3>Demand Analysis</h3>
                <p className="analysis-inline-text">
                  The trained demand model produced a forecast for the selected demo market context.
                </p>

                <div className="analysis-insight-grid">
                  <div className="analysis-insight-field">
                    <span className="analysis-label">Market context</span>
                    <strong>Verified sample market data</strong>
                  </div>
                  <div className="analysis-insight-field">
                    <span className="analysis-label">Model</span>
                    <strong>{analysisSummary.model ?? 'Unavailable'}</strong>
                  </div>
                </div>
              </div>
            ) : null}

            {analysisSummary?.explainabilityAvailable ? (
              <div className="analysis-result-card analysis-explanation-card">
                <h3>Why did the model make this prediction?</h3>

                <p className="analysis-inline-text">{analysisSummary.keyInsight}</p>

                <div className="analysis-explanation-grid">
                  <div className="analysis-explanation-section">
                    <div className="analysis-explanation-section__icon">
                      <TrendingUp size={16} />
                    </div>
                    <div>
                      <h4>What is helping</h4>
                      {analysisSummary.positiveSummary.length > 0 ? (
                        <ul>
                          {analysisSummary.positiveSummary.map((item, index) => (
                            <li key={`help-${index}`}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>No clear positive factors were returned for this prediction.</p>
                      )}
                    </div>
                  </div>

                  <div className="analysis-explanation-section">
                    <div className="analysis-explanation-section__icon">
                      <TrendingDown size={16} />
                    </div>
                    <div>
                      <h4>What is limiting the prediction</h4>
                      {analysisSummary.negativeSummary.length > 0 ? (
                        <ul>
                          {analysisSummary.negativeSummary.map((item, index) => (
                            <li key={`limit-${index}`}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>No clear limiting factors were returned for this prediction.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {analysisSummary?.refinementAvailable ? (
              <div className="analysis-result-card analysis-recommendation-card">
                <h3>AI Recommendation</h3>

                {analysisSummary.improved === true ? (
                  <>
                    <p className="analysis-inline-text">Suggested refinement</p>

                    {analysisSummary.refinement?.changes && analysisSummary.refinement.changes.length > 0 ? (
                      <div className="analysis-recommendation-changes">
                        <h4>Consider changing:</h4>
                        <ul>
                          {analysisSummary.refinement.changes.map((change, index) => (
                            <li key={`recommendation-change-${index}`}>
                              {String((change as { feature?: string }).feature ?? 'Attribute')}: {String((change as { from_value?: unknown }).from_value ?? '—')} → {String((change as { to_value?: unknown }).to_value ?? '—')}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    <p className="analysis-inline-text">
                      This alternative produced a better model score for the selected market context.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="analysis-inline-text">
                      <strong>Keep the current configuration.</strong>
                    </p>
                    <p className="analysis-inline-text">
                      The refinement process tested alternative design attributes, but none improved the model score for this market context.
                    </p>
                    <p className="analysis-inline-text">
                      No change is recommended based on the tested alternatives.
                    </p>
                  </>
                )}
              </div>
            ) : null}

            <div className="analysis-context-note-wrap">
              <p className="analysis-context-note">
                Demand and refinement insights use a verified demo market context. They are not inferred directly from the uploaded image and should not be treated as universal fashion advice.
              </p>
            </div>

            <div className="analysis-technical-card">
              <button
                type="button"
                className="analysis-technical-toggle"
                onClick={() => setShowTechnicalDetails((previous) => !previous)}
              >
                <span>Technical details</span>
                <span>{showTechnicalDetails ? '▴' : '▾'}</span>
              </button>

              {showTechnicalDetails ? (
                <div className="analysis-technical-content">
                  <div className="analysis-technical-section">
                    <h4>Visual model</h4>
                    <ul>
                      <li>Predicted label: {analysisSummary?.classifier?.label ?? 'Unavailable'}</li>
                      <li>Confidence percentage: {analysisSummary?.classifier?.confidence !== null && analysisSummary?.classifier?.confidence !== undefined ? `${(analysisSummary.classifier.confidence * 100).toFixed(1)}%` : 'Unavailable'}</li>
                      <li>Class index: {analysisSummary?.classifier?.class_index ?? 'Unavailable'}</li>
                    </ul>
                  </div>

                  <div className="analysis-technical-section">
                    <h4>CLIP</h4>
                    <ul>
                      <li>Embedding dimension: {analysisSummary?.clip?.embedding_dimension ?? 'Unavailable'}</li>
                      <li>
                        Top similar filenames:{' '}
                        {analysisSummary?.similarItems.length
                          ? analysisSummary.similarItems
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
                        Similarity scores:{' '}
                        {analysisSummary?.similarItems.length
                          ? analysisSummary.similarItems
                              .slice(0, 5)
                              .map((item) => (item.similarity !== undefined ? item.similarity.toFixed(3) : '—'))
                              .join(', ')
                          : 'Unavailable'}
                      </li>
                    </ul>
                  </div>

                  <div className="analysis-technical-section">
                    <h4>Demand</h4>
                    <ul>
                      <li>Exact prediction: {analysisSummary?.demandPrediction ?? 'Unavailable'}</li>
                      <li>Model name: {analysisSummary?.model ?? 'Unavailable'}</li>
                    </ul>
                  </div>

                  <div className="analysis-technical-section">
                    <h4>SHAP</h4>
                    <ul>
                      <li>Base value: {analysisSummary?.explainability?.base_value ?? 'Unavailable'}</li>
                      <li>
                        Positive factors:{' '}
                        {analysisSummary?.explainability?.top_positive_factors?.length
                          ? analysisSummary.explainability.top_positive_factors
                              .map((factor) => `${String((factor as { feature?: string }).feature ?? 'Unknown feature')} (${String((factor as { shap_value?: number }).shap_value ?? '0')})`)
                              .join(', ')
                          : 'Unavailable'}
                      </li>
                      <li>
                        Negative factors:{' '}
                        {analysisSummary?.explainability?.top_negative_factors?.length
                          ? analysisSummary.explainability.top_negative_factors
                              .map((factor) => `${String((factor as { feature?: string }).feature ?? 'Unknown feature')} (${String((factor as { shap_value?: number }).shap_value ?? '0')})`)
                              .join(', ')
                          : 'Unavailable'}
                      </li>
                      <li>Reconstruction consistent: {analysisSummary?.consistent === true ? 'true' : analysisSummary?.consistent === false ? 'false' : 'Unavailable'}</li>
                    </ul>
                  </div>

                  <div className="analysis-technical-section">
                    <h4>Refinement</h4>
                    <ul>
                      <li>Original score: {analysisSummary?.refinement?.original_score ?? 'Unavailable'}</li>
                      <li>Refined score: {analysisSummary?.refinement?.refined_score ?? 'Unavailable'}</li>
                      <li>Score difference: {analysisSummary?.refinement?.score_difference ?? 'Unavailable'}</li>
                      <li>Improved: {analysisSummary?.refinement?.improved === true ? 'true' : analysisSummary?.refinement?.improved === false ? 'false' : 'Unavailable'}</li>
                      <li>
                        Exact returned changes:{' '}
                        {analysisSummary?.refinement?.changes?.length
                          ? analysisSummary.refinement.changes
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
        ) : null}

        <section className="bottom-callout">
          <div className="bottom-callout__left">
            <Sparkles size={18} />
            <div>
              <h3>From inspiration to creation.</h3>
              <p>
                Use your ideas, references and design choices to explore fashion concepts and
                understand model insights.
              </p>
            </div>
          </div>

          <button type="button" className="learn-more-button">
            Learn more <ArrowRight size={16} />
          </button>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}

export default DesignStudio
