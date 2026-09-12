import { useState } from 'react'
import { Mail, MessageSquareText, PencilLine, User } from 'lucide-react'

type FormValues = {
  name: string
  email: string
  subject: string
  message: string
}

type FormErrors = Partial<Record<keyof FormValues, string>>

const initialValues: FormValues = {
  name: '',
  email: '',
  subject: '',
  message: '',
}

function ContactForm() {
  const [values, setValues] = useState<FormValues>(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})
  const [successMessage, setSuccessMessage] = useState('')

  const validate = () => {
    const nextErrors: FormErrors = {}

    if (!values.name.trim()) {
      nextErrors.name = 'Name is required.'
    }

    if (!values.email.trim()) {
      nextErrors.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      nextErrors.email = 'Please enter a valid email address.'
    }

    if (!values.subject.trim()) {
      nextErrors.subject = 'Subject is required.'
    }

    if (!values.message.trim()) {
      nextErrors.message = 'Message is required.'
    } else if (values.message.length > 500) {
      nextErrors.message = 'Message must be 500 characters or fewer.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleChange = (field: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setSuccessMessage('')
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!validate()) {
      return
    }

    setSuccessMessage('Message saved for this demo.')
    setValues(initialValues)
    setErrors({})
  }

  return (
    <section className="contact-form-card">
      <h2>Send us a message</h2>
      <p>Fill in the form below and we’ll keep your message available for this demo session.</p>

      {successMessage ? <div className="contact-form-card__success">{successMessage}</div> : null}

      <form onSubmit={handleSubmit} noValidate>
        <div className="contact-field">
          <label htmlFor="contact-name">Name</label>
          <div className={`contact-field__input ${errors.name ? 'is-invalid' : ''}`}>
            <User size={16} />
            <input
              id="contact-name"
              type="text"
              value={values.name}
              onChange={(event) => handleChange('name', event.target.value)}
              placeholder="Your name"
            />
          </div>
          {errors.name ? <span className="contact-field__error">{errors.name}</span> : null}
        </div>

        <div className="contact-field">
          <label htmlFor="contact-email">Email</label>
          <div className={`contact-field__input ${errors.email ? 'is-invalid' : ''}`}>
            <Mail size={16} />
            <input
              id="contact-email"
              type="email"
              value={values.email}
              onChange={(event) => handleChange('email', event.target.value)}
              placeholder="you@example.com"
            />
          </div>
          {errors.email ? <span className="contact-field__error">{errors.email}</span> : null}
        </div>

        <div className="contact-field">
          <label htmlFor="contact-subject">Subject</label>
          <div className={`contact-field__input ${errors.subject ? 'is-invalid' : ''}`}>
            <PencilLine size={16} />
            <input
              id="contact-subject"
              type="text"
              value={values.subject}
              onChange={(event) => handleChange('subject', event.target.value)}
              placeholder="How can we help?"
            />
          </div>
          {errors.subject ? <span className="contact-field__error">{errors.subject}</span> : null}
        </div>

        <div className="contact-field">
          <label htmlFor="contact-message">Message</label>
          <div className={`contact-field__input contact-field__input--textarea ${errors.message ? 'is-invalid' : ''}`}>
            <MessageSquareText size={16} />
            <textarea
              id="contact-message"
              value={values.message}
              onChange={(event) => handleChange('message', event.target.value.slice(0, 500))}
              placeholder="Tell us more..."
              rows={6}
            />
          </div>

          <div className="contact-field__meta">
            {errors.message ? <span className="contact-field__error">{errors.message}</span> : <span />}
            <span className="contact-field__counter">{values.message.length} / 500</span>
          </div>
        </div>

        <div className="contact-form-card__actions">
          <button type="submit" className="contact-primary-button">
            Send message <span aria-hidden="true">→</span>
          </button>
          <span>We aim to respond within 1–2 business days.</span>
        </div>
      </form>
    </section>
  )
}

export default ContactForm
