import { BookOpenText, CircleHelp } from 'lucide-react'
import { Link } from 'react-router-dom'

function QuickHelp() {
  return (
    <aside className="contact-quick-help">
      <h2>Need a quicker answer?</h2>
      <p>Explore the available project pages and common guidance.</p>

      <div className="contact-quick-help__cards">
        <div className="contact-quick-help__card">
          <div className="contact-quick-help__icon">
            <BookOpenText size={18} />
          </div>
          <h3>Help Center</h3>
          <p>Guides to using the Design Studio and analysis features.</p>
          <Link to="/design-studio" className="contact-inline-link">
            View guide <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="contact-quick-help__card">
          <div className="contact-quick-help__icon">
            <CircleHelp size={18} />
          </div>
          <h3>Frequently Asked Questions</h3>
          <p>Quick answers about predictions, explainability and design analysis.</p>
          <button type="button" className="contact-inline-link contact-inline-link--button">
            View FAQs <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      <div className="contact-faq">
        <div className="contact-faq__item">
          <h4>What does threadwise analyze?</h4>
          <p>Visual features, demand, preference and explainable AI outputs.</p>
        </div>

        <div className="contact-faq__item">
          <h4>Does threadwise generate fashion images?</h4>
          <p>Production image generation is currently unavailable; the current application focuses on analysis and refinement.</p>
        </div>

        <div className="contact-faq__item">
          <h4>Are forecast values live market data?</h4>
          <p>No. Demo UI values are clearly labelled; real model predictions are shown only through supported analysis workflows.</p>
        </div>
      </div>
    </aside>
  )
}

export default QuickHelp
