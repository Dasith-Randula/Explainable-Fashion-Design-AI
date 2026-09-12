import { BookOpen, BriefcaseBusiness, Building2, Globe } from 'lucide-react'

function ContactInfo() {
  return (
    <aside className="contact-sidebar">
      <div className="contact-info-card">
        <h2>Get in touch</h2>

        <div className="contact-info-row">
          <div className="contact-info-row__icon">
            <BriefcaseBusiness size={18} />
          </div>
          <div>
            <span>Project</span>
            <p>Explainable Fashion Design AI</p>
          </div>
        </div>

        <div className="contact-info-row">
          <div className="contact-info-row__icon">
            <Building2 size={18} />
          </div>
          <div>
            <span>Institution</span>
            <p>
              SLTC Research University
              <br />
              Sri Lanka
            </p>
          </div>
        </div>

        <div className="contact-info-row">
          <div className="contact-info-row__icon">
            <BookOpen size={18} />
          </div>
          <div>
            <span>Project type</span>
            <p>CCS4310 Deep Learning Coursework</p>
          </div>
        </div>
      </div>

      <div className="contact-social-card">
        <h3>Follow the project</h3>
        <div className="contact-social-row">
          <button type="button" className="contact-social-button" aria-label="GitHub demo button" disabled>
            <Globe size={18} />
          </button>
          <button type="button" className="contact-social-button" aria-label="LinkedIn demo button" disabled>
            <Globe size={18} />
          </button>
        </div>
      </div>
    </aside>
  )
}

export default ContactInfo
