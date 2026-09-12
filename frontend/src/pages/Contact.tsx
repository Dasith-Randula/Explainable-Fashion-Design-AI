import ContactForm from '../components/contact/ContactForm'
import ContactInfo from '../components/contact/ContactInfo'
import QuickHelp from '../components/contact/QuickHelp'
import SiteFooter from '../components/SiteFooter'
import SiteHeader from '../components/SiteHeader'
import purpleSneakersDetail from '../../assets/purple-sneakers-detail.png'
import '../styles/contact.css'

function Contact() {
  return (
    <div className="contact-page">
      <SiteHeader />

      <main className="page-shell contact-shell">
        <section className="contact-hero">
          <div className="contact-hero__content">
            <p className="hero-eyebrow">CONTACT US</p>

            <h1>We’d love to hear from you.</h1>

            <p className="contact-hero__copy">
              Have a question, idea, or feedback?
              <br />
              Share it with the threadwise project team.
            </p>

            <div className="contact-hero__scribble" aria-hidden="true">
              Ideas
              <span>look better</span>
              here.
            </div>
          </div>

          <div className="contact-hero__visual">
            <div className="contact-editorial-card">
              <div className="contact-editorial-card__image-wrap">
                <img src={purpleSneakersDetail} alt="Purple sneaker detail" />
              </div>

              <div className="contact-editorial-card__caption">
                <span>THE PURPLE EDIT</span>
                <span>PERSPECTIVE ↗</span>
              </div>
            </div>
          </div>
        </section>

        <section className="contact-layout">
          <div className="contact-layout__main">
            <ContactForm />
          </div>

          <div className="contact-layout__side">
            <ContactInfo />
            <QuickHelp />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}

export default Contact
