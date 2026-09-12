import { Link } from 'react-router-dom'

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <span className="brand__name">threadwise</span>
          <span className="brand__separator">·</span>
          <span>Fashion, informed by AI.</span>
        </div>

        <div className="site-footer__links">
          <Link to="/about">About Us</Link>
          <Link to="/contact">Contact Us</Link>
        </div>

        <div className="site-footer__meta">Demo / sample data</div>
      </div>
    </footer>
  )
}

export default SiteFooter
