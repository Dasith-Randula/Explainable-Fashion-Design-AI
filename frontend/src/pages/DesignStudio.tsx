import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  BrainCircuit,
  ChartNoAxesColumnIncreasing,
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
  Wand2,
} from 'lucide-react'
import SiteFooter from '../components/SiteFooter'
import SiteHeader from '../components/SiteHeader'
import inspirationImage from '../../assets/purple-outfit-product.png'
import '../styles/design-studio.css'

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

function DesignStudio() {
  const [formValues, setFormValues] = useState(initialForm)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const [analysisMessage, setAnalysisMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    return () => {
      if (uploadedImage?.startsWith('blob:')) {
        URL.revokeObjectURL(uploadedImage)
      }
    }
  }, [uploadedImage])

  const currentPreviewImage = uploadedImage ?? ''
  const hasUploadedImage = Boolean(uploadedImage)

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
    setUploadedFileName(null)
    setAnalysisMessage('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    if (uploadedImage?.startsWith('blob:')) {
      URL.revokeObjectURL(uploadedImage)
    }

    const objectUrl = URL.createObjectURL(file)
    setUploadedImage(objectUrl)
    setUploadedFileName(file.name)
    setAnalysisMessage('Reference image loaded for analysis.')
  }

  const handleRemoveImage = () => {
    if (uploadedImage?.startsWith('blob:')) {
      URL.revokeObjectURL(uploadedImage)
    }
    setUploadedImage(null)
    setUploadedFileName(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleAnalyze = () => {
    setAnalysisMessage('Design inputs ready for analysis.')
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

            <button
              type="button"
              className="primary-cta"
              onClick={handleAnalyze}
              disabled={!hasUploadedImage}
            >
              <Sparkles size={17} />
              Analyze Design →
            </button>

            {!hasUploadedImage ? (
              <p className="analysis-message analysis-message--warning">Upload a fashion image first.</p>
            ) : null}

            {analysisMessage ? <p className="analysis-message">{analysisMessage}</p> : null}
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
