import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BrainCircuit,
  ChartNoAxesCombined,
  Leaf,
  Lightbulb,
  SlidersHorizontal,
  Sparkles,
  Shirt,
} from 'lucide-react'
import SiteFooter from '../components/SiteFooter'
import SiteHeader from '../components/SiteHeader'
import purpleCoatModel from '../../assets/purple-coat-model.png'
import purpleOutfitFlatlay from '../../assets/purple-outfit-flatlay.png'
import '../styles/about.css'

const missionCards = [
  {
    icon: Sparkles,
    title: 'Empower creativity',
    text: 'Give users tools to explore fashion concepts and understand how design choices influence predictions.',
  },
  {
    icon: BrainCircuit,
    title: 'Make AI more understandable',
    text: 'Use explainable AI to make demand and preference predictions easier to interpret.',
  },
  {
    icon: Leaf,
    title: 'Support smarter decisions',
    text: 'Help users compare fashion ideas and refine them using evidence from trained models.',
  },
]

const steps = [
  {
    icon: Shirt,
    title: 'Share your design',
    text: 'Upload a fashion image and provide relevant design information.',
  },
  {
    icon: ChartNoAxesCombined,
    title: 'Analyze the concept',
    text: 'Visual, demand and preference models evaluate the fashion concept.',
  },
  {
    icon: Lightbulb,
    title: 'Understand the reasoning',
    text: 'SHAP explanations reveal the factors influencing the prediction.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Refine and make it yours',
    text: 'Review refinement suggestions, compare scores and keep the design direction you prefer.',
  },
]

const teamMembers = [
  { name: 'Maleesha', role: 'Fashion Generation / Deep Learning', accent: 'about-team-card__avatar--rose' },
  { name: 'Dasith', role: 'Visual Features / CLIP', accent: 'about-team-card__avatar--gold' },
  { name: 'Nilakshi', role: 'Demand Forecasting', accent: 'about-team-card__avatar--lavender' },
  { name: 'Binara', role: 'Customer Preference Modelling', accent: 'about-team-card__avatar--mauve' },
  { name: 'Dewmi', role: 'Explainable AI / Closed-Loop Refinement', accent: 'about-team-card__avatar--sage' },
]

function About() {
  const missionRef = useRef<HTMLElement | null>(null)
  const navigate = useNavigate()

  const handleMissionScroll = () => {
    missionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="about-page">
      <SiteHeader />

      <main className="page-shell about-shell">
        <section className="about-story">
          <div className="about-story__content">
            <p className="hero-eyebrow">OUR STORY</p>

            <h1 className="hero-title">
              <span className="hero-title__line hero-title__line--dark">A more personal</span>
              <span className="hero-title__line hero-title__line--dark">way to fashion</span>
            </h1>

            <p className="about-story__copy">
              threadwise combines fashion creativity with deep learning, machine learning and explainable AI to help users explore, analyse and refine fashion ideas.
            </p>

            <button type="button" className="about-primary-button" onClick={handleMissionScroll}>
              Our mission <span aria-hidden="true">↓</span>
            </button>
          </div>

          <div className="about-story__visual">
            <div className="about-editorial">
              <div className="about-editorial__texture">
                <img src={purpleOutfitFlatlay} alt="Fashion flatlay texture detail" />
              </div>

              <div className="about-editorial__main">
                <img src={purpleCoatModel} alt="Threadwise purple fashion concept" />
              </div>

              <div className="about-editorial__quote">
                <p>More understanding.<br />Better decisions.<br />Smarter fashion.</p>
              </div>
            </div>

            <div className="about-story__scribble" aria-hidden="true">
              Style
              <span>meets</span>
              intelligence.
            </div>
          </div>
        </section>

        <section ref={missionRef} className="about-mission">
          <p className="hero-eyebrow">OUR MISSION</p>

          <div className="about-mission__heading-row">
            <h2>Style for a brighter tomorrow</h2>
            <p>
              We’re building a more understandable, creative and data-informed fashion experience powered by AI and human decision-making.
            </p>
          </div>

          <div className="about-mission__cards">
            {missionCards.map(({ icon: Icon, title, text }) => (
              <article key={title} className="about-mission-card">
                <div className="about-mission-card__icon-wrap">
                  <Icon size={22} />
                </div>

                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="about-how-it-works">
          <div className="about-how-it-works__header">
            <div>
              <p className="hero-eyebrow">HOW IT WORKS</p>
              <h2>AI-powered. Human inspired.</h2>
            </div>

            <button type="button" className="about-secondary-button" onClick={() => navigate('/design-studio')}>
              Try it now <span aria-hidden="true">→</span>
            </button>
          </div>

          <p className="about-how-it-works__support">
            threadwise connects multiple trained models into one understandable fashion analysis workflow.
          </p>

          <div className="about-steps">
            {steps.map(({ icon: Icon, title, text }, index) => (
              <div key={title} className="about-step">
                <div className="about-step__number">0{index + 1}</div>
                <div className="about-step__icon-wrap">
                  <Icon size={22} />
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
                {index < steps.length - 1 ? <div className="about-step__arrow" aria-hidden="true">→</div> : null}
              </div>
            ))}
          </div>
        </section>

        <section className="about-people">
          <div className="about-people__content">
            <div className="about-people__intro">
              <p className="hero-eyebrow">OUR PEOPLE</p>
              <h2>
                A student team
                <span>with one vision</span>
              </h2>
              <p>
                This project was developed as a collaborative deep learning coursework project, combining fashion AI, demand forecasting, visual learning and explainable AI.
              </p>
            </div>

            <div className="about-people__layout">
              <div className="about-team-grid">
                {teamMembers.map(({ name, role, accent }) => (
                  <article key={name} className="about-team-card">
                    <div className={`about-team-card__avatar ${accent}`} aria-label={`${name} initials`}>
                      {name
                        .split(' ')
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join('')}
                    </div>

                    <h3>{name}</h3>
                    <p>{role}</p>
                  </article>
                ))}
              </div>

              <aside className="about-quote-card">
                <div className="about-quote-card__mark" aria-hidden="true">
                  “
                </div>
                <p>
                  Fashion AI becomes more useful when people can understand why a prediction was made — not just see the final score.
                </p>
                <span>— threadwise project team</span>
              </aside>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}

export default About
