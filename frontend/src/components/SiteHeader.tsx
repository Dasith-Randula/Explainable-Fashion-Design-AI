import { Link, NavLink } from 'react-router-dom'

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Design Studio', to: '/design-studio' },
  { label: 'Explore', to: '/explore' },
  { label: 'Forecast', to: '/forecast' },
  { label: 'My Designs', to: '/my-designs' },
  { label: 'About Us', to: '/about' },
  { label: 'Contact Us', to: '/contact' },
]

function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link to="/" className="brand" aria-label="Threadwise home">
          <span className="brand__name">threadwise</span>
          <span className="brand__mark" aria-hidden="true">
            ✦
          </span>
        </Link>

        <nav className="site-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `site-nav__link${isActive ? ' site-nav__link--active' : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <NavLink to="/login" className="site-header__signin">
          Sign in <span aria-hidden="true">↗</span>
        </NavLink>
      </div>
    </header>
  )
}

export default SiteHeader
