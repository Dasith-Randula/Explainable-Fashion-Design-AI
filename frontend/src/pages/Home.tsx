import { ArrowUpRight, ChartColumnIncreasing, Search, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import SiteFooter from '../components/SiteFooter'
import SiteHeader from '../components/SiteHeader'
import FeatureCard from '../components/home/FeatureCard'
import Hero from '../components/home/Hero'
import InspirationCard from '../components/home/InspirationCard'
import inspirationImage from '../../assets/purple-coat-model.png'

function Home() {
  return (
    <div className="home-page">
      <SiteHeader />

      <main className="page-shell">
        <Hero />

        <section className="feature-section">
          <div className="section-heading">
            <h2>From inspiration to your next design</h2>
            <Link to="/explore" className="section-link">
              View all <ArrowUpRight size={16} />
            </Link>
          </div>

          <div className="feature-grid">
            <FeatureCard
              step="01 / CREATE"
              title="Make it yours."
              description="Turn an idea into a new fashion concept with the help of AI."
              icon={Sparkles}
            />
            <FeatureCard
              step="02 / DISCOVER"
              title="Find your direction."
              description="Explore styles, trends and visuals to fuel your next collection."
              icon={Search}
            />
            <FeatureCard
              step="03 / UNDERSTAND"
              title="See the reasoning."
              description="Understand the factors behind a prediction."
              icon={ChartColumnIncreasing}
            />
          </div>
        </section>

        <section className="inspiration-section">
          <div className="section-heading">
            <div>
              <h2>A little inspiration</h2>
              <p>Explore concepts, remix ideas, and make them yours.</p>
            </div>
            <Link to="/explore" className="section-link">
              View all <ArrowUpRight size={16} />
            </Link>
          </div>

          <div className="inspiration-grid">
            <InspirationCard
              badge="Sample concept"
              title="Plum silhouette"
              description="Explore the silhouette. Make it yours."
              image={inspirationImage}
            />
            <InspirationCard
              badge="Sample concept"
              title="The violet edit"
              description="Explore the silhouette. Make it yours."
              image={inspirationImage}
            />
            <InspirationCard
              badge="Sample concept"
              title="Evening ensemble"
              description="Explore the silhouette. Make it yours."
              image={inspirationImage}
            />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}

export default Home
